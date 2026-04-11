import { GoogleGenAI, Type } from "@google/genai";
import { PRDData, PRDFormInputs, GeminiError } from "../types";
import { sanitizeInput, retryWithBackoff, RateLimiter, logger, trackEvent } from "../utils/security";

// Singleton AI instance to avoid recreating on every call
let aiInstance: GoogleGenAI | null = null;

const getAIInstance = (): GoogleGenAI => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      logger.error("API Key not configured");
      throw new Error("API Key not configured. Please set GEMINI_API_KEY environment variable.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Rate limiter for API calls (1 second between calls)
const apiRateLimiter = new RateLimiter(1000);

// Video generation timeout constants
const VIDEO_POLL_INTERVAL = 10000; // 10 seconds
const VIDEO_MAX_RETRIES = 30; // 5 minutes max

export const generatePRD = async (inputs: PRDFormInputs): Promise<PRDData> => {
  trackEvent('prd_generation_started', { productName: inputs.name });
  const startTime = Date.now();
  
  // Validate inputs
  const validation = validatePRDFormInputs(inputs);
  if (!validation.valid) {
    throw new GeminiError('VALIDATION_ERROR', validation.errors[0]?.message || 'Invalid input');
  }

  await apiRateLimiter.wait();
  const ai = getAIInstance();
  
  const sanitizedInputs = {
    name: sanitizeInput(inputs.name),
    description: sanitizeInput(inputs.description),
    targetAudience: sanitizeInput(inputs.targetAudience),
    primaryGoals: sanitizeInput(inputs.primaryGoals),
    keyFeatures: sanitizeInput(inputs.keyFeatures),
  };

  const roadmapContext = inputs.roadmapPhases.length > 0 
    ? `The user has defined the following roadmap phases which you must flesh out with realistic milestones: ${inputs.roadmapPhases.map(p => `${sanitizeInput(p.name)} (Goals: ${sanitizeInput(p.keyGoals)})`).join(', ')}`
    : "Create a logical 3-phase release roadmap (MVP, v1.1, v2.0).";

  const mainPrompt = `
    Generate a highly professional and comprehensive Product Requirements Document (PRD).
    
    Product Identity:
    - Name: ${sanitizedInputs.name}
    - Executive Summary/Description: ${sanitizedInputs.description}
    - Primary Users: ${sanitizedInputs.targetAudience}
    - Key Objectives: ${sanitizedInputs.primaryGoals}
    - Core Features: ${sanitizedInputs.keyFeatures}
    
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
    The user has attached ${inputs.contextFiles.length} files as additional context. 
    Analyze the contents of these files (images or text) to inform the PRD.

    Output the data in strict JSON format matching the requested schema.
  `;

  const parts: any[] = [{ text: mainPrompt }];

  inputs.contextFiles.forEach(file => {
    if (file.type.startsWith('image/')) {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.data.split(',')[1]
        }
      });
    } else {
      parts.push({ text: `Content of file "${sanitizeInput(file.name)}":\n${sanitizeInput(file.data)}` });
    }
  });

  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
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
    }, 3, 1000);

    const text = response.text;
    if (!text) {
      logger.error('Empty response from AI');
      throw new GeminiError('EMPTY_RESPONSE', "AI generated an empty response.");
    }
    
    const parsed = JSON.parse(text);
    const result = { ...parsed, id: Date.now().toString() } as PRDData;
    
    const duration = Date.now() - startTime;
    trackEvent('prd_generation_completed', { duration, productName: sanitizedInputs.name });
    logger.info('PRD generation completed', { duration, productName: sanitizedInputs.name });
    
    return result;
  } catch (err: any) {
    logger.error('PRD generation failed', err);
    trackEvent('prd_generation_failed', { error: err.message });
    
    if (err.message?.includes('API_KEY_INVALID')) {
      throw new GeminiError('AUTH_ERROR', "Invalid API Key.");
    }
    if (err instanceof GeminiError) throw err;
    throw new GeminiError('UNKNOWN', err.message || "An unexpected error occurred.");
  }
};

// Helper function to validate PRD form inputs
function validatePRDFormInputs(inputs: PRDFormInputs): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];
  
  if (!inputs.name || inputs.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required' });
  }
  if (!inputs.description || inputs.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' });
  }
  if (!inputs.targetAudience || inputs.targetAudience.trim().length === 0) {
    errors.push({ field: 'targetAudience', message: 'Target audience is required' });
  }
  if (!inputs.primaryGoals || inputs.primaryGoals.trim().length === 0) {
    errors.push({ field: 'primaryGoals', message: 'Primary goals is required' });
  }
  if (!inputs.keyFeatures || inputs.keyFeatures.trim().length === 0) {
    errors.push({ field: 'keyFeatures', message: 'Key features is required' });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export const getFastResponse = async (prompt: string) => {
  await apiRateLimiter.wait();
  const ai = getAIInstance();
  
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: sanitizeInput(prompt),
      });
    }, 3, 1000);
    
    return response.text || "Sorry, I couldn't process that request.";
  } catch (err: any) {
    logger.error('Fast response failed', err);
    throw err;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string, imageSize: "1K" | "2K" | "4K") => {
  await apiRateLimiter.wait();
  const ai = getAIInstance();
  
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: sanitizeInput(prompt) }] },
        config: {
          imageConfig: { aspectRatio, imageSize }
        }
      });
    }, 3, 1000);
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (err: any) {
    logger.error('Image generation failed', err);
    throw err;
  }
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
  await apiRateLimiter.wait();
  const ai = getAIInstance();
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: sanitizeInput(prompt),
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });

    // Poll with timeout protection
    let retries = 0;
    while (!operation.done && retries < VIDEO_MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, VIDEO_POLL_INTERVAL));
      operation = await ai.operations.getVideosOperation({ operation });
      retries++;
      
      logger.info(`Video generation polling`, { progress: retries, max: VIDEO_MAX_RETRIES });
    }
    
    if (!operation.done) {
      logger.error('Video generation timeout');
      throw new Error('Video generation timeout after 5 minutes');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('No video URL returned from API');
    }
    
    trackEvent('video_generation_completed', { aspectRatio });
    return `${downloadLink}&key=${process.env.API_KEY || process.env.GEMINI_API_KEY || ''}`;
  } catch (err: any) {
    logger.error('Video generation failed', err);
    trackEvent('video_generation_failed', { error: err.message });
    throw err;
  }
};
