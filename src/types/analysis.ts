
// Import ImageData from a web compatible type
export interface AnalysisResult {
  averageVelocity: number;
  flowMagnitude: number;
  trashCount: number;
  trashCategories: string[];
  environmentalImpact: string;
  frames: ImageData[];
  trashDetectionImages: string[];
  flowVectors: Array<{velocities: number[], directions: number[]}>;
  videoUrl?: string; // URL to the processed video
}
