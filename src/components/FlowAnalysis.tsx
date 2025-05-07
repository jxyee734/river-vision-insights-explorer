
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowRightCircle } from 'lucide-react';

interface FlowAnalysisProps {
  averageVelocity: number;
  flowMagnitude: number;
}

const FlowAnalysis: React.FC<FlowAnalysisProps> = ({ averageVelocity, flowMagnitude }) => {
  // Determine color intensity based on flow speed
  const getVelocityColor = (velocity: number) => {
    if (velocity < 0.5) return 'bg-blue-200 text-blue-800'; // Slow
    if (velocity < 1.0) return 'bg-blue-300 text-blue-800'; // Moderate
    if (velocity < 1.5) return 'bg-blue-400 text-blue-900'; // Fast
    return 'bg-blue-500 text-white'; // Very fast
  };

  // Determine visualization of flow patterns
  const getFlowArrows = (magnitude: number) => {
    const count = Math.round(magnitude * 5); // Scale for visual representation
    return Array(count).fill(0).map((_, i) => (
      <div key={i} className="flex items-center">
        <div className={`h-2 ${i % 2 === 0 ? 'w-16' : 'w-8'} bg-blue-400 rounded-sm mr-1 animate-flow`}></div>
        <ArrowRight size={16} className="text-blue-500" />
      </div>
    ));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Water Flow Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-4">
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
              <ArrowRightCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Flow Visualization</h3>
            <div className="flex-grow overflow-hidden relative flow-pattern">
              <div className="absolute inset-0 flex flex-col justify-around">
                {getFlowArrows(flowMagnitude)}
              </div>
            </div>
          </div>
        </div>
        
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
