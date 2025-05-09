
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { generateFlowHeatmap } from '@/utils/tensorflowFlowAnalysis';

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
  const [heatmapUrl, setHeatmapUrl] = useState<string>('');

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

    // Generate and apply the flow visualization
    const heatmap = generateFlowHeatmap(canvas, flowVectors.velocities, flowVectors.directions);
    setHeatmapUrl(heatmap);

  }, [previousFrame, currentFrame, flowVectors]);

  return (
    <Card className="w-full border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <CardContent className="p-4">
        <div className="relative aspect-video">
          <canvas 
            ref={canvasRef}
            className="w-full h-full rounded"
            width={640}
            height={360}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-2 flex justify-between">
            <span className="text-blue-300">Flow Analysis</span>
            <span className="text-green-300">
              {flowVectors.velocities.length > 0 ? 
                `Avg: ${(flowVectors.velocities.reduce((a, b) => a + b, 0) / flowVectors.velocities.length).toFixed(2)} m/s` : 
                'No data'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-gray-50 p-2 rounded-sm border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400">Max Velocity</div>
            <div className="text-sm font-mono">
              {flowVectors.velocities.length > 0 ? 
                `${Math.max(...flowVectors.velocities).toFixed(2)} m/s` : 
                'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded-sm border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400">Vectors Count</div>
            <div className="text-sm font-mono">{flowVectors.velocities.length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpticalFlowVisualization;
