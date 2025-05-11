
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  videoUrl: string;
  trashDetections?: {
    timestamp: number;
    detections: Array<{
      class: string;
      confidence: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  }[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, trashDetections = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [visibleTrashCount, setVisibleTrashCount] = useState(0);
  
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateTime = () => {
      setCurrentTime(videoElement.currentTime);
    };

    videoElement.addEventListener('timeupdate', updateTime);

    return () => {
      videoElement.removeEventListener('timeupdate', updateTime);
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || trashDetections.length === 0) return;

    // Find the closest timestamp
    const findNearestDetections = (time: number) => {
      // Find the detection data for the closest timestamp
      return trashDetections.reduce((closest, current) => {
        if (!closest) return current;
        return Math.abs(current.timestamp - time) < Math.abs(closest.timestamp - time) ? current : closest;
      }, null as any);
    };

    const currentDetections = findNearestDetections(currentTime);
    
    if (currentDetections?.detections.length) {
      // Update trash count
      setVisibleTrashCount(currentDetections.detections.length);
    } else {
      setVisibleTrashCount(0);
    }
  }, [currentTime, trashDetections]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Video Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          <video 
            ref={videoRef}
            className="w-full h-full"
            src={videoUrl}
            playsInline
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
