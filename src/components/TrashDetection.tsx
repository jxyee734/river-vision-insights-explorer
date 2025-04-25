
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle } from 'lucide-react';

interface TrashDetectionProps {
  trashCount: number;
}

const TrashDetection: React.FC<TrashDetectionProps> = ({ trashCount }) => {
  // Determine pollution level
  const getPollutionLevel = (count: number) => {
    if (count === 0) return { level: 'Minimal', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (count <= 2) return { level: 'Low', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (count <= 5) return { level: 'Moderate', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const pollutionInfo = getPollutionLevel(trashCount);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trash Detection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <div className="flex items-center">
              <Trash2 className="h-8 w-8 text-gray-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-800">Detected Items</h3>
                <span className="text-3xl font-bold text-gray-700">{trashCount}</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${pollutionInfo.bgColor} ${pollutionInfo.color}`}>
              {pollutionInfo.level} Pollution
            </div>
          </div>
          
          {trashCount > 0 && (
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Pollution Alert</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  {trashCount} pieces of trash detected in this river. Consider organizing a cleanup 
                  effort to prevent further environmental damage and protect aquatic life.
                </p>
              </div>
            </div>
          )}
          
          {trashCount === 0 && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex items-start">
              <div>
                <h4 className="text-sm font-medium text-green-800">Clean River</h4>
                <p className="text-xs text-green-700 mt-1">
                  No visible trash detected in this river. Well-maintained waterways support healthier
                  ecosystems and provide safer recreational opportunities.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800">About Trash Detection</h4>
          <p className="text-xs text-blue-600 mt-1">
            Our system identifies floating debris and trash items using computer vision models 
            trained on various pollution types. Detection accuracy may vary based on water turbidity,
            lighting conditions, and item visibility.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrashDetection;
