
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

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
  trashDetectionImages?: string[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, trashDetections = [], trashDetectionImages = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [visibleTrashCount, setVisibleTrashCount] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  
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

  const toggleGallery = () => {
    setShowGallery(!showGallery);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Video Analysis</span>
          {trashDetectionImages && trashDetectionImages.length > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={toggleGallery}
            >
              <Images className="h-4 w-4" />
              <span>{showGallery ? 'Hide Images' : 'View Images'}</span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        
        {/* Detection Summary */}
        {visibleTrashCount > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
            <p className="text-amber-800 font-medium">
              Currently showing: {visibleTrashCount} trash item{visibleTrashCount !== 1 ? 's' : ''} detected
            </p>
          </div>
        )}
        
        {/* Gallery Section */}
        {showGallery && trashDetectionImages && trashDetectionImages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3">Analysis Images Gallery</h3>
            
            <Carousel className="w-full">
              <CarouselContent>
                {trashDetectionImages.map((image, index) => (
                  <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <div className="overflow-hidden rounded-md bg-background">
                        <div className="aspect-video relative group">
                          <img 
                            src={image} 
                            alt={`Detection frame ${index + 1}`} 
                            className="object-cover w-full h-full transition-all duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <span className="text-white text-sm font-medium">Frame {index + 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center mt-2">
                <CarouselPrevious className="relative inset-auto transform-none mr-2" />
                <CarouselNext className="relative inset-auto transform-none" />
              </div>
            </Carousel>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Images showing detected trash items from video analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
