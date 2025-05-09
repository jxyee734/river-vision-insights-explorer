
import React, { useState } from 'react';
import { toast } from "sonner";
import UploadSection from '@/components/UploadSection';
import TrashDetection from '@/components/TrashDetection';
import ProcessingVisualization from '@/components/ProcessingVisualization';
import { analyzeVideo } from '@/utils/videoAnalysis';
import { FileVideo, Waves } from "lucide-react";
import { AnalysisResult } from '@/types/analysis';
import OpticalFlowVisualization from '@/components/OpticalFlowVisualization';

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
  const [processingStage, setProcessingStage] = useState(0);
  const [currentFrame, setCurrentFrame] = useState<ImageData | null>(null);
  const [previousFrame, setPreviousFrame] = useState<ImageData | null>(null);
  const [flowVectors, setFlowVectors] = useState<{velocities: number[], directions: number[]}>({
    velocities: [],
    directions: []
  });

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

      if (result.frames && result.frames.length > 1) {
        setPreviousFrame(result.frames[0]);
        setCurrentFrame(result.frames[1]);
        
        // Extract flow vectors from the result
        if (result.averageVelocity && result.flowMagnitude) {
          // Generate sample vectors for visualization
          const velocities = Array(100).fill(0).map(() => Math.random() * result.averageVelocity);
          const directions = Array(100).fill(0).map(() => Math.random() * Math.PI * 2);
          
          setFlowVectors({
            velocities,
            directions
          });
        }
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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-2">
            <Waves className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">River Analysis</h1>
              <p className="text-sm text-gray-500">Optical Flow and Trash Detection</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
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
                    <span className="text-gray-500">Flow Velocity:</span>
                    <span className="font-medium">{analysisResult.averageVelocity} m/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Trash Items:</span>
                    <span className="font-medium">{analysisResult.trashCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            {!analysisResult ? (
              <div className="h-full flex items-center justify-center bg-white rounded-lg shadow p-8 border border-dashed border-gray-200">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-medium text-gray-700 mb-2">Analyze River Videos</h2>
                  <p className="text-gray-500">
                    Upload a river video to analyze water flow and detect trash.
                    Our AI-powered analysis provides detailed insights.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {previousFrame && currentFrame && (
                  <OpticalFlowVisualization 
                    previousFrame={previousFrame}
                    currentFrame={currentFrame}
                    flowVectors={flowVectors}
                  />
                )}
                
                <TrashDetection 
                  trashCount={analysisResult.trashCount || 0}
                  trashCategories={analysisResult.trashCategories || []}
                  environmentalImpact={analysisResult.environmentalImpact || ''}
                  trashImages={analysisResult.trashDetectionImages || []}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            River Analysis uses advanced AI techniques to analyze optical flow and detect trash in river videos.
            <br />For research and educational purposes only.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
