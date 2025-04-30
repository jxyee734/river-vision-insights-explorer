
import * as tf from '@tensorflow/tfjs';

/**
 * Calculate optical flow between two frames using TensorFlow.js
 * This implements a modified version of the Lucas-Kanade method
 */
export async function calculateOpticalFlow(
  prevFrame: ImageData, 
  currentFrame: ImageData
): Promise<{
  velocities: number[];
  directions: number[];
  flowMagnitude: number;
}> {
  // Ensure TensorFlow is ready
  await tf.ready();
  
  // Convert ImageData to tensors
  const prevTensor = tf.browser.fromPixels(prevFrame, 3);
  const currentTensor = tf.browser.fromPixels(currentFrame, 3);
  
  // Convert to grayscale for optical flow calculation
  const prevGray = tf.tidy(() => {
    return tf.mean(prevTensor, -1).expandDims(-1);
  });
  
  const currentGray = tf.tidy(() => {
    return tf.mean(currentTensor, -1).expandDims(-1);
  });
  
  // Calculate image derivatives (gradients)
  const sobelX = tf.tensor2d([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], [3, 3]);
  const sobelY = tf.tensor2d([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], [3, 3]);
  
  // Apply sobel filters to get gradients
  // Fix: Explicitly cast tensors to ensure correct types for conv2d
  const dx = tf.tidy(() => {
    // Reshape and cast sobelX to Tensor4D for conv2d
    const reshapedSobelX = sobelX.reshape([3, 3, 1, 1]) as tf.Tensor4D;
    // Cast prevGray to Tensor3D explicitly to satisfy TypeScript
    return tf.conv2d(
      prevGray as tf.Tensor3D, 
      reshapedSobelX, 
      [1, 1], 
      'same'
    );
  });
  
  const dy = tf.tidy(() => {
    // Reshape and cast sobelY to Tensor4D for conv2d
    const reshapedSobelY = sobelY.reshape([3, 3, 1, 1]) as tf.Tensor4D;
    // Cast prevGray to Tensor3D explicitly to satisfy TypeScript
    return tf.conv2d(
      prevGray as tf.Tensor3D,
      reshapedSobelY,
      [1, 1],
      'same'
    );
  });
  
  // Calculate temporal derivative (difference between frames)
  const dt = tf.tidy(() => {
    return tf.sub(currentGray, prevGray);
  });
  
  // Sample points for flow calculation (grid-based approach)
  const gridSize = 10; // 10x10 grid
  const width = prevFrame.width;
  const height = prevFrame.height;
  const velocities: number[] = [];
  const directions: number[] = [];
  
  // Calculate flow for each grid point
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Grid cell center
      const x = Math.floor((j + 0.5) * width / gridSize);
      const y = Math.floor((i + 0.5) * height / gridSize);
      
      // Extract local window for flow calculation
      const windowSize = 15;
      const halfWindow = Math.floor(windowSize / 2);
      
      // Ensure window is within image boundaries
      const startX = Math.max(0, x - halfWindow);
      const startY = Math.max(0, y - halfWindow);
      const endX = Math.min(width, x + halfWindow + 1);
      const endY = Math.min(height, y + halfWindow + 1);
      
      // Extract patches
      const dxPatch = tf.tidy(() => {
        return dx.slice([startY, startX, 0], [endY - startY, endX - startX, 1]);
      });
      
      const dyPatch = tf.tidy(() => {
        return dy.slice([startY, startX, 0], [endY - startY, endX - startX, 1]);
      });
      
      const dtPatch = tf.tidy(() => {
        return dt.slice([startY, startX, 0], [endY - startY, endX - startX, 1]);
      });
      
      // Solve the optical flow equation
      // [u, v] is the flow vector at this point
      const [u, v] = tf.tidy(() => {
        // Form the system of equations
        const dxSquared = tf.square(dxPatch);
        const dySquared = tf.square(dyPatch);
        const dxdy = tf.mul(dxPatch, dyPatch);
        const dxdt = tf.mul(dxPatch, dtPatch);
        const dydt = tf.mul(dyPatch, dtPatch);
        
        // Sum across the window to get coefficients
        const sumDxSquared = tf.sum(dxSquared).arraySync() as number;
        const sumDySquared = tf.sum(dySquared).arraySync() as number;
        const sumDxDy = tf.sum(dxdy).arraySync() as number;
        const sumDxDt = tf.sum(dxdt).arraySync() as number;
        const sumDyDt = tf.sum(dydt).arraySync() as number;
        
        // Calculate determinant for solving the system
        const det = sumDxSquared * sumDySquared - sumDxDy * sumDxDy;
        
        // If determinant is too small, the system is ill-conditioned
        if (Math.abs(det) < 1e-6) {
          return [0, 0];
        }
        
        // Solve the 2x2 system
        const u = (sumDySquared * sumDxDt - sumDxDy * sumDyDt) / det;
        const v = (sumDxSquared * sumDyDt - sumDxDy * sumDxDt) / det;
        
        return [u, v];
      });
      
      // Calculate velocity and direction
      const speed = Math.sqrt(u * u + v * v);
      // Scale to reasonable values (m/s) - calibration factor
      const calibratedSpeed = Math.min(5.0, speed * 0.5);
      const direction = Math.atan2(v, u);
      
      velocities.push(Number(calibratedSpeed.toFixed(2)));
      directions.push(Number(direction.toFixed(2)));
    }
  }
  
  // Clean up tensors to avoid memory leaks
  tf.dispose([prevTensor, currentTensor, prevGray, currentGray, dx, dy, dt, sobelX, sobelY]);
  
  // Calculate average velocity for flow magnitude
  const avgVelocity = velocities.reduce((sum, val) => sum + val, 0) / velocities.length;
  
  return {
    velocities,
    directions,
    flowMagnitude: Number(avgVelocity.toFixed(2))
  };
}

