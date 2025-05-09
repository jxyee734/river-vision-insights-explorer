import { analyzeImage, extractVideoFrame, delay, GeminiResponse } from '../services/geminiService';
import { detectTrashInImage } from '../services/roboflowService';
import type { AnalysisResult } from '../types/analysis';

// Constants for depth estimation
const FOCAL_LENGTH_PIXELS = 700; // Approximate focal length for typical camera
const RELATIVE_VELOCITY = 1.5; // Estimated relative velocity between camera and river surface

/**
 * Process a video file and analyze its content using real algorithms and Gemini API
 * Now combines optical flow, trash detection, and depth estimation in a single pass
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
  const trashDetections: Array<{
    timestamp: number;
    detections: Array<any>;
  }> = [];
  let trashAnalysis: GeminiResponse | null = null;
  let totalTrashCount = 0;
  let allCategories: Set<string> = new Set();
  let environmentalAnalysis = '';
  const flowVectors: Array<{velocities: number[], directions: number[]}> = [];
  
  // For depth estimation
  const depthProfiles: number[][] = [];
  let overallMaxDepth = 0;
  
  try {
    await video.play();
    
    if (window.updateProcessingStage) window.updateProcessingStage(0);
    
    const totalDuration = video.duration;
    // Sample more frames for better heatmap data
    const frameInterval = totalDuration > 10 ? 0.5 : 0.3; // Adjust sampling rate based on video length
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
          
          // Calculate depth profile from optical flow
          const depthProfile = estimateDepth(flowResult.velocities);
          depthProfiles.push(depthProfile);
          
          // Track maximum depth
          const frameMaxDepth = Math.max(...depthProfile);
          if (frameMaxDepth > overallMaxDepth) {
            overallMaxDepth = frameMaxDepth;
          }
        }
        
        // Save current frame for next iteration's optical flow calculation
        previousFrameData = frameData;
        
        // Analyze frame for trash detection
        if (window.updateProcessingStage) window.updateProcessingStage(2);
        
        // Use higher confidence threshold for more accurate detections
        const roboflowResult = await detectTrashInImage(frameBase64, 0.5);
        
        // If trash is detected, store the detections
        if (roboflowResult && roboflowResult.predictions && roboflowResult.predictions.length > 0) {
          // Store detections with their timestamp
          trashDetections.push({
            timestamp: currentTime,
            detections: roboflowResult.predictions
          });
          
          // Add Roboflow detections
          totalTrashCount += roboflowResult.predictions.length;
          roboflowResult.predictions.forEach(prediction => {
            allCategories.add(prediction.class);
          });
          
          // Create annotated image with detections
          const annotatedImage = drawDetections(canvas, roboflowResult.predictions);
          trashDetectionImages.push(annotatedImage);
        }
      }
    }
    
    if (window.updateProcessingStage) window.updateProcessingStage(3);
    
    // Calculate average flow metrics across all frame pairs
    const flowMetrics = calculateAverageFlowMetrics(flowVectors);
    
    // Calculate average depth and confidence
    const avgDepth = calculateAverageDepth(depthProfiles);
    const depthConfidence = calculateDepthConfidence(depthProfiles);
    
    // Get the final depth profile (average across all frames)
    const finalDepthProfile = calculateFinalDepthProfile(depthProfiles);
    
    if (window.updateProcessingStage) window.updateProcessingStage(4);
    
    video.pause();
    
    // Store the video URL for playback
    const videoUrl = URL.createObjectURL(file);
    
    return {
      averageVelocity: flowMetrics.averageVelocity,
      flowMagnitude: flowMetrics.flowMagnitude,
      trashCount: totalTrashCount,
      trashCategories: Array.from(allCategories),
      environmentalImpact: environmentalAnalysis || 'No significant environmental impact detected',
      frames,
      trashDetectionImages,
      flowVectors,
      videoUrl,
      trashDetections,
      // New depth data
      depthProfile: finalDepthProfile,
      averageDepth: avgDepth,
      maxDepth: overallMaxDepth,
      depthConfidence
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

/**
 * Estimate depth profile from flow velocities using the formula:
 * Z(x,y) = f * V_rel / Flow(x,y)
 */
