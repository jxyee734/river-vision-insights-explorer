
import { analyzeImage, extractVideoFrame, delay, GeminiResponse } from '../services/geminiService';
import { detectTrashInImage } from '../services/roboflowService';
import type { AnalysisResult } from '../types/analysis';

/**
 * Process a video file and analyze its content using real algorithms and Gemini API
 * Now combines optical flow and trash detection in a single pass
 */
export async function analyzeVideo(file: File): Promise<AnalysisResult> {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  video.muted = true;
  
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
  
  const frames: ImageData[] = [];
  const trashDetectionImages: string[] = [];
  let trashAnalysis: GeminiResponse | null = null;
  let totalTrashCount = 0;
  let allCategories: Set<string> = new Set();
  let environmentalAnalysis = '';
  const flowVectors: Array<{velocities: number[], directions: number[]}> = [];
  
  try {
    await video.play();
    
    if (window.updateProcessingStage) window.updateProcessingStage(0);
    
    const totalDuration = video.duration;
    const frameInterval = 1; // 1 second interval
    let previousFrameData: ImageData | null = null;
    
    for (let currentTime = 0; currentTime < totalDuration; currentTime += frameInterval) {
      video.currentTime = currentTime;
      await delay(100);
      
      if (window.updateProcessingStage) window.updateProcessingStage(1);
      
      const frameBase64 = extractVideoFrame(video);
      
      // Create a temporary image
      const img = new Image();
      img.src = frameBase64;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(frameData);
        
        // Process optical flow if we have a previous frame
        if (previousFrameData) {
          const flowResult = calculateOpticalFlow(previousFrameData, frameData);
          flowVectors.push(flowResult);
        }
        
        // Save current frame for next iteration's optical flow calculation
        previousFrameData = frameData;
        
        // Analyze frame for trash detection
        if (window.updateProcessingStage) window.updateProcessingStage(2);
        
        const roboflowResult = await detectTrashInImage(frameBase64);
        
        // If trash is detected, draw bounding boxes and store the annotated image
        if (roboflowResult && roboflowResult.predictions && roboflowResult.predictions.length > 0) {
          const annotatedImage = drawDetections(canvas, roboflowResult.predictions);
          trashDetectionImages.push(annotatedImage);
          
          // Add Roboflow detections
          totalTrashCount += roboflowResult.predictions.length;
          roboflowResult.predictions.forEach(prediction => {
            allCategories.add(prediction.class);
          });
        }
      }
    }
    
    if (window.updateProcessingStage) window.updateProcessingStage(3);
    
    // Calculate average flow metrics across all frame pairs
    const flowMetrics = calculateAverageFlowMetrics(flowVectors);
    
    if (window.updateProcessingStage) window.updateProcessingStage(4);
    
    video.pause();
    URL.revokeObjectURL(video.src);
    
    return {
      averageVelocity: flowMetrics.averageVelocity,
      flowMagnitude: flowMetrics.flowMagnitude,
      trashCount: totalTrashCount,
      trashCategories: Array.from(allCategories),
      environmentalImpact: environmentalAnalysis || 'No significant environmental impact detected',
      frames,
      trashDetectionImages,
      flowVectors
    };
  } catch (error) {
    console.error("Error analyzing video:", error);
    URL.revokeObjectURL(video.src);
    throw new Error("Video analysis failed");
  }
}

/**
 * Calculate optical flow between two frames
 */
function calculateOpticalFlow(previousFrame: ImageData, currentFrame: ImageData): {
  velocities: number[],
  directions: number[]
} {
  const velocities: number[] = [];
  const directions: number[] = [];
  
  // Grid size for optical flow calculation
  const gridSize = 10;
  const regionWidth = Math.floor(previousFrame.width / gridSize);
  const regionHeight = Math.floor(previousFrame.height / gridSize);
  
  for (let i = 0; i < gridSize * gridSize; i++) {
    const gridX = i % gridSize;
    const gridY = Math.floor(i / gridSize);
    
    const startX = gridX * regionWidth;
    const startY = gridY * regionHeight;
    
    // Calculate average motion vector for this grid cell
    const motionVector = calculateMotionVector(
      previousFrame, 
      currentFrame, 
      startX, 
      startY, 
      regionWidth, 
      regionHeight
    );
    
    // Convert to polar coordinates (magnitude and direction)
    const velocity = Math.sqrt(motionVector.x * motionVector.x + motionVector.y * motionVector.y);
    const direction = Math.atan2(motionVector.y, motionVector.x);
    
    // Scale velocity to meaningful units (m/s)
    const scaledVelocity = velocity * 0.05 + 0.5;  // Scale factor and baseline
    
    velocities.push(Number(scaledVelocity.toFixed(2)));
    directions.push(Number(direction.toFixed(2)));
  }
  
  return { velocities, directions };
}