/**
 * Generate heat map visualization of flow
 */
export function generateFlowHeatmap(
  canvas: HTMLCanvasElement,
  velocities: number[],
  directions: number[]
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Create flow visualization
  const gridSize = Math.sqrt(velocities.length);
  const cellWidth = canvas.width / gridSize;
  const cellHeight = canvas.height / gridSize;
  
  // Draw flow vectors
  ctx.lineWidth = 2;
  
  velocities.forEach((velocity, index) => {
    const direction = directions[index];
    
    // Calculate grid position
    const col = index % gridSize;
    const row = Math.floor(index / gridSize);
    
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;
    
    // Color based on velocity (blue to red gradient)
    const normalizedVelocity = Math.min(velocity / 5, 1); // Normalize to [0,1]
    const r = Math.round(normalizedVelocity * 255);
    const g = 50;
    const b = Math.round(255 - normalizedVelocity * 255);
    const color = `rgba(${r}, ${g}, ${b}, 0.8)`;
    
    // Draw vector line
    const length = velocity * 15; // Scale line length
    const endX = x + Math.cos(direction) * length;
    const endY = y + Math.sin(direction) * length;
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.stroke();
    
    // Draw arrowhead
    const headLength = 10;
    const angle = Math.atan2(endY - y, endX - x);
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.fillStyle = color;
    ctx.fill();
    
    // Add velocity label
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    const velocityText = `${velocity.toFixed(1)}`;
    const textWidth = ctx.measureText(velocityText).width;
    ctx.fillText(velocityText, x - textWidth / 2, y - 8);
  });
  
  // Add heat map overlay
  ctx.globalAlpha = 0.15;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const index = row * gridSize + col;
      const velocity = velocities[index] || 0;
      
      const normalizedVelocity = Math.min(velocity / 5, 1);
      const r = Math.round(normalizedVelocity * 255);
      const g = 50;
      const b = Math.round(255 - normalizedVelocity * 255);
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
  }
  ctx.globalAlpha = 1.0;
  
  return canvas.toDataURL();
}
