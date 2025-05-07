import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, BarChart2, Trash2, Activity, AlertCircle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { captureFrameFromIframe, LivestreamAnalysisResult } from '@/utils/livestreamAnalysis';
import { detectTrashInImage } from '@/services/roboflowService';

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
  const [analysisInterval, setAnalysisInterval] = useState<number>(5); // Decreased to 5 seconds
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [timeToNextAnalysis, setTimeToNextAnalysis] = useState<number>(analysisInterval);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs to store timers
  const analysisTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  
  // Canvas ref for direct video analysis
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset analysis when stream changes
  useEffect(() => {
    stopAnalysis();
    setAnalysisResults([]);
    setLatestResult(null);
    setLastAnalysisTime(null);
  }, [streamName]);
  
  // Memoized function to update countdown timer
  const updateCountdown = useCallback(() => {
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
  
  // Update countdown when dependencies change
  useEffect(() => {
    updateCountdown();
  }, [updateCountdown]);
  
  // Function to directly analyze video from iframe
  const analyzeLivestreamDirectly = async () => {
    if (!iframeRef.current || !canvasRef.current) return null;
    
    try {
      // Capture frame directly from iframe
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
      
      // Get base64 data for Roboflow API (without data:image/jpeg;base64, prefix)
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
      
      // Generate random values for demonstration - in a real app you would calculate these
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
      
      // Return analysis result
      return {
        timestamp: new Date().toISOString(),
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
    toast.info("Starting livestream analysis...");
    
    // Perform initial analysis immediately
    await performAnalysis();
    
    // Set up interval for continuous analysis
    analysisTimerRef.current = window.setInterval(() => {
      performAnalysis();
    }, analysisInterval * 1000);
  };
  
  const stopAnalysis = () => {
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    setIsAnalyzing(false);
    setTimeToNextAnalysis(analysisInterval);
    setIsProcessing(false);
  };
  
  const performAnalysis = async () => {
    // Prevent multiple analyses running simultaneously
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
          // Keep only the last 10 results to reduce memory usage
          const newResults = [...prev, result];
          if (newResults.length > 10) {
            return newResults.slice(newResults.length - 10);
          }
          return newResults;
        });
        
        // Update last analysis time
        const now = new Date();
        setLastAnalysisTime(now);
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
  
  // Calculate averages from the collected data - memoized calculation
  const { averageFlowVelocity, totalTrashDetected, allTrashCategories, recentResults } = React.useMemo(() => {
    const avgFlow = analysisResults.length > 0
      ? analysisResults.reduce((sum, result) => sum + result.flowVelocity, 0) / analysisResults.length
      : 0;
      
    const totalTrash = analysisResults.reduce((sum, result) => sum + result.trashCount, 0);
    
    const categories = analysisResults.reduce((cats, result) => {
      result.trashCategories.forEach(category => cats.add(category));
      return cats;
    }, new Set<string>());

    // Only use the last 5 results for recent display
    const recent = analysisResults.slice(-5).reverse();

    return {
      averageFlowVelocity: avgFlow,
      totalTrashDetected: totalTrash,
      allTrashCategories: categories,
      recentResults: recent
    };
  }, [analysisResults]);

  return (
    <div className="space-y-4">
      {/* Hidden canvas for video processing */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg flex items-center">
          <BarChart2 className="w-5 h-5 mr-2" />
          Livestream Analysis
        </CardTitle>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={isAnalyzing ? "destructive" : "default"}
            onClick={isAnalyzing ? stopAnalysis : startAnalysis}
            disabled={!isStreamActive || isProcessing}
            className="animate-pulse-slow"
          >
            {isAnalyzing ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Analysis
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Analysis
              </>
            )}
          </Button>
        </div>
      </div>
      
      {!isStreamActive && (
        <div className="bg-muted p-4 rounded-md flex items-center">
          <AlertCircle className="text-muted-foreground mr-2" />
          <p className="text-sm text-muted-foreground">Select an active stream to begin analysis</p>
        </div>
      )}
      
      {isAnalyzing && latestResult && (
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md mb-4 backdrop-blur-sm border border-blue-200 dark:border-blue-900/50 slide-in-right">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Real-Time Measurements
            </h3>
            <Badge variant={isProcessing ? "outline" : "secondary"} className={isProcessing ? "animate-pulse" : ""}>
              {isProcessing ? "Processing..." : `Next update: ${timeToNextAnalysis}s`}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30">
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Flow Velocity</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
                {latestResult.flowVelocity.toFixed(2)}
                <span className="text-base ml-1">m/s</span>
                {latestResult.flowDirection && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <ArrowRight className="w-3 h-3 mr-1" /> {latestResult.flowDirection}
                  </Badge>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30">
              <div className="text-sm text-gray-500 dark:text-gray-400">Measurements Collected</div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {analysisResults.length}
                <span className="text-base ml-1">points</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Average Flow Velocity</span>
              <span className="font-medium">{averageFlowVelocity.toFixed(2)} m/s</span>
            </div>
            <Progress 
              value={(averageFlowVelocity / 5) * 100} 
              className="h-3 bg-blue-100 dark:bg-blue-900/30" 
            />
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Water quality: 
              <span className={`ml-1 font-medium ${
                latestResult.waterQuality?.color === 'green-500' 
                  ? 'text-green-600 dark:text-green-400' 
                  : latestResult.waterQuality?.color === 'yellow-500'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {latestResult.waterQuality?.status}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {isStreamActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-2 text-blue-500" />
                Flow Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Current Flow Velocity</span>
                    <span className="font-medium">{latestResult?.flowVelocity.toFixed(2) || '0.00'} m/s</span>
                  </div>
                  <Progress value={latestResult ? (latestResult.flowVelocity / 5) * 100 : 0} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Flow Velocity</span>
                    <span className="font-medium">{averageFlowVelocity.toFixed(2)} m/s</span>
                  </div>
                  <Progress value={(averageFlowVelocity / 5) * 100} />
                </div>
                
                {isAnalyzing && latestResult && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md">
                    <div className="flex justify-between items-center text-xs font-medium mb-2">
                      <span>Direction: {latestResult.flowDirection}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        latestResult.waterQuality?.color === 'green-500' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : latestResult.waterQuality?.color === 'yellow-500'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        Water: {latestResult.waterQuality?.status}
                      </span>
                    </div>
                    
                    <div className="text-xs font-medium mb-1">Recent Measurements</div>
                    <div className="space-y-1">
                      {recentResults.map((result, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                          </span>
                          <span className={result.flowVelocity > averageFlowVelocity ? 'text-blue-500' : ''}>
                            {result.flowVelocity.toFixed(2)} m/s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {analysisResults.length} measurement{analysisResults.length !== 1 ? 's' : ''} collected
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                Trash Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Latest Detection</span>
                    <span className="font-medium">{latestResult?.trashCount || 0} items</span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Detected</span>
                    <span className="font-medium">{totalTrashDetected} items</span>
                  </div>
                  
                  {isAnalyzing && recentResults.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md mb-2">
                      <div className="text-xs font-medium mb-2">Recent Detections</div>
                      <div className="space-y-1">
                        {recentResults.map((result, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                            </span>
                            <span className={result.trashCount > 0 ? 'text-red-500' : ''}>
                              {result.trashCount} items
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.from(allTrashCategories).map(category => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {allTrashCategories.size === 0 && (
                      <span className="text-xs text-muted-foreground">No categories detected</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {latestResult?.processedImage && (
        <div>
          <h4 className="text-sm font-medium mb-2">Latest Processed Frame</h4>
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <img 
              src={latestResult.processedImage} 
              alt="Processed stream frame" 
              className="w-full h-full object-contain"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {new Date(latestResult.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="text-xs text-muted-foreground">
          Analyzing stream every {analysisInterval} seconds using Roboflow API (key: hqoayI9gLjP3qmVGXdIf).
        </div>
      )}
    </div>
  );
};

export default LivestreamAnalysisPanel;
