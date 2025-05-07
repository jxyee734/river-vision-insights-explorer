
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { NasaCard } from './NasaCard';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

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

  // Generate sample data based on flow magnitude for the graph
  const flowData = useMemo(() => {
    const dataPoints = 10;
    return Array.from({ length: dataPoints }).map((_, index) => {
      // Create a simple wave pattern based on the magnitude
      const variance = Math.sin(index / dataPoints * Math.PI * 2) * (flowMagnitude * 0.3);
      return {
        time: `T${index + 1}`,
        magnitude: Math.max(0, flowMagnitude + variance),
      };
    });
  }, [flowMagnitude]);

  // Chart config for Flow Magnitude visualization
  const chartConfig = {
    magnitude: {
      label: "Flow Magnitude",
      theme: {
        light: "#1E90FF", // Dodger blue
        dark: "#60A5FA",  // Blue-400
      }
    },
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
          </div>
        </div>
        
        <div className="bg-card/30 p-3 rounded-lg border border-border/50 flex flex-col">
          <h3 className="text-sm font-medium text-primary-foreground mb-2">Flow Magnitude Graph</h3>
          <div className="flex-grow h-[200px]">
            <ChartContainer config={chartConfig}>
              <LineChart data={flowData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="#888" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#888" 
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="magnitude"
                  name="magnitude"
                  stroke="var(--color-magnitude)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
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
