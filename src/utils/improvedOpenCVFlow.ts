declare global {
  const cv: any;
}

interface VelocityPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  magnitude: number;
}

interface FlowResult {
  velocities: number[];
  directions: number[];
  velocityField: VelocityPoint[];
  method: "farneback" | "lucas-kanade";
}

let opencvReady = false;
let opencvLoading = false;

/**
 * Initialize OpenCV.js with proper error handling
 */
export function initializeOpenCV(): Promise<boolean> {
  return new Promise((resolve) => {
    if (opencvReady) {
      resolve(true);
      return;
    }

    if (opencvLoading) {
      // Wait for existing loading attempt
      const checkReady = setInterval(() => {
        if (opencvReady || !opencvLoading) {
          clearInterval(checkReady);
          resolve(opencvReady);
        }
      }, 100);
      return;
    }

    opencvLoading = true;

    // Check if OpenCV is already loaded
    if (typeof cv !== "undefined" && cv.Mat) {
      opencvReady = true;
      opencvLoading = false;
      resolve(true);
      return;
    }

    // Set up OpenCV ready callback
    if (typeof window !== "undefined") {
      (window as any).onOpenCvReady = () => {
        opencvReady = true;
        opencvLoading = false;
        console.log("✅ OpenCV.js initialized successfully");
        resolve(true);
      };
    }

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!opencvReady) {
        opencvLoading = false;
        console.warn("⚠️ OpenCV.js failed to load within 15 seconds");
        resolve(false);
      }
    }, 15000);

    // If OpenCV script isn't loaded, create it
    if (!document.querySelector('script[src*="opencv.js"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://docs.opencv.org/4.9.0/opencv.js";
      script.onerror = () => {
        opencvLoading = false;
        console.error("❌ Failed to load OpenCV.js script");
        resolve(false);
      };
      document.head.appendChild(script);
    }
  });
}

/**
 * Check if OpenCV.js is ready
 */
export function isOpenCVReady(): boolean {
  return opencvReady && typeof cv !== "undefined" && cv.Mat !== undefined;
}

/**
 * Convert ImageData to OpenCV Mat with error handling
 */
function imageDataToMat(imageData: ImageData): any | null {
  try {
    const mat = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
    mat.data.set(imageData.data);
    return mat;
  } catch (error) {
    console.error("Failed to convert ImageData to Mat:", error);
    return null;
  }
}

/**
 * Enhanced Farneback optical flow with robust error handling
 */
export async function calculateEnhancedOpticalFlow(
  previousFrame: ImageData,
  currentFrame: ImageData,
  method: "farneback" | "lucas-kanade" = "farneback",
  roi?: { x: number; y: number; width: number; height: number },
): Promise<FlowResult> {
  // Try Farneback method if OpenCV is available and method is farneback
  if (method === "farneback" && isOpenCVReady()) {
    try {
      return await calculateFarnebackFlow(previousFrame, currentFrame, roi);
    } catch (error) {
      console.warn(
        "Farneback flow failed, falling back to Lucas-Kanade:",
        error,
      );
      return calculateLucasKanadeFlow(previousFrame, currentFrame);
    }
  }

  // Fallback to Lucas-Kanade
  return calculateLucasKanadeFlow(previousFrame, currentFrame);
}

/**
 * Farneback optical flow implementation
 */
