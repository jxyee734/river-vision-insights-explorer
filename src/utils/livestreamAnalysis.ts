
import { analyzeImage, GeminiResponse } from '../services/geminiService';
import { detectTrashInImage } from '../services/roboflowService';
import { calculateOpticalFlow } from './tensorflowFlowAnalysis';

export interface LivestreamAnalysisResult {
  flowVelocity: number;
  trashCount: number;
  trashCategories: string[];
  processedImage?: string;
  timestamp: Date;
}

/**
 * Captures a frame from an iframe element and returns its data URL
 */
export async function captureFrameFromIframe(iframe: HTMLIFrameElement): Promise<string | null> {
  try {
    // This is a workaround since we can't directly access YouTube iframe content
    // We'll create a canvas with the same dimensions as the iframe
    const canvas = document.createElement('canvas');
    canvas.width = iframe.clientWidth || 640;
    canvas.height = iframe.clientHeight || 360;
    
    // Draw a placeholder indicating we're analyzing the stream
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fill with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Analyzing YouTube Livestream...', canvas.width / 2, canvas.height / 2);
      
      // For demo purposes, we'll use this canvas as our "captured" frame
      return canvas.toDataURL('image/jpeg');
    }
    return null;
  } catch (error) {
    console.error("Error capturing frame from iframe:", error);
    return null;
  }
}

/**
 * Analyze a frame from the livestream
 */
export async function analyzeLivestreamFrame(frameData: string): Promise<LivestreamAnalysisResult> {
  try {
    // Create a temporary image to get dimensions for analysis
    const img = new Image();
    img.src = frameData;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    
    // Draw the image to the canvas
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Create a simulated "previous frame" for flow calculation
    // In a real implementation, we would store the previous frame
    const prevCanvas = document.createElement('canvas');
    prevCanvas.width = canvas.width;
    prevCanvas.height = canvas.height;
    const prevCtx = prevCanvas.getContext('2d');
    
    if (!prevCtx) {
      throw new Error("Could not get previous canvas context");
    }
    
    // Create a slightly shifted previous frame for demo purposes
    prevCtx.drawImage(img, -2, 0); // Shift 2 pixels to simulate movement
    const prevImageData = prevCtx.getImageData(0, 0, prevCanvas.width, prevCanvas.height);
    
    // Run analyses in parallel
    const [geminiResult, roboflowResult, flowResult] = await Promise.all([
      // Analyze with Gemini
      analyzeImage(frameData, 
        "Analyze this river frame and identify any trash or pollution. Return a JSON with: count (number of trash items), categories (array of types like 'plastic', 'metal'), and analysis (brief environmental impact). Be accurate and conservative in counting."
      ).catch(() => null),
      
      // Analyze with Roboflow
      detectTrashInImage(frameData).catch(() => null),
      
      // Calculate optical flow
      calculateOpticalFlow(prevImageData, imageData).catch(() => ({ flowMagnitude: 0.5, velocities: [], directions: [] }))
    ]);
    
    // Process trash detection results
    let trashCount = 0;
    const trashCategories = new Set<string>();
    
    // Add Gemini results if available
    if (geminiResult) {
      trashCount += geminiResult.count || 0;
      if (geminiResult.categories) {
        geminiResult.categories.forEach(cat => trashCategories.add(cat));
      }
    }
    
    // Add Roboflow results if available
    if (roboflowResult && roboflowResult.predictions) {
      trashCount += roboflowResult.predictions.length;
      roboflowResult.predictions.forEach(prediction => {
        trashCategories.add(prediction.class);
      });
      
      // Draw bounding boxes on detected trash
      roboflowResult.predictions.forEach(prediction => {
        const x = prediction.x - prediction.width / 2;
        const y = prediction.y - prediction.height / 2;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, prediction.width, prediction.height);
        
        ctx.fillStyle = '#00ff00';
        const label = `${prediction.class} ${Math.round(prediction.confidence * 100)}%`;
        ctx.fillRect(x, y - 20, ctx.measureText(label).width + 10, 20);
        ctx.fillStyle = '#000000';
        ctx.fillText(label, x + 5, y - 5);
      });
    }
    
    return {
      flowVelocity: flowResult ? flowResult.flowMagnitude : 0.5,
      trashCount,
      trashCategories: Array.from(trashCategories),
      processedImage: canvas.toDataURL('image/jpeg'),
      timestamp: new Date()
    };
  } catch (error) {
    console.error("Error analyzing livestream frame:", error);
    return {
      flowVelocity: 0,
      trashCount: 0,
      trashCategories: [],
      timestamp: new Date()
    };
  }
}
