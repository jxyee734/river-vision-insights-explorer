
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NasaCard } from './NasaCard';
import { Wave, Camera, Play, CameraOff } from 'lucide-react';
import { toast } from 'sonner';

// Sample river streams data - in a real app, this would come from an API
const SAMPLE_STREAMS = [
  { 
    id: 'stream1', 
    name: 'Mississippi River - St. Louis', 
    url: 'https://58767bb9dc97c.streamlock.net/live/Lewis.stream/playlist.m3u8',
    location: { lat: 38.6270, lng: -90.1994 }
  },
  { 
    id: 'stream2', 
    name: 'Columbia River - Washington', 
    url: 'https://5c2dd06edc0e8.streamlock.net/live/mp4:columbiariver_trunnion.stream/playlist.m3u8',
    location: { lat: 45.7060, lng: -121.7980 }
  },
  { 
    id: 'stream3', 
    name: 'Hudson River - New York', 
    url: 'https://cdn-naka17.livextend.live/prod_hls/10251/10251.m3u8',
    location: { lat: 40.7128, lng: -74.0060 }
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hls = useRef<any>(null);

  useEffect(() => {
    // Clean up HLS instance when component unmounts
    return () => {
      if (hls.current) {
        hls.current.destroy();
        hls.current = null;
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
      // Dynamically import HLS.js only when needed
      const { default: Hls } = await import('hls.js');
      
      // Check if HLS is supported in the browser
      if (Hls.isSupported() && videoRef.current) {
        // Create new HLS instance
        if (hls.current) {
          hls.current.destroy();
        }
        
        hls.current = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        
        // Bind HLS to video element
        hls.current.attachMedia(videoRef.current);
        hls.current.loadSource(stream.url);
        
        hls.current.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setIsPlaying(true);
          if (videoRef.current) {
            videoRef.current.play().catch(e => {
              console.error("Error playing video:", e);
              setStreamError(true);
              toast.error("Could not start video playback. Please try again.");
            });
          }
        });
        
        hls.current.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            setStreamError(true);
            setIsPlaying(false);
            toast.error("Stream error. Please try another stream.");
            console.error("HLS error:", data);
            hls.current.destroy();
          }
        });
        
        // Notify parent component of location change if callback provided
        if (onLocationSelected && stream.location) {
          onLocationSelected(stream.location.lat, stream.location.lng, stream.name);
        }
      } else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // For browsers that support HLS natively (Safari)
        videoRef.current.src = stream.url;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          setIsPlaying(true);
          videoRef.current?.play().catch(e => {
            console.error("Error playing video:", e);
            setStreamError(true);
          });
        });
        
        videoRef.current.addEventListener('error', () => {
          setStreamError(true);
          setIsPlaying(false);
          toast.error("Stream error. Please try another stream.");
        });
        
        // Notify parent component of location change if callback provided
        if (onLocationSelected && stream.location) {
          onLocationSelected(stream.location.lat, stream.location.lng, stream.name);
        }
      } else {
        setStreamError(true);
        toast.error("Your browser doesn't support HLS streams");
      }
    } catch (error) {
      console.error("Error loading HLS.js:", error);
      setStreamError(true);
      setIsLoading(false);
      toast.error("Failed to load video player");
    }
  };

  const handleStreamChange = (streamId: string) => {
    setSelectedStream(streamId);
    loadStream(streamId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wave className="h-5 w-5 text-primary" />
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
        <NasaCard 
          title={SAMPLE_STREAMS.find(s => s.id === selectedStream)?.name || "River Stream"} 
          description="Live video feed"
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
              </div>
            )}
            
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              controls={isPlaying && !streamError}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-white text-sm">
                  {isPlaying ? 'Live' : 'Stream Not Active'}
                </span>
              </div>
              <div className="text-xs text-gray-300">
                {isPlaying && "Real-time water flow monitoring"}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            <p>These live streams provide real-time monitoring of river conditions. The video feeds may be temporarily unavailable due to weather conditions or maintenance.</p>
          </div>
        </NasaCard>
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