async function calculateFarnebackFlow(
  previousFrame: ImageData,
  currentFrame: ImageData,
  roi?: { x: number; y: number; width: number; height: number },
): Promise<FlowResult> {
  let prevMat = null;
  let currMat = null;
  let prevGray = null;
  let currGray = null;
  let flow = null;
  let roiPrevGray = null;
  let roiCurrGray = null;

  try {
    // Convert ImageData to OpenCV Mat
    prevMat = imageDataToMat(previousFrame);
    currMat = imageDataToMat(currentFrame);

    if (!prevMat || !currMat) {
      throw new Error("Failed to convert images to OpenCV format");
    }

    // Convert to grayscale
    prevGray = new cv.Mat();
    currGray = new cv.Mat();
    cv.cvtColor(prevMat, prevGray, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(currMat, currGray, cv.COLOR_RGBA2GRAY);

    // Apply ROI if specified
    roiPrevGray = prevGray;
    roiCurrGray = currGray;
    let roiWidth = previousFrame.width;
    let roiHeight = previousFrame.height;

    if (roi) {
      const roiRect = new cv.Rect(
        Math.floor((roi.x * previousFrame.width) / 100),
        Math.floor((roi.y * previousFrame.height) / 100),
        Math.floor((roi.width * previousFrame.width) / 100),
        Math.floor((roi.height * previousFrame.height) / 100),
      );
      roiPrevGray = prevGray.roi(roiRect);
      roiCurrGray = currGray.roi(roiRect);
      roiWidth = roiRect.width;
      roiHeight = roiRect.height;
    }

    // Calculate Farneback optical flow
    flow = new cv.Mat();
    cv.calcOpticalFlowFarneback(
      roiPrevGray,
      roiCurrGray,
      flow,
      0.5, // pyramid scale
      3, // pyramid levels
      15, // window size
      3, // iterations
      5, // polynomial neighborhood
      1.2, // polynomial sigma
      0, // flags
    );

    // Convert flow to velocity field
    const velocityField = convertFlowToVelocityField(
      flow,
      roiWidth,
      roiHeight,
      roi || { x: 0, y: 0, width: 100, height: 100 },
    );

    // Calculate grid-based velocities for compatibility
    const gridResult = calculateGridVelocities(
      velocityField,
      previousFrame.width,
      previousFrame.height,
    );

    return {
      velocities: gridResult.velocities,
      directions: gridResult.directions,
      velocityField,
      method: "farneback",
    };
  } finally {
    // Cleanup all OpenCV objects
    try {
      if (prevMat) prevMat.delete();
      if (currMat) currMat.delete();
      if (prevGray) prevGray.delete();
      if (currGray) currGray.delete();
      if (flow) flow.delete();
      if (roi && roiPrevGray && roiPrevGray !== prevGray) roiPrevGray.delete();
      if (roi && roiCurrGray && roiCurrGray !== currGray) roiCurrGray.delete();
    } catch (error) {
      console.warn("Error during OpenCV cleanup:", error);
    }
  }
}

/**
 * Convert OpenCV flow to velocity field points
 */
function convertFlowToVelocityField(
  flow: any,
  width: number,
  height: number,
  roi: { x: number; y: number; width: number; height: number },
  step = 16,
): VelocityPoint[] {
  const field: VelocityPoint[] = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (y >= height || x >= width) continue;

      const flowIdx = (y * width + x) * 2;
      if (flowIdx + 1 >= flow.data32F.length) continue;

      const vx = flow.data32F[flowIdx];
      const vy = flow.data32F[flowIdx + 1];
      const magnitude = Math.sqrt(vx * vx + vy * vy);

      if (magnitude > 0.5 && !isNaN(magnitude)) {
        // Filter noise and invalid values
        field.push({
          x: x + (roi.x * width) / 100,
          y: y + (roi.y * height) / 100,
          vx,
          vy,
          magnitude,
        });
      }
    }
  }

  return field;
}

/**
 * Calculate grid-based velocities from velocity field
 */
function calculateGridVelocities(
  velocityField: VelocityPoint[],
  frameWidth: number,
  frameHeight: number,
): { velocities: number[]; directions: number[] } {
  const gridSize = 8;
  const velocities: number[] = [];
  const directions: number[] = [];

  const regionWidth = Math.floor(frameWidth / gridSize);
  const regionHeight = Math.floor(frameHeight / gridSize);

  for (let i = 0; i < gridSize * gridSize; i++) {
    const gridX = i % gridSize;
    const gridY = Math.floor(i / gridSize);
    const startX = gridX * regionWidth;
    const startY = gridY * regionHeight;
    const endX = startX + regionWidth;
    const endY = startY + regionHeight;

    // Find velocity points in this grid cell
    const cellPoints = velocityField.filter(
      (point) =>
        point.x >= startX &&
        point.x < endX &&
        point.y >= startY &&
        point.y < endY,
    );

    if (cellPoints.length > 0) {
      const avgVx =
        cellPoints.reduce((sum, p) => sum + p.vx, 0) / cellPoints.length;
      const avgVy =
        cellPoints.reduce((sum, p) => sum + p.vy, 0) / cellPoints.length;
      const avgMagnitude =
        cellPoints.reduce((sum, p) => sum + p.magnitude, 0) / cellPoints.length;

      const scaledVelocity = avgMagnitude * 0.05 + 0.5;
      const direction = Math.atan2(avgVy, avgVx);

      velocities.push(Number(scaledVelocity.toFixed(2)));
      directions.push(Number(direction.toFixed(2)));
    } else {
      velocities.push(0);
      directions.push(0);
    }
  }

  return { velocities, directions };
}

/**
 * Lucas-Kanade optical flow (original method)
 */
function calculateLucasKanadeFlow(
  previousFrame: ImageData,
  currentFrame: ImageData,
): FlowResult {
  const velocities: number[] = [];
  const directions: number[] = [];
  const velocityField: VelocityPoint[] = [];

  const gridSize = 8;
  const regionWidth = Math.floor(previousFrame.width / gridSize);
  const regionHeight = Math.floor(previousFrame.height / gridSize);

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

    // Add to velocity field
    if (velocity > 0.5) {
      velocityField.push({
        x: startX + regionWidth / 2,
        y: startY + regionHeight / 2,
        vx: motionVector.x,
        vy: motionVector.y,
        magnitude: velocity,
      });
    }
  }

  return { velocities, directions, velocityField, method: "lucas-kanade" };
}

/**
 * Motion vector calculation for Lucas-Kanade
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
  const sampleStep = 8;

  for (let y = startY; y < startY + height; y += sampleStep) {
    for (let x = startX; x < startX + width; x += sampleStep) {
      if (x >= prevFrame.width || y >= prevFrame.height) continue;

      const idx = (y * prevFrame.width + x) * 4;
      const prevBrightness =
        0.299 * prevFrame.data[idx] +
        0.587 * prevFrame.data[idx + 1] +
        0.114 * prevFrame.data[idx + 2];

      let bestMatch = { x, y, diff: Infinity };
      const searchRadius = 6;

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
