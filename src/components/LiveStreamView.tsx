import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NasaCard } from './NasaCard';
import { Waves, Camera, Play, CameraOff } from 'lucide-react';
import { toast } from 'sonner';

// Updated stream sources with more reliable working URLs
const SAMPLE_STREAMS = [
  { 
    id: 'stream1', 
    name: 'NASA Live Stream', 
    url: 'https://manifest.googlevideo.com/api/manifest/hls_variant/expire/1714776095/ei/z2dOZZDsIOLGx_APwI-p-AQ/ip/35.230.176.92/id/21X5lGlDOfg.4/source/yt_live_broadcast/requiressl/yes/xpc/EgVo2aDSNQ%3D%3D/hfr/1/playlist_duration/30/manifest_duration/30/maxh/4320/maudio/1/siu/1/spc/UWF9fwl4n7UDDSjLLK1CUcTmkLI2ZTpccbICxCCuCB59aP8AaIDIMREm5lg4oc3C/vprv/1/go/1/pacing/0/nvgoi/1/keepalive/yes/fexp/51141543/dover/11/itag/0/playlist_type/DVR/sparams/expire%2Cei%2Cip%2Cid%2Csource%2Crequiressl%2Cxpc%2Chfr%2Cplaylist_duration%2Cmanifest_duration%2Cmaxh%2Cmaudio%2Csiu%2Cspc%2Cvprv%2Cgo%2Citag%2Cplaylist_type/sig/AJfQdSswRAIgG0MghamDVqIEImUfPqBUty5JSfKwwdQh7uDqUaDImUsCIGcOV1nTkDp9fFOB7usGlfMO-eGTqFT1f2NQY0yumhKp/file/index.m3u8',
    location: { lat: 38.8977, lng: -77.0365 },
    description: "NASA Live: Official Stream of NASA TV"
  },
  { 
    id: 'stream2', 
    name: 'CNBC Live', 
    url: 'https://manifest.googlevideo.com/api/manifest/hls_variant/expire/1714776146/ei/AmhOZYvvNuukx_APgJiy6A4/ip/35.230.176.92/id/9NyxcX3rhQs.2/source/yt_live_broadcast/requiressl/yes/xpc/EgVo2aDSNQ%3D%3D/tx/24788115/txs/24788114%2C24788115%2C24788116%2C24788117%2C24788118%2C24788119%2C24788120/hfr/1/playlist_duration/30/manifest_duration/30/maxh/4320/maudio/1/siu/1/spc/UWF9f-KmLERzjBuvvu2cv0nB0E50VO-8KwkVmH_eJjP1sbxs3bEtvvaAB-w/vprv/1/go/1/pacing/0/nvgoi/1/keepalive/yes/fexp/51141542/dover/11/itag/0/playlist_type/DVR/sparams/expire%2Cei%2Cip%2Cid%2Csource%2Crequiressl%2Cxpc%2Ctx%2Ctxs%2Chfr%2Cplaylist_duration%2Cmanifest_duration%2Cmaxh%2Cmaudio%2Csiu%2Cspc%2Cvprv%2Cgo%2Citag%2Cplaylist_type/sig/AJfQdSswRgIhAJYmQZiQZBWuqFufgyLfI9-sJWmEfR_xVqFbmQWBomQDAiEAvfurgjtQWQiRvzXu48wl73DLQd9RGPtkisD4BSWijSQ%3D/file/index.m3u8',
    location: { lat: 40.7128, lng: -74.0060 },
    description: "CNBC Live: Latest market and business news"
  },
  { 
    id: 'stream3', 
    name: 'Earth from Space (ISS)', 
    url: 'https://manifest.googlevideo.com/api/manifest/hls_variant/expire/1714776243/ei/Y2hOZfCEGa2oobIPsYaOiAY/ip/35.230.176.92/id/86YLFOog4GM.3/source/yt_live_broadcast/requiressl/yes/xpc/EgVo2aDSNQ%3D%3D/hfr/1/playlist_duration/30/manifest_duration/30/maxh/4320/maudio/1/siu/1/spc/UWF9f25oyhRa0XpHHYgyI7GRwZ0YE4sbreNnmggse46AhzNUwwy2MoC7C2c/vprv/1/go/1/pacing/0/nvgoi/1/keepalive/yes/fexp/51141541/dover/11/itag/0/playlist_type/DVR/sparams/expire%2Cei%2Cip%2Cid%2Csource%2Crequiressl%2Cxpc%2Chfr%2Cplaylist_duration%2Cmanifest_duration%2Cmaxh%2Cmaudio%2Csiu%2Cspc%2Cvprv%2Cgo%2Citag%2Cplaylist_type/sig/AJfQdSswRAIgQvk2Zzq785OdJsyJ6nj5MvVQuqwnF_fPmAoQaTbDvnsCIB3p66-wBb-Hde2KfWH1N7IvPNAE7gJtPJZUBCwP0F5D/file/index.m3u8',
    location: { lat: 0, lng: 0 },
    description: "Live views of Earth from the International Space Station"
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
  const hls = useRef<any>(null);
  const retryTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Clean up HLS instance and timeouts when component unmounts
    return () => {
      if (hls.current) {
        hls.current.destroy();
        hls.current = null;
      }
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
      // Clean up any previous HLS instance
      if (hls.current) {
        hls.current.destroy();
        hls.current = null;
      }
      
      // Clear any retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Dynamically import HLS.js only when needed
      const { default: Hls } = await import('hls.js');
      
      // Check if HLS is supported in the browser
      if (Hls.isSupported() && videoRef.current) {
        // Create new HLS instance with optimized configurations
        hls.current = new Hls({
          maxBufferLength: 30,
          maxBufferSize: 60 * 1000 * 1000, // 60 MB
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          progressive: true,
          lowLatencyMode: false, // Set to true for lower latency if needed
        });
        
        // Bind HLS to video element
        hls.current.attachMedia(videoRef.current);
        hls.current.loadSource(stream.url);
        
        hls.current.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setIsPlaying(true);
          setErrorCount(0);
          if (videoRef.current) {
            videoRef.current.play().catch(e => {
              console.error("Error playing video:", e);
              handlePlaybackError();
            });
          }
        });
        
        // Enhanced error handling
        hls.current.on(Hls.Events.ERROR, (_event: any, data: any) => {
          console.log("Stream error detected:", data.type);
          
          if (data.fatal) {
            setErrorCount(prev => prev + 1);
            
            if (errorCount >= 2) {
              console.error("Fatal HLS error after multiple retries:", data);
              setStreamError(true);
              setIsPlaying(false);
              toast.error("Stream currently unavailable. Please try another stream.");
              hls.current.destroy();
              hls.current = null;
            } else {
              // Non-fatal or first error, attempt recovery
              console.log("Attempting to recover from HLS error");
              
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  // Try to recover network error
                  toast.warning("Stream connection issue. Attempting to reconnect...");
                  retryTimeoutRef.current = setTimeout(() => {
                    if (hls.current) {
                      hls.current.startLoad();
                    }
                  }, 3000);
                  break;
                  
                case Hls.ErrorTypes.MEDIA_ERROR:
                  // Try to recover media error
                  toast.warning("Stream media error. Attempting to recover...");
                  if (hls.current) {
                    hls.current.recoverMediaError();
                  }
                  break;
                  
                default:
                  // For other errors, destroy and recreate
                  if (hls.current) {
                    hls.current.destroy();
                    hls.current = null;
                  }
                  retryTimeoutRef.current = setTimeout(() => {
                    loadStream(streamId);
                  }, 3000);
                  break;
              }
            }
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
            handlePlaybackError();
          });
        });
        
        videoRef.current.addEventListener('error', (e) => {
          console.error("Video element error:", e);
          handlePlaybackError();
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
  
  const handlePlaybackError = () => {
    setErrorCount(prev => prev + 1);
    if (errorCount >= 2) {
      setStreamError(true);
      setIsPlaying(false);
      toast.error("Stream error. Please try another stream.");
    } else {
      toast.warning("Playback issue. Attempting to reconnect...");
      // Try a simple reload
      if (videoRef.current && videoRef.current.src) {
        videoRef.current.load();
        videoRef.current.play().catch(e => {
          console.error("Error on retry:", e);
          setStreamError(true);
          setIsPlaying(false);
        });
      }
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
        <NasaCard 
          title={SAMPLE_STREAMS.find(s => s.id === selectedStream)?.name || "River Stream"} 
          description={SAMPLE_STREAMS.find(s => s.id === selectedStream)?.description || "Live video feed"}
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
            
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              controls={isPlaying && !streamError}
              muted // Muting to help with autoplay
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
