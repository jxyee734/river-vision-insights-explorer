
// Import ImageData from a web compatible type
export interface AnalysisResult {
  averageVelocity: number;
  flowMagnitude: number;
  trashCount: number;
  trashCategories: string[];
  environmentalImpact: string;
  frames: ImageData[];
  trashDetectionImages: string[]; // Base64 encoded images where trash was detected
}
