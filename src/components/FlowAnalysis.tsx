
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowRightCircle, Activity } from 'lucide-react';
import { NasaCard } from './NasaCard';

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
    <NasaCard 
      title="Water Flow Analysis"
      gradient
      glassmorphism
      animate="scan"
      className="w-full"
      footer={
        <div className="flex items-center text-xs text-muted-foreground">
          <Activity className="h-3 w-3 mr-1" />
          <span>Velocity analysis powered by TensorFlow.js</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-card/80 to-card/50 rounded-lg border border-border/50">
            <div>
              <h3 className="text-sm font-medium text-primary-foreground">Average Velocity</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-primary">{averageVelocity}</span>
                <span className="ml-1 text-sm text-muted-foreground">m/s</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${getVelocityColor(averageVelocity)}`}>
              {averageVelocity < 0.5 && 'Slow'}
              {averageVelocity >= 0.5 && averageVelocity < 1.0 && 'Moderate'}
              {averageVelocity >= 1.0 && averageVelocity < 1.5 && 'Fast'}
              {averageVelocity >= 1.5 && 'Very Fast'}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-card/80 to-card/50 rounded-lg border border-border/50">
            <div>
              <h3 className="text-sm font-medium text-primary-foreground">Flow Magnitude</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-primary">{flowMagnitude}</span>
                <span className="ml-1 text-sm text-muted-foreground">units</span>
              </div>
            </div>
            <ArrowRightCircle className="h-8 w-8 text-primary/80" />
          </div>
        </div>
        
        <div className="bg-card/30 p-3 rounded-lg border border-border/50 flex flex-col">
          <h3 className="text-sm font-medium text-primary-foreground mb-2">Flow Visualization</h3>
          <div className="flex-grow overflow-hidden relative flow-pattern">
            <div className="absolute inset-0 flex flex-col justify-around">
              {getFlowArrows(flowMagnitude)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 rounded-md bg-card/30 border border-border/50">
        <h4 className="text-sm font-medium text-primary-foreground">Understanding Flow Analysis</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Flow velocity is calculated using TensorFlow.js optical flow algorithms that track the movement of water 
          features between video frames. Higher magnitudes indicate stronger currents, which can impact 
          erosion, habitat quality, and pollutant transport.
        </p>
      </div>
    </NasaCard>
  );
};

export default FlowAnalysis;
