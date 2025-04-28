
import { ImageData } from "canvas";

export interface AnalysisResult {
  averageDepth: number;
  maxDepth: number;
  depthProfile: number[];
  averageVelocity: number;
  flowMagnitude: number;
  trashCount: number;
  trashCategories?: string[];
  environmentalImpact?: string;
  frames: ImageData[];
}
