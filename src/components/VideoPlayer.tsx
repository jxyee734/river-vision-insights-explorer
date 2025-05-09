
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Trash, Layers, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  flowVectors?: Array<{velocities: number[], directions: number[]}>;
  depthProfile?: number[];
  averageDepth?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  trashDetections = [],
  flowVectors = [],
  depthProfile = [],
  averageDepth = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameInfoRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [visibleTrashCount, setVisibleTrashCount] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showFrameInfo, setShowFrameInfo] = useState(true);
  
  // Store trash locations for heatmap
  const trashLocations = useRef<Array<{x: number, y: number, weight: number}>>([]);

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
    // Generate heatmap data from all trash detections
    if (trashDetections && trashDetections.length > 0) {
      const locations: Array<{x: number, y: number, weight: number}> = [];
      
      trashDetections.forEach(detection => {
        detection.detections.forEach(item => {
          locations.push({
            x: item.x,
            y: item.y,
            weight: item.confidence // Use confidence as weight
          });
        });
      });
      
      trashLocations.current = locations;
    }
  }, [trashDetections]);

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
      
      if (!showBoundingBoxes) {
        setVisibleTrashCount(0);
        return;
      }
      
      // Find the closest timestamp
      const currentDetections = findNearestDetections(currentTime);
      
      if (currentDetections?.detections.length) {
        // Draw bounding boxes for current detections
        drawBoundingBoxes(ctx, currentDetections.detections, video.clientWidth, video.clientHeight);
        // Update trash count
        setVisibleTrashCount(currentDetections.detections.length);
        
        // Update frame info
        if (showFrameInfo && frameInfoRef.current) {
          updateFrameInfo(currentTime, currentDetections.detections, 
                        findNearestFlowVector(currentTime));
        }
      } else {
        setVisibleTrashCount(0);
        
        // Update frame info with just flow data
        if (showFrameInfo && frameInfoRef.current) {
          updateFrameInfo(currentTime, [], findNearestFlowVector(currentTime));
        }
      }
    };

    const drawHeatmap = () => {
      const canvas = heatmapCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !showHeatmap) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      
      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw heatmap
      if (trashLocations.current.length > 0) {
        // Create gradient for heatmap
        const locations = trashLocations.current;
        
        // Create a new off-screen canvas for the heat data
        const heatCanvas = document.createElement('canvas');
        heatCanvas.width = canvas.width;
        heatCanvas.height = canvas.height;
        const heatCtx = heatCanvas.getContext('2d');
        
        if (heatCtx) {
          // Set blend mode
          heatCtx.globalCompositeOperation = 'lighter';
          
          // Draw each point with a radial gradient
          locations.forEach(point => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            const radius = Math.max(30, canvas.width / 15); // Radius based on canvas size
            
            const gradient = heatCtx.createRadialGradient(x, y, 0, x, y, radius);
            const intensity = point.weight * 0.7; // Scale based on confidence
            
            gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`); 
            gradient.addColorStop(0.5, `rgba(255, 255, 0, ${intensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            heatCtx.fillStyle = gradient;
            heatCtx.beginPath();
            heatCtx.arc(x, y, radius, 0, Math.PI * 2);
            heatCtx.fill();
          });
          
          // Apply the heatmap to the main canvas with transparency
          ctx.globalAlpha = 0.6;
          ctx.drawImage(heatCanvas, 0, 0);
          ctx.globalAlpha = 1.0;
        }
      }
    };

    const findNearestDetections = (time: number) => {
      // Find the detection data for the closest timestamp
      return trashDetections.reduce((closest, current) => {
        if (!closest) return current;
        return Math.abs(current.timestamp - time) < Math.abs(closest.timestamp - time) ? current : closest;
      }, null as any);
    };
    
    const findNearestFlowVector = (time: number) => {
      if (!flowVectors || flowVectors.length === 0) return null;
      
      // Estimate the frame index based on time and total video duration
      const videoElement = videoRef.current;
      if (!videoElement) return null;
      
      const frameIndex = Math.min(
        Math.floor((time / videoElement.duration) * flowVectors.length),
        flowVectors.length - 1
      );
      
      return flowVectors[Math.max(0, frameIndex)];
    };
    
    const updateFrameInfo = (
      time: number, 
      detections: any[], 
      flowVector: {velocities: number[], directions: number[]} | null
    ) => {
      if (!frameInfoRef.current) return;
      
      // Calculate average flow velocity if we have flow data
      let avgVelocity = 0;
      let flowMagnitude = 0;
      
      if (flowVector) {
        avgVelocity = flowVector.velocities.reduce((sum, v) => sum + v, 0) / 
                     Math.max(1, flowVector.velocities.length);
        flowMagnitude = avgVelocity * 2; // Simplified calculation
      }
      
      // Calculate depth estimate for the current frame
      let depthEstimate = 0;
      if (flowVector && flowVector.velocities.length > 0) {
        const frameIndex = Math.min(
          Math.floor((time / (videoRef.current?.duration || 1)) * flowVectors.length),
          flowVectors.length - 1
        );
        
        // Use the corresponding depth profile if available
        if (depthProfile && depthProfile.length > 0) {
          depthEstimate = averageDepth || 0;
        }
      }
      
      // Build frame info HTML
      const frameNumber = Math.floor(time * 30); // Assuming 30fps
      
      // Create trash detection list
      const trashList = detections.length > 0 
        ? detections.reduce((acc: {[key: string]: number}, det) => {
            acc[det.class] = (acc[det.class] || 0) + 1;
            return acc;
          }, {})
        : {};
      
      const trashListHTML = Object.entries(trashList).map(([type, count]) => 
        `<div class="flex justify-between">
          <span>${type}</span>
          <span class="font-medium">×${count}</span>
         </div>`
      ).join('');
      
      // Format information display
      frameInfoRef.current.innerHTML = `
        <div class="p-2 text-xs bg-black/70 text-white rounded">
          <div class="font-medium border-b border-white/20 pb-1 mb-1">FRAME ${frameNumber} @ ${time.toFixed(2)}s</div>
          
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Flow Magnitude:</div>
            <div class="font-medium">${flowMagnitude.toFixed(2)} m/s</div>
            
            <div>Flow Velocity:</div>
            <div class="font-medium">${avgVelocity.toFixed(2)} m/s</div>
            
            <div>Depth Estimate:</div>
            <div class="font-medium">${depthEstimate.toFixed(2)} m</div>
          </div>
          
          ${detections.length > 0 ? `
            <div class="mt-2 border-t border-white/20 pt-1">
              <div class="font-medium mb-1">Trash Detected (${detections.length}):</div>
              <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                ${trashListHTML}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    };

    const drawBoundingBoxes = (
      ctx: CanvasRenderingContext2D, 
      detections: Array<any>, 
      canvasWidth: number, 
      canvasHeight: number
    ) => {
      // Style for the bounding boxes - enhanced visibility
      ctx.lineWidth = 4;
      ctx.font = 'bold 16px Arial';
      
      detections.forEach(detection => {
        // Convert normalized coordinates to canvas coordinates
        const x = detection.x * canvasWidth - (detection.width * canvasWidth) / 2;
        const y = detection.y * canvasHeight - (detection.height * canvasHeight) / 2;
        const width = detection.width * canvasWidth;
        const height = detection.height * canvasHeight;
        
        // Use different colors based on confidence level
        const confidence = detection.confidence;
        let boxColor = 'rgba(255, 0, 0, 0.9)'; // Default red
        
        if (confidence > 0.85) {
          boxColor = 'rgba(255, 0, 0, 0.9)'; // High confidence: red
        } else if (confidence > 0.7) {
          boxColor = 'rgba(255, 165, 0, 0.9)'; // Medium confidence: orange
        } else {
          boxColor = 'rgba(255, 255, 0, 0.9)'; // Low confidence: yellow
        }
        
        // Draw box with thicker stroke
        ctx.strokeStyle = boxColor;
        ctx.strokeRect(x, y, width, height);
        
        // Draw semi-transparent box fill
        ctx.fillStyle = boxColor.replace('0.9', '0.2');
        ctx.fillRect(x, y, width, height);
        
        // Draw the label with contrast background
        const label = `${detection.class} ${Math.round(detection.confidence * 100)}%`;
        const textWidth = ctx.measureText(label).width + 10;
        
        // Label background
        ctx.fillStyle = boxColor;
        ctx.fillRect(x, y - 25, textWidth, 20);
        
        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 5, y - 10);
      });
    };

    // Draw both visualizations
    drawDetections();
    drawHeatmap();

    // Setup animation frame to update canvas
    let animationFrameId: number;
    const animate = () => {
      drawDetections();
      drawHeatmap();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      drawDetections();
      drawHeatmap();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentTime, isPlaying, trashDetections, showHeatmap, showBoundingBoxes, showFrameInfo, flowVectors, depthProfile, averageDepth]);

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
          <canvas
            ref={heatmapCanvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
          
          {/* Frame information overlay */}
          <div 
            ref={frameInfoRef}
            className={`absolute top-4 left-4 transition-opacity ${showFrameInfo ? 'opacity-100' : 'opacity-0'}`}
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
        
        <div className="mt-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-bounding-boxes" 
              checked={showBoundingBoxes} 
              onCheckedChange={setShowBoundingBoxes}
            />
            <Label htmlFor="show-bounding-boxes">Show Bounding Boxes</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-heatmap" 
              checked={showHeatmap} 
              onCheckedChange={setShowHeatmap}
            />
            <Label htmlFor="show-heatmap">Show Heatmap</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-frame-info" 
              checked={showFrameInfo} 
              onCheckedChange={setShowFrameInfo}
            />
            <Label htmlFor="show-frame-info">Show Frame Data</Label>
          </div>
          
          <div className="text-sm text-gray-600 w-full mt-2">
            <p>Video showing water flow patterns and detected trash items with enhanced visualizations. 
               Frame data includes flow metrics and depth estimates.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
