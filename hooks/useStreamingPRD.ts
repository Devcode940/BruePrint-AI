import { useState, useEffect, useRef, useCallback } from 'react';

interface UseStreamingPRDOptions {
  backendUrl: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseStreamingPRDReturn {
  isStreaming: boolean;
  progress: number;
  error: Error | null;
  generatePRD: (inputs: any) => Promise<void>;
  cancelStream: () => void;
  accumulatedText: string;
}

export function useStreamingPRD({
  backendUrl,
  onChunk,
  onComplete,
  onError
}: UseStreamingPRDOptions): UseStreamingPRDReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [accumulatedText, setAccumulatedText] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const textBufferRef = useRef('');

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setProgress(0);
  }, []);

  const generatePRD = useCallback(async (inputs: any) => {
    // Cancel any existing stream
    cancelStream();

    setIsStreaming(true);
    setError(null);
    setProgress(0);
    setAccumulatedText('');
    textBufferRef.current = '';

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${backendUrl}/api/generate-prd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          stream: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let receivedLength = 0;
      let contentLength = Number(response.headers.get('Content-Length')) || 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        receivedLength += value.length;
        
        // Update progress
        if (contentLength > 0) {
          setProgress(Math.min(100, Math.round((receivedLength / contentLength) * 100)));
        } else {
          // Indeterminate progress
          setProgress(prev => Math.min(95, prev + 2));
        }

        // Parse Server-Sent Events
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Stream complete
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                textBufferRef.current += parsed.chunk;
                setAccumulatedText(textBufferRef.current);
                
                // Call onChunk callback
                onChunk?.(parsed.chunk);
              }
            } catch (e) {
              // Skip malformed JSON chunks
              console.warn('Failed to parse chunk:', e);
            }
          }
        }
      }

      // Try to parse final JSON from accumulated text
      try {
        const jsonMatch = textBufferRef.current.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const prdData = JSON.parse(jsonMatch[0]);
          onComplete?.(prdData);
        } else {
          console.warn('Could not extract JSON from stream');
        }
      } catch (e) {
        console.error('Failed to parse final PRD data:', e);
      }

      setProgress(100);
      setIsStreaming(false);
      abortControllerRef.current = null;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was cancelled, don't treat as error
        setIsStreaming(false);
        return;
      }

      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      onError?.(errorObj);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [backendUrl, cancelStream, onChunk, onComplete, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelStream();
    };
  }, [cancelStream]);

  return {
    isStreaming,
    progress,
    error,
    generatePRD,
    cancelStream,
    accumulatedText
  };
}

export default useStreamingPRD;
