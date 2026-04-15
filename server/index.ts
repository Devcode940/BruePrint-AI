import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { GoogleGenAI, Type } from '@google/genai';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter limit for AI endpoints
  message: 'Too many AI requests, please try again later.',
});

app.use('/api/', limiter);

// Initialize AI with server-side API key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Sanitization helper
const sanitizeHtml = (html: string): string => {
  const dom = new JSDOM('<!DOCTYPE html><html><body>' + html + '</body></html>');
  const window = dom.window;
  const purify = DOMPurify(window);
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
};

// Validate input schema
const validatePRDInputs = (inputs: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!inputs.name || typeof inputs.name !== 'string' || inputs.name.length > 200) {
    errors.push('Invalid or missing product name');
  }
  
  if (!inputs.description || typeof inputs.description !== 'string' || inputs.description.length > 2000) {
    errors.push('Invalid or missing description');
  }
  
  if (!inputs.targetAudience || typeof inputs.targetAudience !== 'string' || inputs.targetAudience.length > 500) {
    errors.push('Invalid or missing target audience');
  }
  
  if (!inputs.primaryGoals || typeof inputs.primaryGoals !== 'string' || inputs.primaryGoals.length > 500) {
    errors.push('Invalid or missing primary goals');
  }
  
  if (!inputs.keyFeatures || typeof inputs.keyFeatures !== 'string' || inputs.keyFeatures.length > 2000) {
    errors.push('Invalid or missing key features');
  }
  
  if (inputs.contextFiles && Array.isArray(inputs.contextFiles)) {
    if (inputs.contextFiles.length > 10) {
      errors.push('Maximum 10 context files allowed');
    }
    
    inputs.contextFiles.forEach((file: any, idx: number) => {
      if (!file.name || !file.type || !file.data) {
        errors.push(`Invalid file at index ${idx}`);
      }
      
      // Check file size (base64 encoded)
      if (file.data.length > 5 * 1024 * 1024) { // 5MB limit
        errors.push(`File ${file.name} exceeds size limit`);
      }
      
      // Validate file types
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain', 'text/markdown', 'application/json'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File type ${file.type} not allowed`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
};

// Generate PRD endpoint
app.post('/api/generate-prd', strictLimiter, async (req, res) => {
  try {
    const validation = validatePRDInputs(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: validation.errors });
    }
    
    const inputs = req.body;
    
    const roadmapContext = inputs.roadmapPhases && inputs.roadmapPhases.length > 0 
      ? `The user has defined the following roadmap phases which you must flesh out with realistic milestones: ${inputs.roadmapPhases.map((p: any) => `${p.name} (Goals: ${p.keyGoals})`).join(', ')}`
      : "Create a logical 3-phase release roadmap (MVP, v1.1, v2.0).";

    const mainPrompt = `
      Generate a highly professional and comprehensive Product Requirements Document (PRD).
      
      Product Identity:
      - Name: ${sanitizeHtml(inputs.name)}
      - Executive Summary/Description: ${sanitizeHtml(inputs.description)}
      - Primary Users: ${sanitizeHtml(inputs.targetAudience)}
      - Key Objectives: ${sanitizeHtml(inputs.primaryGoals)}
      - Core Features: ${sanitizeHtml(inputs.keyFeatures)}
      
      Roadmap Constraints:
      ${roadmapContext}

      Required Detail Level:
      1. Vision & Strategy: Deep dive into why this matters.
      2. Market Context: Provide a brief analysis of the problem space.
      3. User Stories: Follow "As a [role], I want [action], so that [benefit]".
      4. Functional Requirements: Break down the main description into at least 2-3 smaller, actionable sub-tasks. Each sub-task must have its own specific Title, Description, and a list of detailed Acceptance Criteria.
      5. Risks: Identify 3-4 potential risks and their mitigation strategies.
      6. Technical Constraints: Mention expected constraints (e.g., scalability, API limits, platform specificities).
      
      Context Information:
      The user has attached ${inputs.contextFiles?.length || 0} files as additional context. 
      Analyze the contents of these files (images or text) to inform the PRD.

      Output the data in strict JSON format matching the requested schema.
    `;

    const parts: any[] = [{ text: mainPrompt }];

    if (inputs.contextFiles) {
      inputs.contextFiles.forEach((file: any) => {
        if (file.type.startsWith('image/')) {
          parts.push({
            inlineData: {
              mimeType: file.type,
              data: file.data.split(',')[1]
            }
          });
        } else {
          parts.push({ text: `Content of file "${sanitizeHtml(file.name)}":\n${sanitizeHtml(file.data)}` });
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            vision: { type: Type.STRING },
            problemStatement: { type: Type.STRING },
            marketContext: { type: Type.STRING },
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            goals: { type: Type.ARRAY, items: { type: Type.STRING } },
            userStories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  action: { type: Type.STRING },
                  benefit: { type: Type.STRING }
                },
                required: ["role", "action", "benefit"]
              }
            },
            functionalRequirements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  subTasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        acceptanceCriteria: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["title", "description", "acceptanceCriteria"]
                    }
                  }
                },
                required: ["id", "title", "description", "priority", "subTasks"]
              }
            },
            nonFunctionalRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            successMetrics: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  mitigation: { type: Type.STRING }
                },
                required: ["title", "impact", "mitigation"]
              }
            },
            technicalConstraints: { type: Type.ARRAY, items: { type: Type.STRING } },
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  milestones: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["phase", "duration", "milestones"]
              }
            }
          },
          required: [
            "productName", "vision", "problemStatement", "marketContext", "targetAudience", 
            "goals", "userStories", "functionalRequirements", "nonFunctionalRequirements", 
            "successMetrics", "risks", "technicalConstraints", "roadmap"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'EMPTY_RESPONSE', message: "AI generated an empty response." });
    }
    
    const parsed = JSON.parse(text);
    res.json({ ...parsed, id: Date.now().toString() });
    
  } catch (err: any) {
    console.error('PRD Generation Error:', err);
    
    if (err.message?.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: 'AUTH_ERROR', message: "Invalid API Key." });
    }
    
    res.status(500).json({ error: 'UNKNOWN', message: err.message || "An unexpected error occurred." });
  }
});

