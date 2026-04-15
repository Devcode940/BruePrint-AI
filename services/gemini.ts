
import { GoogleGenAI, Type } from "@google/genai";
import { PRDData, PRDFormInputs, GeminiError } from "../types";

// This service is deprecated. Use api.ts for server-side API calls.
// This file is kept for backward compatibility only.

export const generatePRD = async (inputs: PRDFormInputs): Promise<PRDData> => {
  throw new GeminiError('DEPRECATED', 'Direct API calls are deprecated. Please use the server-side API.');
};

export const getFastResponse = async (prompt: string) => {
  throw new GeminiError('DEPRECATED', 'Direct API calls are deprecated. Please use the server-side API.');
};

export const generateImage = async (prompt: string, aspectRatio: string, imageSize: "1K" | "2K" | "4K") => {
  throw new GeminiError('DEPRECATED', 'Direct API calls are deprecated. Please use the server-side API.');
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
  throw new GeminiError('DEPRECATED', 'Direct API calls are deprecated. Please use the server-side API.');
};
