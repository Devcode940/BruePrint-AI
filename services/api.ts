import { PRDData, PRDFormInputs } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const generatePRD = async (inputs: PRDFormInputs): Promise<PRDData> => {
  const response = await fetch(`${API_BASE_URL}/generate-prd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inputs),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate PRD');
  }

  const data = await response.json();
  return data as PRDData;
};

export const getFastResponse = async (prompt: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/fast-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get response');
  }

  const data = await response.json();
  return data.text;
};

export const generateImage = async (prompt: string, aspectRatio: string, imageSize: "1K" | "2K" | "4K"): Promise<string | null> => {
  const response = await fetch(`${API_BASE_URL}/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspectRatio, imageSize }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate image');
  }

  const data = await response.json();
  return data.imageUrl;
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generate-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate video');
  }

  const data = await response.json();
  return data.videoUrl;
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};