// Fast response endpoint
app.post('/api/fast-response', strictLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.length > 1000) {
      return res.status(400).json({ error: 'INVALID_PROMPT', message: 'Invalid or missing prompt' });
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: sanitizeHtml(prompt),
    });
    
    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Fast Response Error:', err);
    res.status(500).json({ error: 'UNKNOWN', message: err.message || "An unexpected error occurred." });
  }
});

// Image generation endpoint
app.post('/api/generate-image', strictLimiter, async (req, res) => {
  try {
    const { prompt, aspectRatio, imageSize } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
      return res.status(400).json({ error: 'INVALID_PROMPT', message: 'Invalid or missing prompt' });
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: sanitizeHtml(prompt) }] },
      config: {
        imageConfig: { aspectRatio, imageSize }
      }
    });
    
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
        }
      }
    }
    
    res.status(404).json({ error: 'NO_IMAGE', message: 'No image generated' });
  } catch (err: any) {
    console.error('Image Generation Error:', err);
    res.status(500).json({ error: 'UNKNOWN', message: err.message || "An unexpected error occurred." });
  }
});

// Video generation endpoint
app.post('/api/generate-video', strictLimiter, async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
      return res.status(400).json({ error: 'INVALID_PROMPT', message: 'Invalid or missing prompt' });
    }
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: sanitizeHtml(prompt),
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    res.json({ videoUrl: downloadLink });
  } catch (err: any) {
    console.error('Video Generation Error:', err);
    res.status(500).json({ error: 'UNKNOWN', message: err.message || "An unexpected error occurred." });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
