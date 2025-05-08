
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import UploadSection from '@/components/UploadSection';
import FlowAnalysis from '@/components/FlowAnalysis';
import TrashDetection from '@/components/TrashDetection';
import ProcessingVisualization from '@/components/ProcessingVisualization';
import OpticalFlowVisualization from '@/components/OpticalFlowVisualization';
import { analyzeVideo } from '@/utils/videoAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CloudLightning, FileVideo } from "lucide-react";
import { AnalysisResult } from '@/types/analysis';

declare global {
  interface Window {
    updateProcessingStage: (stage: number) => void;
  }
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState(tabParam || 'flow');
  const [processingStage, setProcessingStage] = useState(0);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(1);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/?tab=${value}`, { replace: true });
  };

  // Sync with URL params when they change
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
      
      // Set default selected frame for optical flow visualization
      if (result.frames && result.frames.length > 1) {
        setSelectedFrameIndex(1);
      }

      toast.success("Video analysis complete!");
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error("Error processing video. Please try again.");
    } finally {
      setIsProcessing(false);
      delete window.updateProcessingStage;
    }
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
              <div className="bg-white rounded-lg shadow">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="w-full border-b">
                    <TabsTrigger value="flow">Optical Flow</TabsTrigger>
                    <TabsTrigger value="trash">Trash Detection</TabsTrigger>
                    <TabsTrigger value="combined">Combined Analysis</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-4">
                    <TabsContent value="flow">
                      <div className="space-y-4">
                        {analysisResult.frames.length > 1 && analysisResult.flowVectors.length > 0 && (
                          <div>
                            <OpticalFlowVisualization
                              previousFrame={analysisResult.frames[selectedFrameIndex - 1]}
                              currentFrame={analysisResult.frames[selectedFrameIndex]}
                              flowVectors={analysisResult.flowVectors[selectedFrameIndex - 1]}
                            />
                            <div className="mt-4">
                              <label htmlFor="frame-selector" className="block text-sm font-medium text-gray-700 mb-1">
                                Select Frame Pair:
                              </label>
                              <input 
                                id="frame-selector"
                                type="range"
                                min={1}
                                max={analysisResult.frames.length - 1}
                                value={selectedFrameIndex}
                                onChange={(e) => setSelectedFrameIndex(parseInt(e.target.value))}
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Frame pair {selectedFrameIndex} of {analysisResult.frames.length - 1}
                              </p>
                            </div>
                          </div>
                        )}
                        <FlowAnalysis 
                          averageVelocity={analysisResult.averageVelocity}
                          flowMagnitude={analysisResult.flowMagnitude}
                          flowVectors={analysisResult.flowVectors}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="trash">
                      <TrashDetection 
                        trashCount={analysisResult.trashCount}
                        trashCategories={analysisResult.trashCategories}
                        environmentalImpact={analysisResult.environmentalImpact}
                        trashImages={analysisResult.trashDetectionImages}
                      />
                    </TabsContent>
                    
                    <TabsContent value="combined">
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900">Combined Flow & Trash Analysis</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Flow summary */}
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="text-md font-medium text-blue-800 mb-2">Water Flow Analysis</h3>
                            <div className="text-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700">Average Velocity:</span>
                                <span className="font-medium">{analysisResult.averageVelocity} m/s</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700">Flow Magnitude:</span>
                                <span className="font-medium">{analysisResult.flowMagnitude} units</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Trash summary */}
                          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h3 className="text-md font-medium text-green-800 mb-2">Trash Detection Summary</h3>
                            <div className="text-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-green-700">Total Items:</span>
                                <span className="font-medium">{analysisResult.trashCount}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-green-700">Categories:</span>
                                <span className="font-medium">
                                  {analysisResult.trashCategories.length > 0 
                                    ? analysisResult.trashCategories.join(', ') 
                                    : 'None detected'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Sample image with combined visualization */}
                        {analysisResult.frames.length > 1 && analysisResult.flowVectors.length > 0 && (
                          <div className="bg-white p-4 rounded-lg border">
                            <h3 className="text-md font-medium text-gray-800 mb-3">Combined Visualization</h3>
                            <OpticalFlowVisualization
                              previousFrame={analysisResult.frames[selectedFrameIndex - 1]}
                              currentFrame={analysisResult.frames[selectedFrameIndex]}
                              flowVectors={analysisResult.flowVectors[selectedFrameIndex - 1]}
                            />
                            <div className="mt-4">
                              <input 
                                type="range"
                                min={1}
                                max={analysisResult.frames.length - 1}
                                value={selectedFrameIndex}
                                onChange={(e) => setSelectedFrameIndex(parseInt(e.target.value))}
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Impact assessment */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h3 className="text-md font-medium text-gray-800 mb-2">Environmental Assessment</h3>
                          <p className="text-sm text-gray-600">
                            {analysisResult.environmentalImpact}
                          </p>
                          <div className="mt-3 text-xs text-gray-500">
                            The flow velocity can affect how pollutants spread in the water. With a velocity of 
                            {' '}{analysisResult.averageVelocity} m/s, trash and other pollutants will disperse 
                            {analysisResult.averageVelocity > 1 ? ' rapidly' : analysisResult.averageVelocity > 0.5 ? ' moderately' : ' slowly'} 
                            {' '}downstream.
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
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
