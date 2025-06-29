import { extractVideoFrame, delay } from "../services/geminiService";
import { detectTrashInImage } from "../services/roboflowService";
import type { AnalysisResult } from "../types/analysis";

/**
 * Process a video file and analyze its content using Roboflow for trash detection
 */
export async function analyzeVideo(file: File): Promise<AnalysisResult> {
  console.log("Starting video analysis...");
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.muted = true;

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  console.log("Video loaded. Duration:", video.duration, "seconds");
  const frames: ImageData[] = [];
  const trashDetectionImages: string[] = [];
  const trashDetections: Array<{ timestamp: number; detections: Array<any> }> =
    [];
  let totalTrashCount = 0;
  let maxTrashCountPerFrame = 0; // Initialize variable to track max count per frame
  let allCategories: Set<string> = new Set();
  const flowVectors: Array<{ velocities: number[]; directions: number[] }> = [];
  const depthProfile: number[] = [];

  // Initialize frame cache and processing queue
  const frameCache = new Map();
  const processingQueue = [];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  try {
    await video.play();

    if (window.updateProcessingStage) window.updateProcessingStage(0);

    const totalDuration = video.duration;
    // Adaptive frame sampling based on video duration and motion
    const baseInterval =
      totalDuration > 30 ? 0.5 : totalDuration > 10 ? 0.3 : 0.2;
    let frameInterval = baseInterval;
    let previousFrameData: ImageData | null = null;
    let motionThreshold = 0.1; // Threshold for significant motion
    let skipFrameCount = 0;

    for (
      let currentTime = 0;
      currentTime < totalDuration;
      currentTime += frameInterval
    ) {
      console.log(`Processing frame at timestamp: ${currentTime.toFixed(2)}s`);
      video.currentTime = currentTime;
      await delay(100);

      if (window.updateProcessingStage) window.updateProcessingStage(1);

      const cacheKey = Math.round(currentTime * 100) / 100;
      let frameBase64 = frameCache.get(cacheKey);

      if (!frameBase64) {
        frameBase64 = extractVideoFrame(video);
        frameCache.set(cacheKey, frameBase64);
      }

      // Skip processing if there's minimal motion
      if (previousFrameData && skipFrameCount < 2) {
        const frameData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const motionVector = calculateMotionVector(
          previousFrameData,
          frameData,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const motionMagnitude = Math.sqrt(
          motionVector.x * motionVector.x + motionVector.y * motionVector.y,
        );

        if (motionMagnitude < motionThreshold) {
          skipFrameCount++;
          frameInterval = baseInterval * 1.5; // Increase interval for low motion
          continue;
        }
      }
      skipFrameCount = 0;
      frameInterval = baseInterval; // Reset interval

      console.log("Frame extracted:", frameBase64.substring(0, 50) + "...");

      const img = new Image();
      img.src = frameBase64;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      canvas.width = img.width;
      canvas.height = img.height;

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(frameData);

        if (previousFrameData) {
          const flowResult = calculateOpticalFlow(previousFrameData, frameData);
          flowVectors.push(flowResult);
        }
        previousFrameData = frameData;

        if (window.updateProcessingStage) window.updateProcessingStage(2);

        const confidenceThreshold = 0.25;
        console.log(
          `Calling detectTrashInImage with confidence threshold ${confidenceThreshold}`,
        );
        let roboflowResult = null;
        try {
          // Add to processing queue for parallel execution
          processingQueue.push(
            detectTrashInImage(frameBase64, confidenceThreshold),
          );

          // Process in batches of 3 frames
          if (
            processingQueue.length >= 3 ||
            currentTime + frameInterval >= totalDuration
          ) {
            const results = await Promise.allSettled(processingQueue);
            // Get the last successful result
            const lastResult = results[results.length - 1];
            if (lastResult.status === "fulfilled") {
              roboflowResult = lastResult.value;
              console.log(
                "Roboflow response:",
                JSON.stringify(roboflowResult, null, 2),
              );
            } else {
              console.warn(
                "Roboflow detection failed, continuing without trash detection:",
                lastResult.reason?.message,
              );
            }
            processingQueue.length = 0;
          }
        } catch (detectionError) {
          console.error(
            `Roboflow detection failed at ${currentTime}s:`,
            detectionError,
          );
          // Continue processing without failing the entire analysis
        }

        if (
          roboflowResult &&
          roboflowResult.predictions &&
          roboflowResult.predictions.length > 0
        ) {
          const validPredictions = roboflowResult.predictions.filter(
            (p) => p.confidence >= 0.1 && p.width > 5 && p.height > 5,
          );

          if (validPredictions.length > 0) {
            console.log(
              `Valid trash detected at ${currentTime}s: ${validPredictions.length} items`,
            );
            trashDetections.push({
              timestamp: currentTime,
              detections: validPredictions.map((p) => ({
                class: p.class,
                confidence: p.confidence,
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
              })),
            });

            const annotatedFrameBase64 = drawDetections(
              canvas,
              validPredictions,
            );
            trashDetectionImages.push(annotatedFrameBase64);

            // Update max trash count if current frame has more detections
            if (validPredictions.length > maxTrashCountPerFrame) {
              maxTrashCountPerFrame = validPredictions.length;
            }

            totalTrashCount += validPredictions.length; // Keep total for potential future use or debugging
            validPredictions.forEach((prediction) => {
              allCategories.add(prediction.class);
            });
          } else {
            console.log(
              `No valid detections after filtering at ${currentTime}s`,
            );
          }
        } else {
          console.log(`No trash detected at ${currentTime}s`);
        }
      }
    }

    if (window.updateProcessingStage) window.updateProcessingStage(3);

    const flowMetrics = calculateAverageFlowMetrics(flowVectors);
    const depthProfile = calculateDepthProfile(flowVectors);
    const averageDepth =
      depthProfile.length > 0
        ? depthProfile.reduce((sum, depth) => sum + depth, 0) /
          depthProfile.length
        : 0;
    const maxDepth = depthProfile.length > 0 ? Math.max(...depthProfile) : 0;

    if (window.updateProcessingStage) window.updateProcessingStage(4);

    video.pause();

    // Create a MediaRecorder to save the processed video
    const processedCanvas = document.createElement("canvas");
    const processedCtx = processedCanvas.getContext("2d");
    processedCanvas.width = canvas.width;
    processedCanvas.height = canvas.height;

    const processedStream = processedCanvas.captureStream();
    const mediaRecorder = new MediaRecorder(processedStream, {
      mimeType: "video/webm",
    });
    const processedChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        processedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const processedBlob = new Blob(processedChunks, { type: "video/webm" });
      const processedVideoUrl = URL.createObjectURL(processedBlob);
      const downloadUrl = processedVideoUrl;
      console.log("Processed video ready for download:", downloadUrl);
    };

    // Draw each frame with annotations
    let frameIndex = 0;
    const drawNextFrame = () => {
      if (frameIndex < frames.length) {
        processedCtx!.putImageData(frames[frameIndex], 0, 0);
        const currentDetections = trashDetections[frameIndex]?.detections || [];
        if (currentDetections.length > 0) {
          drawDetections(processedCanvas, currentDetections);
        }
        frameIndex++;
        requestAnimationFrame(drawNextFrame);
      } else {
        mediaRecorder.stop();
      }
    };

    mediaRecorder.start();
    drawNextFrame();

    const videoUrl = URL.createObjectURL(file);
    URL.revokeObjectURL(video.src);

    console.log("Analysis complete:", {
      totalTrashCount,
      trashCategories: Array.from(allCategories),
    });

    return {
      averageVelocity: flowMetrics.averageVelocity,
      flowMagnitude: flowMetrics.flowMagnitude,
      trashCount: maxTrashCountPerFrame, // Use maxTrashCountPerFrame here
      trashCategories: Array.from(allCategories),
      environmentalImpact: "No significant environmental impact detected",
      frames,
      trashDetectionImages,
      flowVectors,
      videoUrl,
      processedVideoUrl:
        processedChunks.length > 0
          ? URL.createObjectURL(
              new Blob(processedChunks, { type: "video/webm" }),
            )
          : undefined,
      downloadUrl:
        processedChunks.length > 0
          ? URL.createObjectURL(
              new Blob(processedChunks, { type: "video/webm" }),
            )
          : undefined,
      trashDetections,
      depthProfile,
      averageDepth,
      maxDepth,
      riverCategory: {
        state: file.name.split("_")[0],
        river: file.name.split("_")[1],
      },
    };
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw new Error("Video analysis failed");
  } finally {
    URL.revokeObjectURL(video.src);
  }
}

