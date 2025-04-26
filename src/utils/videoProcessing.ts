
// This file is now just a pass-through for imports since we're using videoAnalysis.ts instead
import { analyzeImage, extractVideoFrame } from '../services/geminiService';
import type { GeminiResponse } from '../services/geminiService';

// Export the functions we're importing so they can be used elsewhere
export { analyzeImage, extractVideoFrame };
export type { GeminiResponse };
