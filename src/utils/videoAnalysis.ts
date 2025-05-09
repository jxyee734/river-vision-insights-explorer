
import { calculateOpticalFlow } from './tensorflowFlowAnalysis';
import { detectTrashInImage } from '../services/roboflowService';
import type { AnalysisResult } from '../types/analysis';

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

/**
 * Process a video file and analyze its content using TensorFlow.js and object detection
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
  let totalTrashCount = 0;
  let allCategories: Set<string> = new Set();
  let totalFlowMagnitude = 0;
  let flowVectorsCount = 0;
  
  try {
    await video.play();
    
    if (window.updateProcessingStage) window.updateProcessingStage(0);
    
    const totalDuration = video.duration;
    const frameInterval = 1; // 1 second interval
    
    let previousFrameData: ImageData | null = null;
    
    for (let currentTime = 0; currentTime < totalDuration; currentTime += frameInterval) {
      video.currentTime = currentTime;
      await new Promise(r => setTimeout(r, 100));
      
      if (window.updateProcessingStage) window.updateProcessingStage(1);
      
      // Directly capture frame from video element to a canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(frameData);
        
        // Analyze flow with TensorFlow if we have at least two frames
        if (previousFrameData) {
          if (window.updateProcessingStage) window.updateProcessingStage(2);
          try {
            const flowResult = await calculateOpticalFlow(previousFrameData, frameData);
            totalFlowMagnitude += flowResult.flowMagnitude;
            flowVectorsCount++;
          } catch (error) {
            console.error('TensorFlow flow analysis error:', error);
          }
        }
        
        previousFrameData = frameData;
        
        // Get frame as base64 for Roboflow API
        const frameBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
        
        if (window.updateProcessingStage) window.updateProcessingStage(2);
        
        // Analyze directly with Roboflow API 
        try {
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
        } catch (error) {
          console.error('Roboflow API error:', error);
        }
      }
    }
    
    if (window.updateProcessingStage) window.updateProcessingStage(3);
    
    // Calculate average flow metrics from TensorFlow results
    const averageFlowMagnitude = flowVectorsCount > 0 ? totalFlowMagnitude / flowVectorsCount : 0;
    
    if (window.updateProcessingStage) window.updateProcessingStage(4);
    
    video.pause();
    URL.revokeObjectURL(video.src);
    
    return {
      averageVelocity: Number(averageFlowMagnitude.toFixed(2)),
      flowMagnitude: Number((averageFlowMagnitude * 2).toFixed(2)),
      trashCount: totalTrashCount,
      trashCategories: Array.from(allCategories),
      environmentalImpact: '',
      frames,
      trashDetectionImages: trashDetectionImages || []
    };
  } catch (error) {
    console.error("Error analyzing video:", error);
    URL.revokeObjectURL(video.src);
    throw new Error("Video analysis failed");
  }
}
