import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export function useGemini() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // キーが無い場合は機能を無効化する（UI 側で適切に扱ってください）
    return {
      enabled: false,
      callModel: async () => { throw new Error('Gemini API key is not configured.'); }
    };
  }

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (prompt: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
          });
          
          return response.text;
      } catch (e: any) {
          console.error("Error generating content:", e);
          setError(e.message || "An unknown error occurred.");
          return null;
      } finally {
          setIsLoading(false);
      }
  };

  return {
    enabled: true,
    generateContent,
    isLoading,
    error,
  };
};
