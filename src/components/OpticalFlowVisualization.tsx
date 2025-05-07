
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFlowHeatmap } from '@/utils/tensorflowFlowAnalysis';
import { NasaCard } from './NasaCard';

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
    <NasaCard 
      title="AI Flow Analysis"
      description="TensorFlow Optical Flow Visualization"
      gradient
      glassmorphism
      animate="scan"
      className="w-full"
    >
      <div className="relative aspect-video">
        <canvas 
          ref={canvasRef}
          className="w-full h-full rounded"
          width={640}
          height={360}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-2 flex justify-between">
          <span className="text-blue-300">TensorFlow.js Flow Analysis</span>
          <span className="text-green-300">
            {flowVectors.velocities.length > 0 ? 
              `Avg: ${(flowVectors.velocities.reduce((a, b) => a + b, 0) / flowVectors.velocities.length).toFixed(2)} m/s` : 
              'No data'}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Analysis Mode</span>
          <span className="text-xs bg-blue-900/50 px-2 py-1 rounded text-blue-200">Lucas-Kanade</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card/80 p-2 rounded-sm border border-border/50">
            <div className="text-xs text-muted-foreground">Max Velocity</div>
            <div className="text-sm font-mono">
              {flowVectors.velocities.length > 0 ? 
                `${Math.max(...flowVectors.velocities).toFixed(2)} m/s` : 
                'N/A'}
            </div>
          </div>
          <div className="bg-card/80 p-2 rounded-sm border border-border/50">
            <div className="text-xs text-muted-foreground">Vectors Count</div>
            <div className="text-sm font-mono">{flowVectors.velocities.length}</div>
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          <p>Flow vectors show water movement direction and velocity based on TensorFlow optical flow algorithms</p>
        </div>
      </div>
    </NasaCard>
  );
};

export default OpticalFlowVisualization;
