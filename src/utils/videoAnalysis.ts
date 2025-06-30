import { extractVideoFrame, delay } from "../services/geminiService";
import { detectTrashInImage } from "../services/roboflowService";
import type { AnalysisResult } from "../types/analysis";

/**
 * Process a video file and analyze its content using Roboflow for trash detection
 */
export async function analyzeVideo(file: File): Promise<AnalysisResult> {
  console.log("Starting video analysis...");

  // Wait for OpenCV.js to be ready for enhanced optical flow
  console.log("Waiting for OpenCV.js to load...");
  await waitForOpenCV();
  if (isOpenCVReady()) {
    console.log("✅ OpenCV.js is ready - using Farneback optical flow");
  } else {
    console.log("⚠️ OpenCV.js not available - using fallback optical flow");
  }

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

      // Skip processing if there's minimal motion (simplified detection)
      if (previousFrameData && skipFrameCount < 2) {
        const frameData = ctx!.getImageData(0, 0, canvas.width, canvas.height);

        // Simple motion detection by comparing pixel differences
        let totalDiff = 0;
        const sampleStep = 20; // Sample every 20th pixel for performance
        for (let i = 0; i < frameData.data.length; i += 4 * sampleStep) {
          const r1 = previousFrameData.data[i];
          const g1 = previousFrameData.data[i + 1];
          const b1 = previousFrameData.data[i + 2];
          const r2 = frameData.data[i];
          const g2 = frameData.data[i + 1];
          const b2 = frameData.data[i + 2];

          totalDiff +=
            Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        }

        const avgDiff = totalDiff / (frameData.data.length / (4 * sampleStep));

        if (avgDiff < 10) {
          // Low motion threshold
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
          // Use Farneback optical flow with ROI for better accuracy
          const roi = { x: 0, y: 20, width: 100, height: 60 }; // Focus on water area
          const flowResult = calculateFarnebackOpticalFlow(
            previousFrameData,
            frameData,
            roi,
          );
          flowVectors.push(flowResult);

          // Log enhanced flow information
          if (flowResult.velocityField && flowResult.velocityField.length > 0) {
            const avgMagnitude =
              flowResult.velocityField.reduce(
                (sum, p) => sum + p.magnitude,
                0,
              ) / flowResult.velocityField.length;
            console.log(
              `Farneback flow: ${flowResult.velocityField.length} vectors, avg magnitude: ${avgMagnitude.toFixed(2)}`,
            );
          }
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

    // Provide helpful feedback if trash detection failed
    const trashDetectionWorked =
      trashDetections.length > 0 || maxTrashCountPerFrame > 0;
    const environmentalImpact = trashDetectionWorked
      ? maxTrashCountPerFrame > 0
        ? "Trash detected - environmental impact assessment needed"
        : "No significant environmental impact detected"
      : "Trash detection unavailable - external service error";

    return {
      averageVelocity: flowMetrics.averageVelocity,
      flowMagnitude: flowMetrics.flowMagnitude,
      trashCount: maxTrashCountPerFrame, // Use maxTrashCountPerFrame here
      trashCategories: Array.from(allCategories),
      environmentalImpact,
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

// Optical flow calculation moved to openCVFlow.ts for Farneback implementation

// Motion vector calculation moved to openCVFlow.ts

/**
 * Calculate average flow metrics across all frame pairs using enhanced Farneback flow
 */
function calculateAverageFlowMetrics(
  flowVectors: Array<{
    velocities: number[];
    directions: number[];
    velocityField?: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      magnitude: number;
    }>;
  }>,
): {
  averageVelocity: number;
  flowMagnitude: number;
} {
  if (flowVectors.length === 0) return { averageVelocity: 0, flowMagnitude: 0 };

  let totalVelocity = 0;
  let totalVectors = 0;
  let totalMagnitude = 0;
  let magnitudeCount = 0;

  flowVectors.forEach((vector) => {
    // Use velocity field data if available (from Farneback)
    if (vector.velocityField && vector.velocityField.length > 0) {
      vector.velocityField.forEach((point) => {
        totalMagnitude += point.magnitude;
        magnitudeCount++;
      });
    }

    // Also include grid-based velocities for backward compatibility
    vector.velocities.forEach((velocity) => {
      totalVelocity += velocity;
      totalVectors++;
    });
  });

  // Prefer velocity field data if available, otherwise use grid velocities
  const averageVelocity =
    magnitudeCount > 0
      ? totalMagnitude / magnitudeCount
      : totalVectors > 0
        ? totalVelocity / totalVectors
        : 0;

  return {
    averageVelocity: Number(averageVelocity.toFixed(2)),
    flowMagnitude: Number((averageVelocity * 2).toFixed(2)),
  };
}

/**
 * Calculate depth profile from flow vectors using enhanced Farneback data
 */
function calculateDepthProfile(
  flowVectors: Array<{
    velocities: number[];
    directions: number[];
    velocityField?: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      magnitude: number;
    }>;
  }>,
): number[] {
  const depthProfile: number[] = [];
  if (flowVectors.length === 0) return depthProfile;

  // Use velocity field if available for more accurate depth estimation
  if (flowVectors[0].velocityField && flowVectors[0].velocityField.length > 0) {
    // Create depth estimates based on velocity field magnitudes
    const gridSize = 8;
    for (let i = 0; i < gridSize; i++) {
      let totalMagnitude = 0;
      let count = 0;

      flowVectors.forEach((vector) => {
        if (vector.velocityField) {
          const sectionPoints = vector.velocityField.filter(
            (_, idx) => idx % gridSize === i,
          );
          sectionPoints.forEach((point) => {
            totalMagnitude += point.magnitude;
            count++;
          });
        }
      });

      const avgMagnitude = count > 0 ? totalMagnitude / count : 0;
      const depth = 2.5 / (avgMagnitude * 0.1 + 0.5); // Scale magnitude appropriately
      depthProfile.push(Number(depth.toFixed(2)));
    }
  } else {
    // Fallback to original grid-based calculation
    for (let i = 0; i < flowVectors[0].velocities.length; i++) {
      const avgVelocity =
        flowVectors.reduce((sum, vector) => sum + vector.velocities[i], 0) /
        flowVectors.length;
      const depth = 2.5 / (avgVelocity + 0.5);
      depthProfile.push(Number(depth.toFixed(2)));
    }
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
