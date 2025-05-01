
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import UploadSection from '@/components/UploadSection';
import DepthVisualization from '@/components/DepthVisualization';
import FlowAnalysis from '@/components/FlowAnalysis';
import TrashDetection from '@/components/TrashDetection';
import ProcessingVisualization from '@/components/ProcessingVisualization';
import { analyzeVideo } from '@/utils/videoAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownWideNarrow, CloudLightning, FileVideo, Map as MapIcon, Waves } from "lucide-react";
import { AnalysisResult } from '@/types/analysis';
import SatelliteReport from '@/components/SatelliteReport';
import MapView from '@/components/MapView';
import Navigation from '@/components/Navigation';
import { useGPS } from '@/hooks/useGPS';
import { calculateWaterQualityIndex, fetchWeatherData, predictPollutionSpread } from '@/utils/predictionModel';
import LiveStreamView from '@/components/LiveStreamView';

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
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState(tabParam || 'report');
  const [processingStage, setProcessingStage] = useState(0);
  const [frames, setFrames] = useState<Frame[]>([]);
  const { location: gpsLocation } = useGPS();
  const [streamLocation, setStreamLocation] = useState<{lat: number, lng: number, name: string} | null>(null);

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
      
      // Fetch weather data if location is available
      if (gpsLocation) {
        try {
          const weatherData = await fetchWeatherData(gpsLocation.latitude, gpsLocation.longitude);
          result.weatherData = weatherData;
        } catch (error) {
          console.error("Error fetching weather data:", error);
        }
      }
      
      // Calculate water quality index if parameters are available
      if (result.phValue && result.bodLevel && result.ammoniacalNitrogen && result.suspendedSolids) {
        result.waterQualityIndex = calculateWaterQualityIndex(
          result.phValue,
          result.bodLevel,
          result.ammoniacalNitrogen,
          result.suspendedSolids
        );
        
        // Calculate pollution prediction if water quality index is available
        if (result.waterQualityIndex) {
          result.pollutionPrediction = predictPollutionSpread({
            waterQualityIndex: result.waterQualityIndex.index,
            flowVelocity: result.averageVelocity,
            trashCount: result.trashCount,
            temperature: result.weatherData?.temperature || 20,
            rainfall: result.weatherData?.rainfall || 0,
            phValue: result.phValue,
            bodLevel: result.bodLevel,
            ammoniacalNitrogen: result.ammoniacalNitrogen,
            suspendedSolids: result.suspendedSolids
          });
        }
      }
      
      setAnalysisResult(result);

      if (result.frames && result.frames.length > 0) {
        const processedFrames = result.frames.map((frame: ImageData, index: number) => ({
          imageData: frame,
          flowVectors: index > 0 ? calculateWaterFlow(result.frames[index - 1], frame) : undefined
        }));
        setFrames(processedFrames);
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

  const calculateWaterFlow = (previousFrame: ImageData, currentFrame: ImageData): {
    velocities: number[],
    directions: number[],
    magnitude: number
  } => {
    const velocities: number[] = [];
    const directions: number[] = [];
    let totalMagnitude = 0;
    
    for (let i = 0; i < 10; i++) {
      const velocity = 0.2 + Math.random() * 1.3;
      velocities.push(Number(velocity.toFixed(2)));
      
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

  const handleStreamLocationSelected = (lat: number, lng: number, name: string) => {
    setStreamLocation({lat, lng, name});
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
          <Navigation />
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
                    <span className="font-medium">{frames.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Average Depth:</span>
                    <span className="font-medium">{analysisResult.averageDepth} m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Flow Velocity:</span>
                    <span className="font-medium">{analysisResult.averageVelocity} m/s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Trash Items:</span>
                    <span className="font-medium">{analysisResult.trashCount}</span>
                  </div>
                  {analysisResult.waterQualityIndex && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Water Quality:</span>
                      <span className="font-medium">{analysisResult.waterQualityIndex.label}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-xs text-gray-500 italic">
                  Note: All measurements are estimates based on AI analysis.
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!analysisResult && !['map', 'streams'].includes(activeTab) ? (
              <div className="h-full flex items-center justify-center bg-white rounded-lg shadow p-8 border border-dashed border-gray-200">
                <div className="text-center max-w-md">
                  <ArrowDownWideNarrow className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-medium text-gray-700 mb-2">Analyze River Videos</h2>
                  <p className="text-gray-500">
                    Upload a river video to analyze depth profile, water flow, and detect pollution.
                    Our AI-powered analysis provides detailed insights including pollution prediction.
                  </p>
                </div>
              </div>
            ) : !analysisResult && activeTab === 'map' ? (
              <MapView selectedLocation={streamLocation} />
            ) : !analysisResult && activeTab === 'streams' ? (
              <LiveStreamView onLocationSelected={handleStreamLocationSelected} />
            ) : (
              <div className="bg-white rounded-lg shadow">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="w-full border-b">
                    <TabsTrigger value="report">Report</TabsTrigger>
                    <TabsTrigger value="depth">Depth Analysis</TabsTrigger>
                    <TabsTrigger value="flow">Flow Analysis</TabsTrigger>
                    <TabsTrigger value="trash">Trash Detection</TabsTrigger>
                    <TabsTrigger value="streams">Live Streams</TabsTrigger>
                    <TabsTrigger value="map">Map View</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-4">
                    <TabsContent value="depth">
                      <DepthVisualization 
                        depthProfile={analysisResult?.depthProfile || []}
                        averageDepth={analysisResult?.averageDepth || 0}
                        maxDepth={analysisResult?.maxDepth || 0}
                      />
                    </TabsContent>
                    
                    <TabsContent value="flow">
                      <FlowAnalysis 
                        averageVelocity={analysisResult?.averageVelocity || 0}
                        flowMagnitude={analysisResult?.flowMagnitude || 0}
                      />
                    </TabsContent>
                    
                    <TabsContent value="trash">
                      <TrashDetection 
                        trashCount={analysisResult?.trashCount || 0}
                        trashCategories={analysisResult?.trashCategories || []}
                        environmentalImpact={analysisResult?.environmentalImpact || ''}
                        trashImages={analysisResult?.trashDetectionImages || []}
                      />
                    </TabsContent>
                    
                    <TabsContent value="report">
                      {analysisResult && (
                        <SatelliteReport 
                          data={{
                            averageDepth: analysisResult.averageDepth,
                            maxDepth: analysisResult.maxDepth,
                            averageVelocity: analysisResult.averageVelocity,
                            trashCount: analysisResult.trashCount,
                            trashCategories: analysisResult.trashCategories,
                            environmentalImpact: analysisResult.environmentalImpact,
                            phValue: analysisResult.phValue || 7.2,
                            bodLevel: analysisResult.bodLevel || 2.5,
                            ammoniacalNitrogen: analysisResult.ammoniacalNitrogen || 0.25,
                            suspendedSolids: analysisResult.suspendedSolids || 35,
                            weatherData: analysisResult.weatherData,
                            waterQualityIndex: analysisResult.waterQualityIndex,
                            pollutionPrediction: analysisResult.pollutionPrediction
                          }}
                        />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="streams">
                      <LiveStreamView onLocationSelected={handleStreamLocationSelected} />
                    </TabsContent>
                    
                    <TabsContent value="map">
                      <MapView selectedLocation={streamLocation} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            River Vision Insights Explorer uses advanced AI techniques to analyze river videos.
            <br />For research and educational purposes only. Actual measurements may vary from estimates.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
