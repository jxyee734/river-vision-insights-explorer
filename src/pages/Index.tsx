import React, { useState } from 'react';
import { toast } from "sonner";
import UploadSection from '@/components/UploadSection';
import DepthVisualization from '@/components/DepthVisualization';
import FlowAnalysis from '@/components/FlowAnalysis';
import TrashDetection from '@/components/TrashDetection';
import ProcessingVisualization from '@/components/ProcessingVisualization';
import { processVideo } from '@/utils/videoProcessing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownWideNarrow, CloudLightning, FileVideo } from "lucide-react";
import OpticalFlowVisualization from '@/components/OpticalFlowVisualization';
import RiverModel3D from '@/components/RiverModel3D';

interface AnalysisResult {
  averageDepth: number;
  maxDepth: number;
  depthProfile: number[];
  averageVelocity: number;
  flowMagnitude: number;
  trashCount: number;
  frames: ImageData[];
}

interface Frame {
  imageData: ImageData;
  flowVectors?: {
    velocities: number[];
    directions: number[];
  };
}

declare global {
  interface Window {
    updateProcessingStage: (stage: number) => void;
  }
}

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('depth');
  const [processingStage, setProcessingStage] = useState(0);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const handleVideoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingStage(0);
      
      window.updateProcessingStage = (stage: number) => {
        setProcessingStage(stage);
      };
      
      toast.info("Processing video, please wait...");
      
      const result = await processVideo(file);
      setAnalysisResult(result);

      // Store processed frames
      if (result.frames && result.frames.length > 0) {
        setFrames(result.frames.map((frame: ImageData, index: number) => ({
          imageData: frame,
          flowVectors: index > 0 ? calculateWaterFlow(result.frames[index - 1], frame) : undefined
        })));
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

  // Simulated OpenCV-like functions for web implementation
  // In a real implementation, we would use WebAssembly with OpenCV.js

  // Simulates optical flow calculation for water velocity
  const calculateWaterFlow = (previousFrame: ImageData, currentFrame: ImageData): {
    velocities: number[],
    directions: number[],
    magnitude: number
  } => {
    // In a real implementation, this would use optical flow algorithms
    // Like Lucas-Kanade or Farneback methods
    
    // Simulate flow vectors
    const velocities: number[] = [];
    const directions: number[] = [];
    let totalMagnitude = 0;
    
    for (let i = 0; i < 10; i++) {
      // Generate simulated velocity between 0.2 and 1.5 m/s
      const velocity = 0.2 + Math.random() * 1.3;
      velocities.push(Number(velocity.toFixed(2)));
      
      // Generate simulated direction angles in radians (mostly flowing in one direction)
      // Value between -0.3 and 0.3 radians from the main flow direction
      const direction = Math.PI + (Math.random() * 0.6 - 0.3);
      directions.push(Number(direction.toFixed(2)));
      
      totalMagnitude += velocity;
    }
    
    return {
      velocities,
      directions,
      magnitude: Number((totalMagnitude / velocities.length).toFixed(2))
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CloudLightning className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">River Vision Insights Explorer</h1>
              <p className="text-sm text-gray-500">Advanced river analysis and monitoring</p>
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
                    <span className="font-medium">{analysisResult.frames}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Average Depth:</span>
                    <span className="font-medium">{analysisResult.averageDepth} m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Maximum Depth:</span>
                    <span className="font-medium">{analysisResult.maxDepth} m</span>
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
                  Note: All measurements are estimates based on computer vision analysis.
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!analysisResult && (
              <div className="h-full flex items-center justify-center bg-white rounded-lg shadow p-8 border border-dashed border-gray-200">
                <div className="text-center max-w-md">
                  <ArrowDownWideNarrow className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-medium text-gray-700 mb-2">Analyze River Videos</h2>
                  <p className="text-gray-500">
                    Upload a river video to analyze its depth profile, water flow patterns, and detect trash.
                    Our AI-powered analysis provides detailed insights into river conditions.
                  </p>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="bg-white rounded-lg shadow">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full border-b">
                    <TabsTrigger value="depth" className="flex-1">Depth Analysis</TabsTrigger>
                    <TabsTrigger value="flow" className="flex-1">Flow Analysis</TabsTrigger>
                    <TabsTrigger value="trash" className="flex-1">Trash Detection</TabsTrigger>
                    <TabsTrigger value="optical" className="flex-1">Optical Flow</TabsTrigger>
                    <TabsTrigger value="3d" className="flex-1">3D Model</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-4">
                    <TabsContent value="depth">
                      <DepthVisualization 
                        depthProfile={analysisResult.depthProfile}
                        averageDepth={analysisResult.averageDepth}
                        maxDepth={analysisResult.maxDepth}
                      />
                    </TabsContent>
                    
                    <TabsContent value="flow">
                      <FlowAnalysis 
                        averageVelocity={analysisResult.averageVelocity}
                        flowMagnitude={analysisResult.flowMagnitude}
                      />
                    </TabsContent>
                    
                    <TabsContent value="trash">
                      <TrashDetection 
                        trashCount={analysisResult.trashCount}
                      />
                    </TabsContent>
                    
                    <TabsContent value="optical">
                      {frames.length > 1 && currentFrameIndex > 0 && (
                        <OpticalFlowVisualization
                          previousFrame={frames[currentFrameIndex - 1].imageData}
                          currentFrame={frames[currentFrameIndex].imageData}
                          flowVectors={frames[currentFrameIndex].flowVectors!}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="3d">
                      {analysisResult && (
                        <RiverModel3D
                          depthProfile={analysisResult.depthProfile}
                          flowMagnitude={analysisResult.flowMagnitude}
                        />
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            River Vision Insights Explorer uses advanced computer vision techniques to analyze river videos.
            <br />For research and educational purposes only. Actual measurements may vary from estimates.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