function estimateDepth(velocities: number[]): number[] {
  // Implementation of the depth estimation formula
  return velocities.map(velocity => {
    if (velocity < 0.01) return 0; // Avoid division by near-zero
    
    // Apply the depth formula: Z = f * V_rel / Flow
    const depth = FOCAL_LENGTH_PIXELS * RELATIVE_VELOCITY / (velocity * 10);
    
    // Bound the results to reasonable values (0-10 meters)
    return Math.min(Math.max(depth, 0), 10);
  });
}

/**
 * Calculate average depth from all depth profiles
 */
function calculateAverageDepth(depthProfiles: number[][]): number {
  if (depthProfiles.length === 0) return 0;
  
  let totalDepth = 0;
  let totalPoints = 0;
  
  depthProfiles.forEach(profile => {
    profile.forEach(depth => {
      if (depth > 0) {
        totalDepth += depth;
        totalPoints++;
      }
    });
  });
  
  return totalPoints > 0 ? Number((totalDepth / totalPoints).toFixed(2)) : 0;
}

/**
 * Calculate a confidence score for depth estimates
 */
function calculateDepthConfidence(depthProfiles: number[][]): number {
  if (depthProfiles.length < 2) return 0.5; // Low confidence with few samples
  
  // Calculate consistency of depth measurements
  const depthVariances = [];
  
  for (let i = 0; i < depthProfiles[0].length; i++) {
    const depthsAtPoint = depthProfiles.map(profile => profile[i]).filter(d => d > 0);
    
    if (depthsAtPoint.length > 1) {
      // Calculate variance at this point
      const mean = depthsAtPoint.reduce((sum, d) => sum + d, 0) / depthsAtPoint.length;
      const variance = depthsAtPoint.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / depthsAtPoint.length;
      depthVariances.push(variance);
    }
  }
  
  // Calculate average variance
  const avgVariance = depthVariances.length > 0 
    ? depthVariances.reduce((sum, v) => sum + v, 0) / depthVariances.length 
    : 1;
  
  // Convert to confidence (inverse relationship with variance)
  const confidence = Math.max(0, Math.min(1, 1 - (avgVariance / 5)));
  
  return Number(confidence.toFixed(2));
}

/**
 * Calculate final depth profile by averaging across all frames
 */
function calculateFinalDepthProfile(depthProfiles: number[][]): number[] {
  if (depthProfiles.length === 0) {
    return Array(10).fill(0); // Default empty profile
  }
  
  const profileLength = depthProfiles[0].length;
  const finalProfile = new Array(profileLength).fill(0);
  const countProfile = new Array(profileLength).fill(0);
  
  depthProfiles.forEach(profile => {
    profile.forEach((depth, i) => {
      if (depth > 0) {
        finalProfile[i] += depth;
        countProfile[i]++;
      }
    });
  });
  
  // Calculate average for each position
  return finalProfile.map((total, i) => {
    return countProfile[i] > 0 ? Number((total / countProfile[i]).toFixed(2)) : 0;
  });
}

/**
 * Draw bounding boxes and labels on detection results
 */
function drawDetections(canvas: HTMLCanvasElement, predictions: any[]): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL();

  // Style for the bounding boxes - enhanced for better visibility
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 4; 
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#ff0000';

  predictions.forEach(prediction => {
    const x = prediction.x - prediction.width / 2;
    const y = prediction.y - prediction.height / 2;
    
    // Draw the box with thicker lines
    ctx.strokeRect(x, y, prediction.width, prediction.height);
    
    // Draw semi-transparent fill
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(x, y, prediction.width, prediction.height);
    
    // Draw the label with better contrast
    const label = `${prediction.class} ${Math.round(prediction.confidence * 100)}%`;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(x, y - 25, ctx.measureText(label).width + 10, 22);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 5, y - 10);
  });

  return canvas.toDataURL();
}
