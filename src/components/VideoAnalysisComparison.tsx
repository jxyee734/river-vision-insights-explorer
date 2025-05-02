
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart2, Video, Waves, FileVideo } from 'lucide-react';
import { AnalysisResult } from '@/types/analysis';
import LiveStreamView from './LiveStreamView';

interface VideoAnalysisComparisonProps {
  userVideoAnalysis: AnalysisResult | null;
  onLocationSelected: (lat: number, lng: number, name: string) => void;
}

const VideoAnalysisComparison: React.FC<VideoAnalysisComparisonProps> = ({ 
  userVideoAnalysis,
  onLocationSelected
}) => {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart2 className="h-5 w-5 text-primary mr-2" />
          Video Analysis Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparison">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="comparison">
              <FileVideo className="h-4 w-4 mr-2" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="user-video">
              <Video className="h-4 w-4 mr-2" />
              User Video
            </TabsTrigger>
            <TabsTrigger value="live-stream">
              <Waves className="h-4 w-4 mr-2" />
              Live Stream
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Video Analysis Summary */}
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Video className="h-4 w-4 mr-2 text-blue-500" />
                  User Video Analysis
                </h3>
                {userVideoAnalysis ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Depth:</span>
                      <span>{userVideoAnalysis.averageDepth} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Flow Velocity:</span>
                      <span>{userVideoAnalysis.averageVelocity} m/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trash Items:</span>
                      <span>{userVideoAnalysis.trashCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trash Categories:</span>
                      <span>{userVideoAnalysis.trashCategories.join(', ')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No user video has been analyzed yet
                  </div>
                )}
              </div>
              
              {/* Live Stream Analysis */}
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Waves className="h-4 w-4 mr-2 text-green-500" />
                  Live Stream Analysis
                </h3>
                <div className="text-sm text-muted-foreground">
                  <p>Select a live stream and click "Analyze Stream" to see real-time analysis of water flow and trash detection.</p>
                  <p className="mt-2">Live analysis provides current data that can be compared with user uploaded videos.</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Analysis Methodology</p>
              <p className="mt-1">Both user videos and live streams are analyzed using the same AI models and algorithms:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Water flow is calculated using optical flow detection</li>
                <li>Trash detection uses computer vision and machine learning</li>
                <li>Depth estimation is based on color and brightness analysis</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="user-video">
            {userVideoAnalysis ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                  {userVideoAnalysis.trashDetectionImages && userVideoAnalysis.trashDetectionImages.length > 0 ? (
                    <img 
                      src={userVideoAnalysis.trashDetectionImages[0]} 
                      alt="Analyzed video frame with trash detection"
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No detection images available
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="text-white text-sm">
                      User uploaded video analysis result
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
                          <span className="text-muted-foreground">Average Velocity:</span>
                          <span>{userVideoAnalysis.averageVelocity} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Flow Magnitude:</span>
                          <span>{userVideoAnalysis.flowMagnitude}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Average Depth:</span>
                          <span>{userVideoAnalysis.averageDepth} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Maximum Depth:</span>
                          <span>{userVideoAnalysis.maxDepth} m</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Trash Detection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trash Count:</span>
                          <span>{userVideoAnalysis.trashCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Categories:</span>
                          <span>{userVideoAnalysis.trashCategories.join(', ')}</span>
                        </div>
                        <div className="flex-col">
                          <span className="text-muted-foreground">Environmental Impact:</span>
                          <p className="mt-1 text-xs">{userVideoAnalysis.environmentalImpact}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Video Analysis Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Upload and analyze a river video first to see detailed analysis results here.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="live-stream">
            <LiveStreamView onLocationSelected={onLocationSelected} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default VideoAnalysisComparison;
