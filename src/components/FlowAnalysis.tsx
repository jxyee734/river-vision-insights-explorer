
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface FlowAnalysisProps {
  averageVelocity: number;
  flowMagnitude: number;
  flowVectors?: Array<{velocities: number[], directions: number[]}>;
}

const FlowAnalysis: React.FC<FlowAnalysisProps> = ({ 
  averageVelocity, 
  flowMagnitude,
  flowVectors
}) => {
  // Determine color intensity based on flow speed
  const getVelocityColor = (velocity: number) => {
    if (velocity < 0.5) return 'bg-blue-200 text-blue-800'; // Slow
    if (velocity < 1.0) return 'bg-blue-300 text-blue-800'; // Moderate
    if (velocity < 1.5) return 'bg-blue-400 text-blue-900'; // Fast
    return 'bg-blue-500 text-white'; // Very fast
  };

  // Prepare flow data for the chart
  const prepareChartData = () => {
    if (!flowVectors || flowVectors.length === 0) {
      return [];
    }

    return flowVectors.map((flow, frameIndex) => {
      // Calculate average velocity for this frame
      const avgVelocity = flow.velocities.reduce((sum, v) => sum + v, 0) / flow.velocities.length;
      
      return {
        name: `Frame ${frameIndex + 1}`,
        velocity: Number(avgVelocity.toFixed(2)),
        average: averageVelocity
      };
    });
  };

  const chartData = prepareChartData();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Water Flow Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Average Velocity</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-blue-700">{averageVelocity}</span>
                <span className="ml-1 text-sm text-blue-600">m/s</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${getVelocityColor(averageVelocity)}`}>
              {averageVelocity < 0.5 && 'Slow'}
              {averageVelocity >= 0.5 && averageVelocity < 1.0 && 'Moderate'}
              {averageVelocity >= 1.0 && averageVelocity < 1.5 && 'Fast'}
              {averageVelocity >= 1.5 && 'Very Fast'}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Flow Magnitude</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-blue-700">{flowMagnitude}</span>
                <span className="ml-1 text-sm text-blue-600">units</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <ArrowRight className={`h-5 w-5 ${flowMagnitude > 5 ? 'text-blue-700' : 'text-blue-500'}`} />
              {flowMagnitude > 3 && 
                <ArrowRight className={`h-5 w-5 ${flowMagnitude > 6 ? 'text-blue-700' : 'text-blue-500'}`} />
              }
              {flowMagnitude > 6 && 
                <ArrowRight className="h-5 w-5 text-blue-700" />
              }
            </div>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <div className="mt-6 h-72">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Flow Velocity Over Time</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'm/s', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <ReferenceLine y={averageVelocity} stroke="#8884d8" strokeDasharray="3 3" label="Average" />
                <Line 
                  type="monotone" 
                  dataKey="velocity" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }}
                  name="Flow Velocity"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Flow velocity measurements across video frames
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col items-center justify-center h-40">
            <h3 className="text-sm font-medium text-blue-800 mb-2">No flow data available</h3>
            <p className="text-xs text-blue-600 text-center">
              Upload a video to analyze water flow patterns
            </p>
          </div>
        )}
        
        <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800">Understanding Flow Analysis</h4>
          <p className="text-xs text-blue-600 mt-1">
            Flow velocity is calculated using optical flow techniques that track the movement of water 
            features between video frames. Higher magnitudes indicate stronger currents, which can impact 
            erosion, habitat quality, and pollutant transport.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlowAnalysis;
