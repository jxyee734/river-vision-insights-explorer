import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DepthVisualizationProps {
  depthProfile: number[];
  averageDepth: number;
  maxDepth: number;
}

const DepthVisualization: React.FC<DepthVisualizationProps> = ({ 
  depthProfile, 
  averageDepth, 
  maxDepth 
}) => {
  // Prepare chart data from depth profile
  const chartData = depthProfile.map((depth, index) => ({
    name: `Point ${index + 1}`,
    depth: depth.toFixed(2),
    average: averageDepth,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium text-gray-900 mb-4">River Depth Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-blue-800">Average Depth</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-blue-700">{averageDepth.toFixed(2)}</span>
              <span className="ml-1 text-sm text-blue-600">m</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-blue-800">Max Depth</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-blue-700">{maxDepth.toFixed(2)}</span>
              <span className="ml-1 text-sm text-blue-600">m</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value) => [`${value} m`, 'Average Depth']}
              labelFormatter={(label) => `Location: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="depth" 
              stroke="#3b82f6" 
              fill="#93c5fd" 
              name="Depth"
            />
            <Area 
              type="monotone" 
              dataKey="average" 
              stroke="#1d4ed8" 
              fill="#60a5fa" 
              strokeDasharray="5 5"
              name="Average"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DepthVisualization;