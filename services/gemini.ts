
import { GoogleGenAI, Type } from "@google/genai";
import { PRDData, PRDFormInputs, GeminiError } from "../types";

export const generatePRD = async (inputs: PRDFormInputs): Promise<PRDData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const roadmapContext = inputs.roadmapPhases.length > 0 
    ? `The user has defined the following roadmap phases which you must flesh out with realistic milestones: ${inputs.roadmapPhases.map(p => `${p.name} (Goals: ${p.keyGoals})`).join(', ')}`
    : "Create a logical 3-phase release roadmap (MVP, v1.1, v2.0).";

  const mainPrompt = `
    Generate a highly professional and comprehensive Product Requirements Document (PRD).
    
    Product Identity:
    - Name: ${inputs.name}
    - Executive Summary/Description: ${inputs.description}
    - Primary Users: ${inputs.targetAudience}
    - Key Objectives: ${inputs.primaryGoals}
    - Core Features: ${inputs.keyFeatures}
    
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
      parts.push({ text: `Content of file "${file.name}":\n${file.data}` });
    }
  });

  try {
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
    if (!text) throw new GeminiError('EMPTY_RESPONSE', "AI generated an empty response.");
    
    const parsed = JSON.parse(text);
    return { ...parsed, id: Date.now().toString() } as PRDData;
  } catch (err: any) {
    if (err.message?.includes('API_KEY_INVALID')) throw new GeminiError('AUTH_ERROR', "Invalid API Key.");
    throw new GeminiError('UNKNOWN', err.message || "An unexpected error occurred.");
  }
};

export const getFastResponse = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: prompt,
  });
  return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: string, imageSize: "1K" | "2K" | "4K") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio, imageSize }
    }
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};