/**
 * Calculate optical flow between two frames
 */
function calculateOpticalFlow(
  previousFrame: ImageData,
  currentFrame: ImageData,
): {
  velocities: number[];
  directions: number[];
} {
  const velocities: number[] = [];
  const directions: number[] = [];
  const gridSize = 8; // Reduced grid size for faster processing
  const regionWidth = Math.floor(previousFrame.width / gridSize);
  const regionHeight = Math.floor(previousFrame.height / gridSize);
  const skipPixels = 2; // Skip pixels for faster processing

  for (let i = 0; i < gridSize * gridSize; i++) {
    const gridX = i % gridSize;
    const gridY = Math.floor(i / gridSize);
    const startX = gridX * regionWidth;
    const startY = gridY * regionHeight;

    const motionVector = calculateMotionVector(
      previousFrame,
      currentFrame,
      startX,
      startY,
      regionWidth,
      regionHeight,
    );
    const velocity = Math.sqrt(
      motionVector.x * motionVector.x + motionVector.y * motionVector.y,
    );
    const direction = Math.atan2(motionVector.y, motionVector.x);

    const scaledVelocity = velocity * 0.05 + 0.5;
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
  height: number,
): { x: number; y: number } {
  let sumDX = 0;
  let sumDY = 0;
  let count = 0;
  const sampleStep = 8; // Increased sample step for faster processing

  for (let y = startY; y < startY + height; y += sampleStep) {
    for (let x = startX; x < startX + width; x += sampleStep) {
      if (x >= prevFrame.width || y >= prevFrame.height) continue;

      const idx = (y * prevFrame.width + x) * 4;
      const prevBrightness =
        0.299 * prevFrame.data[idx] +
        0.587 * prevFrame.data[idx + 1] +
        0.114 * prevFrame.data[idx + 2];

      let bestMatch = { x, y, diff: Infinity };
      const searchRadius = 6; // Optimized search radius
      for (
        let sy = Math.max(0, y - searchRadius);
        sy < Math.min(currFrame.height, y + searchRadius);
        sy += 2
      ) {
        for (
          let sx = Math.max(0, x - searchRadius);
          sx < Math.min(currFrame.width, x + searchRadius);
          sx += 2
        ) {
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

      if (bestMatch.diff < 30) {
        sumDX += bestMatch.x - x;
        sumDY += bestMatch.y - y;
        count++;
      }
    }
  }

  return { x: count > 0 ? sumDX / count : 0, y: count > 0 ? sumDY / count : 0 };
}

/**
 * Calculate average flow metrics across all frame pairs
 */
function calculateAverageFlowMetrics(
  flowVectors: Array<{ velocities: number[]; directions: number[] }>,
): {
  averageVelocity: number;
  flowMagnitude: number;
} {
  if (flowVectors.length === 0) return { averageVelocity: 0, flowMagnitude: 0 };

  let totalVelocity = 0;
  let totalVectors = 0;

  flowVectors.forEach((vector) => {
    vector.velocities.forEach((velocity) => {
      totalVelocity += velocity;
      totalVectors++;
    });
  });

  const averageVelocity = totalVelocity / totalVectors;
  return {
    averageVelocity: Number(averageVelocity.toFixed(2)),
    flowMagnitude: Number((averageVelocity * 2).toFixed(2)),
  };
}

/**
 * Calculate depth profile from flow vectors
 */
function calculateDepthProfile(
  flowVectors: Array<{ velocities: number[]; directions: number[] }>,
): number[] {
  const depthProfile: number[] = [];
  if (flowVectors.length === 0) return depthProfile;

  for (let i = 0; i < flowVectors[0].velocities.length; i++) {
    const avgVelocity =
      flowVectors.reduce((sum, vector) => sum + vector.velocities[i], 0) /
      flowVectors.length;
    const depth = 2.5 / (avgVelocity + 0.5);
    depthProfile.push(Number(depth.toFixed(2)));
  }

  return depthProfile;
}

/**
 * Draw bounding boxes and labels on the canvas
 */
function drawDetections(canvas: HTMLCanvasElement, predictions: any[]): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL();

  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 4;
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = "#ff0000";

  predictions.forEach((prediction) => {
    const x = prediction.x - prediction.width / 2;
    const y = prediction.y - prediction.height / 2;

    ctx.strokeRect(x, y, prediction.width, prediction.height);
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.fillRect(x, y, prediction.width, prediction.height);

    const label = `${prediction.class} ${Math.round(prediction.confidence * 100)}%`;
    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.fillRect(x, y - 25, ctx.measureText(label).width + 10, 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 5, y - 10);
  });

  return canvas.toDataURL();
}
