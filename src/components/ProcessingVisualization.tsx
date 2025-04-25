
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, Eye, ChartLine, Trash } from 'lucide-react';

interface ProcessingStage {
  icon: React.ReactNode;
  name: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface ProcessingVisualizationProps {
  currentStage: number;
}

const ProcessingVisualization: React.FC<ProcessingVisualizationProps> = ({ currentStage }) => {
  const stages: ProcessingStage[] = [
    {
      icon: <Video className="w-5 h-5" />,
      name: "Frame Extraction",
      description: "Extracting frames from video for analysis",
      completed: currentStage > 0,
      current: currentStage === 0
    },
    {
      icon: <Eye className="w-5 h-5" />,
      name: "Depth Analysis",
      description: "Analyzing river depth using computer vision",
      completed: currentStage > 1,
      current: currentStage === 1
    },
    {
      icon: <ChartLine className="w-5 h-5" />,
      name: "Flow Analysis",
      description: "Calculating water flow patterns and velocity",
      completed: currentStage > 2,
      current: currentStage === 2
    },
    {
      icon: <Trash className="w-5 h-5" />,
      name: "Trash Detection",
      description: "Detecting and counting trash objects",
      completed: currentStage > 3,
      current: currentStage === 3
    }
  ];

  const progress = (currentStage / stages.length) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-4" />
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage.name}
              className={`flex items-start p-3 rounded-lg transition-colors ${
                stage.current
                  ? 'bg-blue-50 border border-blue-200'
                  : stage.completed
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`p-2 rounded-full mr-3 ${
                stage.current
                  ? 'bg-blue-100 text-blue-600'
                  : stage.completed
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {stage.icon}
              </div>
              <div>
                <h3 className={`text-sm font-medium ${
                  stage.current
                    ? 'text-blue-800'
                    : stage.completed
                    ? 'text-green-800'
                    : 'text-gray-800'
                }`}>
                  {stage.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingVisualization;
