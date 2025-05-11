
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import UploadSection from '@/components/UploadSection';
import VideoPlayer from '@/components/VideoPlayer';
import ProcessingVisualization from '@/components/ProcessingVisualization';
import { analyzeVideo } from '@/utils/videoAnalysis';
import { CloudLightning, FileVideo, ArrowRight } from "lucide-react";
import { AnalysisResult } from '@/types/analysis';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

declare global {
  interface Window {
    updateProcessingStage: (stage: number) => void;
  }
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  
  const handleVideoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingStage(0);
      
      window.updateProcessingStage = (stage: number) => {
        setProcessingStage(stage);
      };
      
      toast.info("Processing video with AI analysis, please wait...");
      
      const result = await analyzeVideo(file);
      setAnalysisResult(result);
      
      toast.success("Video analysis complete!");
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error("Error processing video. Please try again.");
    } finally {
      setIsProcessing(false);
      delete window.updateProcessingStage;
    }
  };

  // Prepare flow data for the chart
  const prepareChartData = () => {
    if (!analysisResult?.flowVectors || analysisResult.flowVectors.length === 0) {
      return [];
    }

    return analysisResult.flowVectors.map((flow, frameIndex) => {
      // Calculate average velocity for this frame
      const avgVelocity = flow.velocities.reduce((sum, v) => sum + v, 0) / flow.velocities.length;
      
      return {
        name: `Frame ${frameIndex + 1}`,
        velocity: Number(avgVelocity.toFixed(2)),
        average: analysisResult.averageVelocity
      };
    });
  };

  const chartData = prepareChartData();

  // Group trash by categories and count
  const getTrashCategories = () => {
    if (!analysisResult?.trashCategories) return {};
    
    const categories: Record<string, number> = {};
    analysisResult.trashCategories.forEach(category => {
      if (categories[category]) {
        categories[category]++;
      } else {
        categories[category] = 1;
      }
    });
    
    return categories;
  };

  const trashCategories = getTrashCategories();

  // Get velocity color based on speed
  const getVelocityColor = (velocity: number) => {
    if (velocity < 0.5) return 'bg-blue-200 text-blue-800'; // Slow
    if (velocity < 1.0) return 'bg-blue-300 text-blue-800'; // Moderate
    if (velocity < 1.5) return 'bg-blue-400 text-blue-900'; // Fast
    return 'bg-blue-500 text-white'; // Very fast
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <div className="flex items-center space-x-2">
            <CloudLightning className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">River Analysis</h1>
              <p className="text-sm text-gray-500">Optical Flow & Trash Detection</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <UploadSection 
              onVideoUploaded={handleVideoUpload} 
              isProcessing={isProcessing} 
            />

            {isProcessing && (
              <div className="mt-6">
                <ProcessingVisualization currentStage={processingStage} />
              </div>
            )}

            {analysisResult && (
              <div className="mt-6 bg-white rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <FileVideo className="h-5 w-5 text-blue-500 mr-2" />
                  Analysis Summary
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Frames Analyzed:</span>
                    <span className="font-medium">{analysisResult.frames.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Flow Velocity:</span>
                    <span className="font-medium">{analysisResult.averageVelocity} m/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Trash Items:</span>
                    <span className="font-medium">{analysisResult.trashCount}</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 italic">
                  Note: All measurements are estimates based on AI analysis.
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!analysisResult ? (
              <div className="h-full flex items-center justify-center bg-white rounded-lg shadow p-8 border border-dashed border-gray-200">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-medium text-gray-700 mb-2">Analyze River Videos</h2>
                  <p className="text-gray-500">
                    Upload a river video to analyze water flow and detect trash.
                    Our AI-powered analysis provides insights on flow patterns and pollution detection.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {analysisResult.videoUrl && (
                  <VideoPlayer 
                    videoUrl={analysisResult.videoUrl} 
                    trashDetections={analysisResult.trashDetections}
                  />
                )}
                
                {/* Flow Analysis Section */}
                <Card className="w-full">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">Average Velocity</h3>
                          <div className="flex items-baseline">
                            <span className="text-3xl font-bold text-blue-700">{analysisResult.averageVelocity}</span>
                            <span className="ml-1 text-sm text-blue-600">m/s</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full ${getVelocityColor(analysisResult.averageVelocity)}`}>
                          {analysisResult.averageVelocity < 0.5 && 'Slow'}
                          {analysisResult.averageVelocity >= 0.5 && analysisResult.averageVelocity < 1.0 && 'Moderate'}
                          {analysisResult.averageVelocity >= 1.0 && analysisResult.averageVelocity < 1.5 && 'Fast'}
                          {analysisResult.averageVelocity >= 1.5 && 'Very Fast'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">Flow Magnitude</h3>
                          <div className="flex items-baseline">
                            <span className="text-3xl font-bold text-blue-700">{analysisResult.flowMagnitude}</span>
                            <span className="ml-1 text-sm text-blue-600">units</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ArrowRight className={`h-5 w-5 ${analysisResult.flowMagnitude > 5 ? 'text-blue-700' : 'text-blue-500'}`} />
                          {analysisResult.flowMagnitude > 3 && 
                            <ArrowRight className={`h-5 w-5 ${analysisResult.flowMagnitude > 6 ? 'text-blue-700' : 'text-blue-500'}`} />
                          }
                          {analysisResult.flowMagnitude > 6 && 
                            <ArrowRight className="h-5 w-5 text-blue-700" />
                          }
                        </div>
                      </div>
                    </div>
                    
                    {chartData.length > 0 && (
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
                            <ReferenceLine y={analysisResult.averageVelocity} stroke="#8884d8" strokeDasharray="3 3" label="Average" />
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
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Trash Detection Section */}
                {analysisResult.trashDetections && analysisResult.trashDetections.length > 0 && (
                  <Card className="w-full">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Trash Classification</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-lg">
                          <span className="text-3xl font-bold text-red-600">{analysisResult.trashCount}</span>
                          <span className="text-sm text-red-600">Total Trash Items</span>
                        </div>
                        
                        <div className="flex flex-col p-4 bg-green-50 border border-green-100 rounded-lg">
                          <h4 className="text-sm font-medium text-green-800 mb-2">Detected Categories</h4>
                          {Object.entries(trashCategories).map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span className="text-sm text-green-700 capitalize">{category}</span>
                              <span className="font-medium text-green-800">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {analysisResult.trashDetectionImages && analysisResult.trashDetectionImages.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Detection</h4>
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={analysisResult.trashDetectionImages[0]} 
                              alt="Trash detection example" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Single frame showing detected trash items
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            This application uses advanced AI techniques to analyze river videos.
            <br />For research and educational purposes only.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
