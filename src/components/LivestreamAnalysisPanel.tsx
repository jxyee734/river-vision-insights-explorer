import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { captureFrameFromIframe } from '@/utils/livestreamAnalysis';
import { detectTrashInImage } from '@/services/roboflowService';

interface LivestreamAnalysisResult {
  timestamp: Date;
  flowVelocity: number;
  flowDirection: string;
  trashCount: number;
  trashCategories: string[];
  waterQuality: { status: string; color: string; };
  processedImage: string;
}

interface LivestreamAnalysisPanelProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isStreamActive: boolean;
  streamName: string;
}

const LivestreamAnalysisPanel: React.FC<LivestreamAnalysisPanelProps> = ({
  iframeRef,
  isStreamActive,
  streamName
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<LivestreamAnalysisResult[]>([]);
  const [latestResult, setLatestResult] = useState<LivestreamAnalysisResult | null>(null);
  const [analysisInterval, setAnalysisInterval] = useState<number>(5);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [timeToNextAnalysis, setTimeToNextAnalysis] = useState<number>(analysisInterval);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const analysisTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    };
  }, []);
  
  // Reset analysis when stream changes
  useEffect(() => {
    stopAnalysis();
    setAnalysisResults([]);
    setLatestResult(null);
    setLastAnalysisTime(null);
  }, [streamName]);
  
  // Update countdown timer
  useEffect(() => {
    if (isAnalyzing && lastAnalysisTime) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      
      countdownTimerRef.current = window.setInterval(() => {
        const elapsed = (new Date().getTime() - lastAnalysisTime.getTime()) / 1000;
        const remaining = Math.max(0, analysisInterval - elapsed);
        setTimeToNextAnalysis(Math.round(remaining));
        
        if (remaining <= 0 && countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      }, 1000);
    }
    
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isAnalyzing, lastAnalysisTime, analysisInterval]);
  
  // Function to analyze video from iframe
  const analyzeLivestreamDirectly = async () => {
    if (!iframeRef.current || !canvasRef.current) return null;
    
    try {
      // Capture frame from iframe
      const frame = await captureFrameFromIframe(iframeRef.current);
      if (!frame) return null;
      
      // Create an image from the captured frame
      const img = new Image();
      img.src = frame;
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // Draw the image to canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Get base64 data for Roboflow API
      const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];
      
      // Analyze with Roboflow API
      const roboflowResult = await detectTrashInImage(base64Data);
      
      // Create processed image with bounding boxes if detections found
      let processedImage = frame;
      if (roboflowResult && roboflowResult.predictions && roboflowResult.predictions.length > 0) {
        roboflowResult.predictions.forEach(prediction => {
          const x = prediction.x - prediction.width / 2;
          const y = prediction.y - prediction.height / 2;
          
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, prediction.width, prediction.height);
          
          ctx.font = '14px Arial';
          const label = `${prediction.class} ${Math.round(prediction.confidence * 100)}%`;
          const textWidth = ctx.measureText(label).width;
          
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(x, y - 20, textWidth + 10, 20);
          ctx.fillStyle = '#000000';
          ctx.fillText(label, x + 5, y - 5);
        });
        
        processedImage = canvas.toDataURL('image/jpeg');
      }
      
      // Generate random values for demonstration
      const flowVelocity = 0.5 + Math.random() * 1.5;
      const flowDirection = ['Northward', 'Southward', 'Eastward', 'Westward'][Math.floor(Math.random() * 4)];
      const trashCount = roboflowResult?.predictions?.length || 0;
      const trashCategories = roboflowResult?.predictions?.map(p => p.class) || [];
      
      // Generate water quality status based on detections
      const waterQuality = trashCount > 2 
        ? { status: 'Poor', color: 'red-500' } 
        : trashCount > 0 
        ? { status: 'Fair', color: 'yellow-500' } 
        : { status: 'Good', color: 'green-500' };
      
      return {
        timestamp: new Date(),
        flowVelocity,
        flowDirection,
        trashCount,
        trashCategories: [...new Set(trashCategories)],
        waterQuality,
        processedImage
      };
    } catch (error) {
      console.error('Error analyzing livestream directly:', error);
      return null;
    }
  };
  
  const startAnalysis = async () => {
    if (!isStreamActive || !iframeRef.current) {
      toast.error("Cannot analyze: stream is not active");
      return;
    }
    
    setIsAnalyzing(true);
    toast.info("Starting analysis...");
    
    // Perform initial analysis immediately
    await performAnalysis();
    
    // Set up interval for continuous analysis
    analysisTimerRef.current = window.setInterval(() => {
      performAnalysis();
    }, analysisInterval * 1000);
  };
  
  const stopAnalysis = () => {
    if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    
    analysisTimerRef.current = null;
    countdownTimerRef.current = null;
    processingTimeoutRef.current = null;
    
    setIsAnalyzing(false);
    setTimeToNextAnalysis(analysisInterval);
    setIsProcessing(false);
  };
  
  const performAnalysis = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      if (!iframeRef.current) {
        setIsProcessing(false);
        return;
      }
      
      // Add timeout to ensure processing state gets cleared
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      processingTimeoutRef.current = window.setTimeout(() => {
        setIsProcessing(false);
      }, 8000);
      
      // Directly analyze the livestream
      const result = await analyzeLivestreamDirectly();
      
      if (result) {
        // Update state with new result
        setLatestResult(result);
        setAnalysisResults(prev => {
          // Keep only the last 10 results
          const newResults = [...prev, result];
          if (newResults.length > 10) {
            return newResults.slice(newResults.length - 10);
          }
          return newResults;
        });
        
        // Update last analysis time
        setLastAnalysisTime(new Date());
        setTimeToNextAnalysis(analysisInterval);
      }
      
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsProcessing(false);
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
      <CardContent className="p-4">
        {/* Hidden canvas for video processing */}
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium">Stream Analysis</h2>
          
          <Button
            size="sm"
            variant={isAnalyzing ? "destructive" : "default"}
            onClick={isAnalyzing ? stopAnalysis : startAnalysis}
            disabled={!isStreamActive || isProcessing}
            className={isProcessing ? "animate-pulse" : ""}
          >
            {isAnalyzing ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
        
        {!isStreamActive && (
          <div className="bg-gray-100 p-4 rounded-md flex items-center dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Select an active stream to begin analysis</p>
          </div>
        )}
        
        {isAnalyzing && latestResult && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-blue-800 dark:text-blue-300">Real-Time Measurements</h3>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300">
                  {isProcessing ? "Processing..." : `Next update: ${timeToNextAnalysis}s`}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Flow Velocity</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {latestResult.flowVelocity.toFixed(2)}
                    <span className="text-sm ml-1">m/s</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Objects Detected</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {latestResult.trashCount}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Analysis progress</span>
                  <span className="font-medium">{Math.round(timeToNextAnalysis/analysisInterval * 100)}%</span>
                </div>
                <Progress 
                  value={(1 - timeToNextAnalysis/analysisInterval) * 100} 
                  className="h-2" 
                />
              </div>
            </div>
            
            {latestResult.processedImage && (
              <div>
                <h4 className="text-sm font-medium mb-2">Latest Analysis</h4>
                <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                  <img 
                    src={latestResult.processedImage} 
                    alt="Processed stream frame" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {latestResult.timestamp instanceof Date 
                      ? latestResult.timestamp.toLocaleTimeString()
                      : new Date(latestResult.timestamp).toLocaleTimeString()
                    }
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  Flow Analysis
                </h4>
                <div className="space-y-1 text-xs">
                  {analysisResults.slice(-5).reverse().map((result, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-500">
                        {result.timestamp instanceof Date 
                          ? result.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})
                          : new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})
                        }
                      </span>
                      <span>{result.flowVelocity.toFixed(2)} m/s</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Trash2 className="w-3 h-3 mr-1 text-red-500" />
                  Object Detection
                </h4>
                <div className="space-y-1 text-xs">
                  {analysisResults.slice(-5).reverse().map((result, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-500">
                        {result.timestamp instanceof Date 
                          ? result.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})
                          : new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})
                        }
                      </span>
                      <span>{result.trashCount} items</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!latestResult && isStreamActive && (
          <div className="text-center p-8">
            <p className="text-sm text-gray-500">
              Click "Analyze" to begin real-time object detection and flow analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LivestreamAnalysisPanel;
