
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, BarChart2, Trash2, Activity, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { captureFrameFromIframe, analyzeLivestreamFrame, LivestreamAnalysisResult } from '@/utils/livestreamAnalysis';

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
  const [analysisInterval, setAnalysisInterval] = useState<number>(5); // seconds
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [timeToNextAnalysis, setTimeToNextAnalysis] = useState<number>(analysisInterval);
  
  const analysisTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
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
    setIsAnalyzing(false);
    setTimeToNextAnalysis(analysisInterval);
  };
  
  const performAnalysis = async () => {
    try {
      if (!iframeRef.current) return;
      
      // Capture a frame from the iframe
      const frameData = await captureFrameFromIframe(iframeRef.current);
      if (!frameData) {
        console.error("Failed to capture frame");
        return;
      }
      
      // Analyze the frame
      const result = await analyzeLivestreamFrame(frameData);
      
      // Update state with new result
      setLatestResult(result);
      setAnalysisResults(prev => {
        // Keep only the last 20 results
        const newResults = [...prev, result];
        if (newResults.length > 20) {
          return newResults.slice(newResults.length - 20);
        }
        return newResults;
      });
      
      // Update last analysis time
      const now = new Date();
      setLastAnalysisTime(now);
      setTimeToNextAnalysis(analysisInterval);
      
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed. Retrying...");
    }
  };
  
  // Calculate averages from the collected data
  const averageFlowVelocity = analysisResults.length > 0
    ? analysisResults.reduce((sum, result) => sum + result.flowVelocity, 0) / analysisResults.length
    : 0;
    
  const totalTrashDetected = analysisResults.reduce((sum, result) => sum + result.trashCount, 0);
  
  const allTrashCategories = analysisResults.reduce((categories, result) => {
    result.trashCategories.forEach(category => categories.add(category));
    return categories;
  }, new Set<string>());

  const recentResults = analysisResults.slice(-5).reverse();

  return (
    <div className="space-y-4">
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
            disabled={!isStreamActive}
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
      
      {isAnalyzing && isStreamActive && (
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="text-blue-500 dark:text-blue-400 w-4 h-4 mr-2" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Real-time analysis in progress
            </p>
          </div>
          <div className="text-sm font-medium">
            Next analysis in {timeToNextAnalysis}s
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
                
                {isAnalyzing && recentResults.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md">
                    <div className="text-xs font-medium mb-2">Recent Measurements</div>
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
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {new Date(latestResult.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="text-xs text-muted-foreground">
          Analyzing stream every {analysisInterval} seconds. Results may be simulated for demo purposes.
        </div>
      )}
    </div>
  );
};

export default LivestreamAnalysisPanel;