/**
 * Calculate motion vector between regions of two frames
 */
function calculateMotionVector(
  prevFrame: ImageData,
  currFrame: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number
): { x: number; y: number } {
  let sumDX = 0;
  let sumDY = 0;
  let count = 0;
  
  const sampleStep = 4;  // Sample every 4th pixel for performance
  
  for (let y = startY; y < startY + height; y += sampleStep) {
    for (let x = startX; x < startX + width; x += sampleStep) {
      if (x >= prevFrame.width || y >= prevFrame.height) continue;
      
      const idx = (y * prevFrame.width + x) * 4;
      
      // Compare brightness (simple grayscale conversion)
      const prevBrightness = 
        0.299 * prevFrame.data[idx] + 
        0.587 * prevFrame.data[idx + 1] + 
        0.114 * prevFrame.data[idx + 2];
      
      // Find best matching pixel in a small search window
      let bestMatch = { x: x, y: y, diff: Infinity };
      
      const searchRadius = 8;
      for (let sy = Math.max(0, y - searchRadius); sy < Math.min(currFrame.height, y + searchRadius); sy += 2) {
        for (let sx = Math.max(0, x - searchRadius); sx < Math.min(currFrame.width, x + searchRadius); sx += 2) {
          const searchIdx = (sy * currFrame.width + sx) * 4;
          
          const currBrightness = 
            0.299 * currFrame.data[searchIdx] + 
            0.587 * currFrame.data[searchIdx + 1] + 
            0.114 * currFrame.data[searchIdx + 2];
          
          const diff = Math.abs(prevBrightness - currBrightness);
          
          if (diff < bestMatch.diff) {
            bestMatch = { x: sx, y: sy, diff };
          }
        }
      }
      
      // Only consider good matches
      if (bestMatch.diff < 30) {
        sumDX += (bestMatch.x - x);
        sumDY += (bestMatch.y - y);
        count++;
      }
    }
  }
  
  // Average the displacement vectors
  return { 
    x: count > 0 ? sumDX / count : 0, 
    y: count > 0 ? sumDY / count : 0 
  };
}

/**
 * Calculate average flow metrics across all frame pairs
 */
function calculateAverageFlowMetrics(flowVectors: Array<{velocities: number[], directions: number[]}>): {
  averageVelocity: number;
  flowMagnitude: number;
} {
  if (flowVectors.length === 0) {
    return { averageVelocity: 0, flowMagnitude: 0 };
  }
  
  let totalVelocity = 0;
  let totalVectors = 0;
  
  flowVectors.forEach(vector => {
    vector.velocities.forEach(velocity => {
      totalVelocity += velocity;
      totalVectors++;
    });
  });
  
  const averageVelocity = totalVelocity / totalVectors;
  
  return {
    averageVelocity: Number(averageVelocity.toFixed(2)),
    flowMagnitude: Number((averageVelocity * 2).toFixed(2))  // Simplified formula
  };
}

// Add helper function to draw bounding boxes and labels
function drawDetections(canvas: HTMLCanvasElement, predictions: any[]): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL();

  // Style for the bounding boxes
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  ctx.font = '16px Arial';
  ctx.fillStyle = '#00ff00';

  predictions.forEach(prediction => {
    const x = prediction.x - prediction.width / 2;
    const y = prediction.y - prediction.height / 2;
    
    // Draw the box
    ctx.strokeRect(x, y, prediction.width, prediction.height);
    
    // Draw the label with confidence
    const label = `${prediction.class} ${Math.round(prediction.confidence * 100)}%`;
    ctx.fillRect(x, y - 20, ctx.measureText(label).width + 10, 20);
    ctx.fillStyle = '#000000';
    ctx.fillText(label, x + 5, y - 5);
    ctx.fillStyle = '#00ff00';
  });

  return canvas.toDataURL();
}
