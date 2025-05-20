
// Import ImageData from a web compatible type
export interface AnalysisResult {
  averageVelocity: number;
  flowMagnitude: number;
  trashCount: number;
  trashCategories: string[];
  environmentalImpact: string;
  frames: ImageData[];
  trashDetectionImages: string[]; // We'll keep this for backward compatibility
  flowVectors: Array<{velocities: number[], directions: number[]}>;  
  processedVideoUrl?: string; // URL for the processed video with annotations
  downloadUrl?: string; // URL for downloading the processed video
  videoUrl?: string; // URL to the processed video
  trashDetections?: Array<{
    timestamp: number;
    detections: Array<{
      class: string;
      confidence: number;
      x: number; // normalized coordinates (0-1)
      y: number; // normalized coordinates (0-1)
      width: number; // normalized width (0-1)
      height: number; // normalized height (0-1)
    }>;
  }>;
  
  // Depth analysis fields
  depthProfile?: number[];
  averageDepth?: number;
  maxDepth?: number;
  pollutionData?: any; // Add this property to fix the error
  riverCategory?: {
    state: string;
    river: string;
  };
}
