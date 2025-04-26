
/**
 * Gemini API Service
 * Uses direct API calls instead of the SDK to avoid package installation issues
 */

const API_KEY = "AIzaSyCZcp5z56Atw_lBSWv60j5mgXklyzXSwc4";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

export interface GeminiResponse {
  text: string;
  categories?: string[];
  count?: number;
  analysis?: string;
}

/**
 * Analyzes an image using Gemini Vision API
 * @param imageData - Base64 encoded image data
 * @param prompt - Prompt for the API
 */
export async function analyzeImage(imageData: string, prompt: string): Promise<GeminiResponse> {
  try {
    // Format the request according to Gemini API specifications
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData.replace(/^data:image\/[a-z]+;base64,/, "")
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    };

    // Make the API request
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the response to extract useful information
    return parseGeminiResponse(textResponse);
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return {
      text: "Error analyzing image. Please try again.",
      categories: [],
      count: 0
    };
  }
}

/**
 * Parse the text response from Gemini into structured data
 */
function parseGeminiResponse(text: string): GeminiResponse {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/\{[\s\S]*\}/);
                      
    if (jsonMatch) {
      // Parse the JSON response if found
      const jsonStr = jsonMatch[0].replace(/```json\n|\n```/g, '');
      const parsedData = JSON.parse(jsonStr);
      return {
        text,
        categories: parsedData.categories || [],
        count: parsedData.count || 0,
        analysis: parsedData.analysis || ''
      };
    }

    // No JSON found, try to extract information from text
    const countMatch = text.match(/(\d+)\s+(trash|item|debris)/i);
    const count = countMatch ? parseInt(countMatch[1]) : 0;

    const categoryMatches = text.match(/(plastic|metal|glass|organic|paper)/ig);
    const categories = categoryMatches ? 
      Array.from(new Set(categoryMatches.map(c => c.toLowerCase()))) : 
      [];

    return {
      text,
      categories,
      count,
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return {
      text,
      categories: [],
      count: 0
    };
  }
}

/**
 * Converts canvas/image element to base64
 */
export function imageToBase64(image: HTMLCanvasElement | HTMLImageElement): string {
  if (image instanceof HTMLCanvasElement) {
    return image.toDataURL('image/jpeg');
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = image.width || 640;
  canvas.height = image.height || 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL('image/jpeg');
  }
  return '';
}

/**
 * Extract frames from video element
 */
export function extractVideoFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }
  return '';
}

/**
 * Helper function to delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
