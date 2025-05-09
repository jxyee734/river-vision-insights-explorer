
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DepthVisualizationProps {
  depthProfile: number[];
  averageDepth: number;
  maxDepth: number;
  depthConfidence?: number;
}

const DepthVisualization: React.FC<DepthVisualizationProps> = ({ 
  depthProfile, 
  averageDepth,
  maxDepth,
  depthConfidence = 0.5
}) => {
  const chartData = depthProfile.map((depth, index) => ({
    position: `P${index + 1}`,
    depth: depth,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>River Depth Profile</span>
          <div className="text-sm font-normal flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Average: {averageDepth} m</span>
            <span className="text-xs text-muted-foreground">Maximum: {maxDepth} m</span>
            <span className="text-xs text-muted-foreground">Confidence: {(depthConfidence * 100).toFixed(0)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D47A1" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#90CAF9" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" />
              <YAxis 
                domain={[0, Math.ceil(maxDepth * 1.2)]} 
                label={{ value: 'Depth (meters)', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip 
                formatter={(value) => [`${value} m`, 'Depth']}
                labelFormatter={(label) => `Position ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="depth" 
                stroke="#0D47A1" 
                fillOpacity={1}
                fill="url(#depthGradient)" 
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800">How is depth calculated?</h4>
          <p className="text-xs text-blue-600 mt-1">
            River depth is estimated using the formula: Z = f × V / Flow, where f is the focal length,
            V is the relative velocity, and Flow is the optical flow magnitude. Accuracy: {(depthConfidence * 100).toFixed(0)}%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepthVisualization;
