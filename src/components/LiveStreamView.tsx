
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NasaCard } from './NasaCard';
import { Waves, Camera, Play, CameraOff } from 'lucide-react';
import { toast } from 'sonner';
import LivestreamAnalysisPanel from './LivestreamAnalysisPanel';

// Updated stream sources with YouTube embeds provided by the user
const SAMPLE_STREAMS = [
  { 
    id: 'stream1', 
    name: 'River Live Stream 1', 
    url: 'https://www.youtube.com/embed/4YFHDjig1hc?si=Xz88oTLHsgCpv40X',
    location: { lat: 40.7128, lng: -74.0060 },
    description: "Live stream of flowing river with natural surroundings"
  },
  { 
    id: 'stream2', 
    name: 'River Live Stream 2', 
    url: 'https://www.youtube.com/embed/WUqQdNAUC1c?si=EDwKcF_AmppSv21x',
    location: { lat: 35.6895, lng: 139.6917 },
    description: "Live monitoring of mountain river flow"
  },
  { 
    id: 'stream3', 
    name: 'River Live Stream 3', 
    url: 'https://www.youtube.com/embed/euzaT88tzOM?si=wz_gxzsv5ffk9B08',
    location: { lat: 51.5074, lng: -0.1278 },
    description: "River monitoring in forest environment"
  },
  { 
    id: 'stream4', 
    name: 'River Live Stream 4', 
    url: 'https://www.youtube.com/embed/M8_wWiCs8CM?si=ttBwIqZvHn70YxBd',
    location: { lat: 48.8566, lng: 2.3522 },
    description: "Live monitoring of waterfall and surrounding environment"
  }
];

interface LiveStreamViewProps {
  onLocationSelected?: (lat: number, lng: number, name: string) => void;
}

const LiveStreamView: React.FC<LiveStreamViewProps> = ({ onLocationSelected }) => {
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [errorCount, setErrorCount] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const retryTimeoutRef = useRef<any>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState<boolean>(false);

  useEffect(() => {
    // Clean up timeouts when component unmounts
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const loadStream = async (streamId: string) => {
    setIsLoading(true);
    setStreamError(false);
    
    const stream = SAMPLE_STREAMS.find(s => s.id === streamId);
    if (!stream) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Clear any retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      setTimeout(() => {
        setIsLoading(false);
        setIsPlaying(true);
        setErrorCount(0);
        
        // Notify parent component of location change if callback provided
        if (onLocationSelected && stream.location) {
          onLocationSelected(stream.location.lat, stream.location.lng, stream.name);
        }
      }, 1500);
      
    } catch (error) {
      console.error("Error loading stream:", error);
      setStreamError(true);
      setIsLoading(false);
      toast.error("Failed to load video stream");
    }
  };
  
  const handlePlaybackError = () => {
    setErrorCount(prev => prev + 1);
    if (errorCount >= 2) {
      setStreamError(true);
      setIsPlaying(false);
      toast.error("Stream error. Please try another stream.");
    } else {
      toast.warning("Playback issue. Attempting to reconnect...");
      // Try a reload
      retryTimeoutRef.current = setTimeout(() => {
        loadStream(selectedStream);
      }, 3000);
    }
  };

  const handleStreamChange = (streamId: string) => {
    setSelectedStream(streamId);
    setShowAnalysisPanel(false); // Reset analysis panel when changing streams
    loadStream(streamId);
  };

  const toggleAnalysisPanel = () => {
    setShowAnalysisPanel(prev => !prev);
  };

  const currentStream = SAMPLE_STREAMS.find(s => s.id === selectedStream);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-medium">Live River Streams</h2>
        </div>
        
        <Select value={selectedStream} onValueChange={handleStreamChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a river stream" />
          </SelectTrigger>
          <SelectContent>
            {SAMPLE_STREAMS.map(stream => (
              <SelectItem key={stream.id} value={stream.id}>{stream.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedStream ? (
        <div className="space-y-4">
          <NasaCard 
            title={currentStream?.name || "River Stream"} 
            description={currentStream?.description || "Live video feed"}
            gradient
            glassmorphism
            className="w-full"
          >
            <div className="relative aspect-video bg-black/50 rounded-md overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
              
              {streamError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                  <CameraOff className="h-16 w-16 text-red-500 mb-4" />
                  <p className="text-white text-lg">Stream unavailable</p>
                  <p className="text-gray-400 text-sm mt-2">Please try another stream</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setErrorCount(0);
                      setStreamError(false);
                      loadStream(selectedStream);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {selectedStream && !streamError && (
                <iframe
                  ref={iframeRef}
                  className="w-full h-full"
                  src={currentStream?.url}
                  title={currentStream?.name || "Live Stream"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onError={handlePlaybackError}
                ></iframe>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isPlaying && !streamError ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-white text-sm">
                    {isPlaying && !streamError ? 'Live' : 'Stream Not Active'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-300">
                    {isPlaying && !streamError && "Real-time water flow monitoring"}
                  </div>
                  {isPlaying && !streamError && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs text-white bg-black/50 border-white/30 hover:bg-black/70"
                      onClick={toggleAnalysisPanel}
                    >
                      {showAnalysisPanel ? "Hide Analysis" : "Analyze Stream"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {isPlaying && !streamError && showAnalysisPanel && (
              <div className="mt-4 p-4 border border-border/30 rounded-lg bg-card/10">
                <LivestreamAnalysisPanel 
                  iframeRef={iframeRef}
                  isStreamActive={isPlaying && !streamError}
                  streamName={currentStream?.name || ""}
                />
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-400">
              <p>These live streams provide real-time monitoring of river conditions. The video feeds may be temporarily unavailable due to weather conditions or maintenance.</p>
            </div>
          </NasaCard>
        </div>
      ) : (
        <Card className="border border-border/50 bg-card/30">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">Select a Live Stream</CardTitle>
            <p className="text-muted-foreground mb-6">
              Choose a river stream from the dropdown above to view real-time footage
            </p>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                // Select the first stream as an example
                if (SAMPLE_STREAMS.length > 0) {
                  handleStreamChange(SAMPLE_STREAMS[0].id);
                }
              }}
            >
              <Play className="h-4 w-4" />
              <span>Try an Example Stream</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveStreamView;
