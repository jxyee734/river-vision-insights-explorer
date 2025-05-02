import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, BarChart2, Trash2, Activity, AlertCircle } from 'lucide-react';
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
  
  const analysisTimerRef = useRef<number | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
      }
    };
  }, []);
  
  // Reset analysis when stream changes
  useEffect(() => {
    stopAnalysis();
    setAnalysisResults([]);
    setLatestResult(null);
  }, [streamName]);
  
  const startAnalysis = async () => {
    if (!isStreamActive || !iframeRef.current) {
      toast.error("Cannot analyze: stream is not active");
      return;
    }
    
    setIsAnalyzing(true);
    toast.info("Starting livestream analysis...");
    
    // Perform initial analysis immediately
    performAnalysis();
    
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
    setIsAnalyzing(false);
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
