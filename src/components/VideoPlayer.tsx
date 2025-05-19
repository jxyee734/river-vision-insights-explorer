import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [visibleTrashCount, setVisibleTrashCount] = useState(0);

  // Log props for debugging
  useEffect(() => {
    console.log('VideoPlayer props:', {
      videoUrl,
      trashDetectionsLength: trashDetections.length,
      trashDetectionImagesLength: trashDetectionImages.length,
      trashDetectionsSample: trashDetections.slice(0, 2),
    });
  }, [videoUrl, trashDetections, trashDetectionImages]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => console.error('Play error:', err));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Update current time
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

  // Draw detections on canvas
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || trashDetections.length === 0) {
      setVisibleTrashCount(0);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    // Find nearest detections within a time window
    const timeWindow = 0.5; // Match detections within 0.5 seconds
    const currentDetections = trashDetections.find(
      detection => Math.abs(detection.timestamp - currentTime) <= timeWindow
    );

    console.log('Current time:', currentTime, 'Detections:', currentDetections);

    if (currentDetections?.detections.length) {
      setVisibleTrashCount(currentDetections.detections.length);

      const ctx = canvasRef.current.getContext('2d');
      if (ctx && videoRef.current.videoWidth && videoRef.current.videoHeight) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        currentDetections.detections.forEach(detection => {
          const x = detection.x - detection.width / 2;
          const y = detection.y - detection.height / 2;

          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, detection.width, detection.height);

          ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
          ctx.fillRect(x, y, detection.width, detection.height);

          const label = `${detection.class} ${Math.round(detection.confidence * 100)}%`;
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.fillRect(x, y - 25, ctx.measureText(label).width + 10, 22);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, x + 5, y - 10);
        });
      }
    } else {
      setVisibleTrashCount(0);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
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
        <CardTitle className="text-lg">
          <span>Video Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            src={videoUrl}
            playsInline
            onLoadedMetadata={() => console.log('Video metadata loaded:', videoRef.current?.videoWidth, videoRef.current?.videoHeight)}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
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

        {visibleTrashCount > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
            <p className="text-amber-800 font-medium">
              Currently showing: {visibleTrashCount} trash item{visibleTrashCount !== 1 ? 's' : ''} detected
            </p>
          </div>
        )}

        {trashDetectionImages.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3">Analyzed Video Frames</h3>
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
                            onError={() => console.error(`Failed to load image ${index + 1}`)}
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
        ) : (
          <p className="text-sm text-gray-500 mt-4">No analyzed frames available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;