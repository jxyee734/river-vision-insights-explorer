
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Trash } from 'lucide-react';
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
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
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
    if (!overlayCanvasRef.current || !videoRef.current || trashDetections.length === 0) return;

    const drawDetections = () => {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      
      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Find the closest timestamp
      const currentDetections = findNearestDetections(currentTime);
      
      if (currentDetections?.detections.length) {
        // Draw bounding boxes for current detections
        drawBoundingBoxes(ctx, currentDetections.detections, video.clientWidth, video.clientHeight);
        // Update trash count
        setVisibleTrashCount(currentDetections.detections.length);
      } else {
        setVisibleTrashCount(0);
      }
    };

    const findNearestDetections = (time: number) => {
      // Find the detection data for the closest timestamp
      return trashDetections.reduce((closest, current) => {
        if (!closest) return current;
        return Math.abs(current.timestamp - time) < Math.abs(closest.timestamp - time) ? current : closest;
      }, null as any);
    };

    const drawBoundingBoxes = (
      ctx: CanvasRenderingContext2D, 
      detections: Array<any>, 
      canvasWidth: number, 
      canvasHeight: number
    ) => {
      // Style for the bounding boxes
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.font = '16px Arial';
      
      detections.forEach(detection => {
        // Convert normalized coordinates to canvas coordinates
        const x = detection.x * canvasWidth - (detection.width * canvasWidth) / 2;
        const y = detection.y * canvasHeight - (detection.height * canvasHeight) / 2;
        const width = detection.width * canvasWidth;
        const height = detection.height * canvasHeight;
        
        // Draw the box
        ctx.strokeRect(x, y, width, height);
        
        // Draw the label
        const label = `${detection.class} ${Math.round(detection.confidence * 100)}%`;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.fillRect(x, y - 25, ctx.measureText(label).width + 10, 20);
        ctx.fillStyle = '#000';
        ctx.fillText(label, x + 5, y - 10);
      });
    };

    drawDetections();

    // Setup animation frame to update canvas
    let animationFrameId: number;
    const animate = () => {
      drawDetections();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      drawDetections(); // Make sure to draw even when paused
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentTime, isPlaying, trashDetections]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Video Analysis</span>
          <div className="flex items-center text-sm font-normal bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <Trash className="h-4 w-4 mr-1" />
            <span>Detected: {visibleTrashCount}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          <video 
            ref={videoRef}
            className="w-full h-full"
            src={videoUrl}
            playsInline
          />
          <canvas
            ref={overlayCanvasRef}
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
        <div className="mt-4 text-sm text-gray-600">
          <p>Video showing water flow patterns and detected trash items in real-time.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
