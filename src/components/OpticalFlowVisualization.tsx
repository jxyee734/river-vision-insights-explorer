
import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OpticalFlowVisualizationProps {
  previousFrame: ImageData;
  currentFrame: ImageData;
  flowVectors: { velocities: number[], directions: number[] };
}

const OpticalFlowVisualization: React.FC<OpticalFlowVisualizationProps> = ({
  previousFrame,
  currentFrame,
  flowVectors
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the current frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = currentFrame.width;
    tempCanvas.height = currentFrame.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(currentFrame, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    // Draw flow vectors with improved visibility
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;

    const gridSize = 10;
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    flowVectors.velocities.forEach((velocity, index) => {
      const direction = flowVectors.directions[index];
      
      // Calculate grid position
      const gridX = index % gridSize;
      const gridY = Math.floor(index / gridSize);
      
      const x = gridX * cellWidth + cellWidth / 2;
      const y = gridY * cellHeight + cellHeight / 2;

      // Scale vector length based on velocity
      const length = velocity * 30; // Increased scale for better visibility
      const endX = x + Math.cos(direction) * length;
      const endY = y + Math.sin(direction) * length;

      // Draw vector line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw arrow head
      const headLength = 12;
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
      ctx.closePath();
      ctx.fill();

      // Add velocity label
      ctx.font = '10px Arial';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      const velocityText = `${velocity.toFixed(1)} m/s`;
      ctx.strokeText(velocityText, x - 15, y - 10);
      ctx.fillText(velocityText, x - 15, y - 10);
    });

  }, [previousFrame, currentFrame, flowVectors]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Optical Flow Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video">
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
            width={640}
            height={360}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Green arrows indicate water flow direction and velocity. Labels show speed in meters per second.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpticalFlowVisualization;
