
// Import ImageData from a web compatible type
export interface AnalysisResult {
  averageDepth: number;
  maxDepth: number;
  depthProfile: number[];
  averageVelocity: number;
  flowMagnitude: number;
  trashCount: number;
  trashCategories: string[]; // Changed from optional to required
  environmentalImpact: string; // Changed from optional to required
  frames: ImageData[];
  trashDetectionImages: string[]; // Changed from optional to required - Base64 encoded images where trash was detected
  
  // Water quality parameters
  phValue?: number;
  bodLevel?: number;
  ammoniacalNitrogen?: number;
  suspendedSolids?: number;
}
