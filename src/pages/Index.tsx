
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import UploadSection from '@/components/UploadSection';
import FlowAnalysis from '@/components/FlowAnalysis';
import TrashDetection from '@/components/TrashDetection';
import ProcessingVisualization from '@/components/ProcessingVisualization';
import VideoPlayer from '@/components/VideoPlayer';
import DepthVisualization from '@/components/DepthVisualization';
import { analyzeVideo } from '@/utils/videoAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CloudLightning, FileVideo, Layers, Trash } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState(tabParam || 'video');
  const [processingStage, setProcessingStage] = useState(0);
  
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
              <p className="text-sm text-gray-500">Optical Flow, Depth & Trash Detection</p>
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
                    <span className="text-gray-500">River Depth:</span>
                    <span className="font-medium">{analysisResult.averageDepth} m</span>
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
                    Upload a river video to analyze water flow, depth, and detect trash.
                    Our AI-powered analysis provides detailed environmental insights.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="w-full border-b">
                    <TabsTrigger value="video">Video Analysis</TabsTrigger>
                    <TabsTrigger value="flow">Flow Data</TabsTrigger>
                    <TabsTrigger value="depth">Depth Profile</TabsTrigger>
                    <TabsTrigger value="trash">Trash Detection</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-4">
                    <TabsContent value="video">
                      {analysisResult.videoUrl && (
                        <VideoPlayer 
                          videoUrl={analysisResult.videoUrl} 
                          trashDetections={analysisResult.trashDetections}
                          flowVectors={analysisResult.flowVectors}
                          depthProfile={analysisResult.depthProfile}
                          averageDepth={analysisResult.averageDepth}
                        />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="flow">
                      <FlowAnalysis 
                        averageVelocity={analysisResult.averageVelocity}
                        flowMagnitude={analysisResult.flowMagnitude}
                        flowVectors={analysisResult.flowVectors}
                      />
                    </TabsContent>
                    
                    <TabsContent value="depth">
                      <DepthVisualization 
                        depthProfile={analysisResult.depthProfile}
                        averageDepth={analysisResult.averageDepth}
                        maxDepth={analysisResult.maxDepth}
                        depthConfidence={analysisResult.depthConfidence}
                      />
                    </TabsContent>
                    
                    <TabsContent value="trash">
                      <TrashDetection 
                        trashCount={analysisResult.trashCount}
                        trashCategories={analysisResult.trashCategories}
                        environmentalImpact={analysisResult.environmentalImpact}
                        trashImages={analysisResult.trashDetectionImages}
                      />
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
