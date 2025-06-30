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
}

/**
 * Check if OpenCV.js is ready
 */
export function isOpenCVReady(): boolean {
  return typeof cv !== "undefined" && cv.Mat !== undefined;
}

/**
 * Wait for OpenCV.js to be ready
 */
export function waitForOpenCV(): Promise<void> {
  return new Promise((resolve) => {
    if (isOpenCVReady()) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (isOpenCVReady()) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Fallback timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (isOpenCVReady()) {
        resolve();
      } else {
        console.warn("OpenCV.js failed to load within 30 seconds");
        resolve(); // Continue anyway
      }
    }, 30000);
  });
}

/**
 * Convert ImageData to OpenCV Mat
 */
function imageDataToMat(imageData: ImageData): any {
  const mat = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
  mat.data.set(imageData.data);
  return mat;
}

/**
 * Calculate Farneback optical flow between two frames
 */
export function calculateFarnebackOpticalFlow(
  previousFrame: ImageData,
  currentFrame: ImageData,
  roi?: { x: number; y: number; width: number; height: number },
): FlowResult {
  if (!isOpenCVReady()) {
    console.warn(
      "OpenCV.js not available, falling back to basic flow calculation",
    );
    return calculateBasicOpticalFlow(previousFrame, currentFrame);
  }

  try {
    // Convert ImageData to OpenCV Mat
    const prevMat = imageDataToMat(previousFrame);
    const currMat = imageDataToMat(currentFrame);

    // Convert to grayscale
    const prevGray = new cv.Mat();
    const currGray = new cv.Mat();
    cv.cvtColor(prevMat, prevGray, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(currMat, currGray, cv.COLOR_RGBA2GRAY);

    // Apply ROI if specified
    let roiPrevGray = prevGray;
    let roiCurrGray = currGray;
    if (roi) {
      const roiRect = new cv.Rect(
        Math.floor((roi.x * previousFrame.width) / 100),
        Math.floor((roi.y * previousFrame.height) / 100),
        Math.floor((roi.width * previousFrame.width) / 100),
        Math.floor((roi.height * previousFrame.height) / 100),
      );
      roiPrevGray = prevGray.roi(roiRect);
      roiCurrGray = currGray.roi(roiRect);
    }

    // Calculate Farneback optical flow
    const flow = new cv.Mat();
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
      roi
        ? Math.floor((roi.width * previousFrame.width) / 100)
        : previousFrame.width,
      roi
        ? Math.floor((roi.height * previousFrame.height) / 100)
        : previousFrame.height,
      roi || { x: 0, y: 0, width: 100, height: 100 },
    );

    // Calculate grid-based velocities and directions for compatibility
    const gridResult = calculateGridVelocities(
      velocityField,
      previousFrame.width,
      previousFrame.height,
    );

    // Cleanup
    prevMat.delete();
    currMat.delete();
    prevGray.delete();
    currGray.delete();
    if (roi) {
      roiPrevGray.delete();
      roiCurrGray.delete();
    }
    flow.delete();

    return {
      velocities: gridResult.velocities,
      directions: gridResult.directions,
      velocityField,
    };
  } catch (error) {
    console.error("OpenCV Farneback flow calculation failed:", error);
    return calculateBasicOpticalFlow(previousFrame, currentFrame);
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
      const vx = flow.data32F[flowIdx];
      const vy = flow.data32F[flowIdx + 1];
      const magnitude = Math.sqrt(vx * vx + vy * vy);

      if (magnitude > 0.5) {
        // Filter noise
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
 * Calculate grid-based velocities from velocity field for backward compatibility
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
 * Fallback basic optical flow calculation when OpenCV is not available
 */
function calculateBasicOpticalFlow(
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

  return { velocities, directions, velocityField };
}

/**
 * Basic motion vector calculation (fallback)
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
