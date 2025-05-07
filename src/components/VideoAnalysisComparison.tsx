
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, FileVideo } from 'lucide-react';
import { AnalysisResult } from '@/types/analysis';

interface VideoAnalysisComparisonProps {
  userVideoAnalysis: AnalysisResult | null;
  onLocationSelected: (lat: number, lng: number, name: string) => void;
}

const VideoAnalysisComparison: React.FC<VideoAnalysisComparisonProps> = ({ 
  userVideoAnalysis
}) => {
  return (
    <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <Video className="h-5 w-5 text-blue-500 mr-2" />
          Video Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="user-video">
          <TabsList className="grid grid-cols-1 mb-4">
            <TabsTrigger value="user-video">
              <FileVideo className="h-4 w-4 mr-2" />
              Analysis Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="user-video">
            {userVideoAnalysis ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                  {userVideoAnalysis.trashDetectionImages && userVideoAnalysis.trashDetectionImages.length > 0 ? (
                    <img 
                      src={userVideoAnalysis.trashDetectionImages[0]} 
                      alt="Analyzed video frame with detection"
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No detection images available
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="text-white text-sm">
                      Analysis result
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Flow Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Average Velocity:</span>
                          <span>{userVideoAnalysis.averageVelocity} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Flow Magnitude:</span>
                          <span>{userVideoAnalysis.flowMagnitude}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Object Detection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Objects Count:</span>
                          <span>{userVideoAnalysis.trashCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Categories:</span>
                          <span>{userVideoAnalysis.trashCategories.join(', ')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Upload and analyze a video to see optical flow and object detection results.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default VideoAnalysisComparison;
