import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Initialize AI with server-side API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Rate limiting store (in-memory, use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  let userLimit = rateLimitStore.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    userLimit = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(ip, userLimit);
  }

  if (userLimit.count >= maxRequests) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) 
    });
  }

  userLimit.count++;
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate PRD endpoint with streaming support
app.post('/api/generate-prd', rateLimiter, async (req, res) => {
  try {
    const { inputs, stream = false } = req.body;

    if (!inputs || !inputs.name || !inputs.description) {
      return res.status(400).json({ error: 'Missing required fields: name and description' });
    }

    // Sanitize inputs
    const sanitizeInput = (input: string): string => {
      return input.replace(/[<>\"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
        };
        return entities[char];
      });
    };

    const sanitizedInputs = {
      ...inputs,
      name: sanitizeInput(inputs.name),
      description: sanitizeInput(inputs.description),
      targetAudience: inputs.targetAudience ? sanitizeInput(inputs.targetAudience) : '',
      keyFeatures: inputs.keyFeatures?.map((f: string) => sanitizeInput(f)) || [],
      contextFiles: inputs.contextFiles || []
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const prompt = `You are an expert product manager. Create a comprehensive Product Requirements Document (PRD) for:

Product Name: ${sanitizedInputs.name}
Executive Summary: ${sanitizedInputs.description}
Target Audience: ${sanitizedInputs.targetAudience || 'Not specified'}
Key Features: ${sanitizedInputs.keyFeatures.join(', ') || 'To be determined'}

Format the response as a valid JSON object with this exact structure:
{
  "productName": string,
  "executiveSummary": string,
  "problemStatement": string,
  "goals": [{ "id": string, "title": string, "description": string, "priority": "high" | "medium" | "low" }],
  "features": [{ "id": string, "title": string, "description": string, "priority": "high" | "medium" | "low", "status": "pending" | "in-progress" | "completed" }],
  "userStories": [{ "id": string, "title": string, "description": string, "acceptanceCriteria": string[], "priority": "high" | "medium" | "low" }],
  "technicalRequirements": [{ "id": string, "category": string, "description": string }],
  "successMetrics": [{ "id": string, "metric": string, "target": string }]
}`;

      try {
        const chat = ai.chats.create({
          model: 'gemini-2.0-flash-exp',
          config: { temperature: 0.7 }
        });

        const response = await chat.sendMessageStream({ message: prompt });
        
        for await (const chunk of response.stream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
          }
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Streaming failed' });
        }
      }
    } else {
      // Non-streaming response
      const prompt = `You are an expert product manager. Create a comprehensive Product Requirements Document (PRD) for:

Product Name: ${sanitizedInputs.name}
Executive Summary: ${sanitizedInputs.description}
Target Audience: ${sanitizedInputs.targetAudience || 'Not specified'}
Key Features: ${sanitizedInputs.keyFeatures.join(', ') || 'To be determined'}

Format the response as a valid JSON object with this exact structure:
{
  "productName": string,
  "executiveSummary": string,
  "problemStatement": string,
  "goals": [{ "id": string, "title": string, "description": string, "priority": "high" | "medium" | "low" }],
  "features": [{ "id": string, "title": string, "description": string, "priority": "high" | "medium" | "low", "status": "pending" | "in-progress" | "completed" }],
  "userStories": [{ "id": string, "title": string, "description": string, "acceptanceCriteria": string[], "priority": "high" | "medium" | "low" }],
  "technicalRequirements": [{ "id": string, "category": string, "description": string }],
  "successMetrics": [{ "id": string, "metric": string, "target": string }]
}`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: { temperature: 0.7 }
      });

      const responseText = result.text;
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const prdData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!prdData) {
        throw new Error('Failed to parse PRD from AI response');
      }

      res.json({ success: true, data: prdData });
    }
  } catch (error) {
    console.error('PRD generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PRD', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Chat endpoint
app.post('/api/chat', rateLimiter, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash-exp',
      config: { temperature: 0.7 }
    });

    const systemContext = context 
      ? `You are a helpful assistant discussing a PRD. Context: ${JSON.stringify(context)}. Answer questions about this PRD.`
      : 'You are a helpful assistant.';

    const result = await chat.sendMessage({ 
      message: `${systemContext}\n\nUser question: ${message}` 
    });

    res.json({ success: true, response: result.text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Chat failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Feedback endpoint (store feedback for analytics)
app.post('/api/feedback', rateLimiter, async (req, res) => {
  try {
    const { prdId, sectionId, rating, comment } = req.body;

    // In production, save to database
    console.log('[FEEDBACK]', { prdId, sectionId, rating, comment, timestamp: new Date().toISOString() });

    res.json({ success: true, message: 'Feedback recorded' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ 
      error: 'Failed to record feedback', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BlueprintAI Backend running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

export default app;
