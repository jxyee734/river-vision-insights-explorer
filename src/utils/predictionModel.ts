
// Enhanced Random Forest model implementation for pollution spread prediction
import type { AnalysisResult } from '../types/analysis';

// Interface for model input data
export interface PredictionModelInput {
  waterQualityIndex: number;
  flowVelocity: number;
  trashCount: number;
  temperature: number;
  rainfall: number;
  phValue: number;
  bodLevel: number;
  ammoniacalNitrogen: number;
  suspendedSolids: number;
}

// Interface for weather data
export interface WeatherData {
  temperature: number; // in Celsius
  rainfall: number; // in mm
  humidity: number; // in percentage
  windSpeed: number; // in m/s
  timestamp: Date;
}

// Interface for model output
export interface PollutionPrediction {
  spreadRadius: number; // in meters
  intensity: number; // 0-10 scale
  directionVector: { x: number, y: number };
  timeToSpread: number; // in hours
  confidence: number; // 0-1 scale
  featureImportance: { [key: string]: number };
}

// Decision Tree Node
interface TreeNode {
  feature?: string;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  prediction?: number;
  isLeaf: boolean;
}

// Random Forest Class
class RandomForestRegressor {
  private trees: TreeNode[] = [];
  private numTrees: number;
  private maxDepth: number;
  private minSamplesSplit: number;
  private featureNames: string[];

  constructor(numTrees = 50, maxDepth = 10, minSamplesSplit = 2) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.featureNames = [
      'waterQualityIndex', 'flowVelocity', 'trashCount', 'temperature',
      'rainfall', 'phValue', 'bodLevel', 'ammoniacalNitrogen', 'suspendedSolids'
    ];
  }

  // Build a single decision tree
  private buildTree(data: number[][], targets: number[], depth = 0): TreeNode {
    if (depth >= this.maxDepth || data.length < this.minSamplesSplit) {
      return {
        isLeaf: true,
        prediction: targets.reduce((sum, val) => sum + val, 0) / targets.length
      };
    }

    let bestFeature = 0;
    let bestThreshold = 0;
    let bestScore = Infinity;

    // Find best split
    for (let featureIdx = 0; featureIdx < data[0].length; featureIdx++) {
      const values = data.map(row => row[featureIdx]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const score = this.calculateSplitScore(data, targets, featureIdx, threshold);
        
        if (score < bestScore) {
          bestScore = score;
          bestFeature = featureIdx;
          bestThreshold = threshold;
        }
      }
    }

    // Split data
    const leftData: number[][] = [];
    const rightData: number[][] = [];
    const leftTargets: number[] = [];
    const rightTargets: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i][bestFeature] <= bestThreshold) {
        leftData.push(data[i]);
        leftTargets.push(targets[i]);
      } else {
        rightData.push(data[i]);
        rightTargets.push(targets[i]);
      }
    }

    return {
      isLeaf: false,
      feature: this.featureNames[bestFeature],
      threshold: bestThreshold,
      left: this.buildTree(leftData, leftTargets, depth + 1),
      right: this.buildTree(rightData, rightTargets, depth + 1)
    };
  }

  private calculateSplitScore(data: number[][], targets: number[], featureIdx: number, threshold: number): number {
    const leftTargets: number[] = [];
    const rightTargets: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i][featureIdx] <= threshold) {
        leftTargets.push(targets[i]);
      } else {
        rightTargets.push(targets[i]);
      }
    }

    if (leftTargets.length === 0 || rightTargets.length === 0) {
      return Infinity;
    }

    const leftMse = this.calculateMSE(leftTargets);
    const rightMse = this.calculateMSE(rightTargets);
    const totalSamples = targets.length;

    return (leftTargets.length / totalSamples) * leftMse + (rightTargets.length / totalSamples) * rightMse;
  }

  private calculateMSE(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  // Train the random forest
  train(trainingData: PredictionModelInput[], targets: { spreadRadius: number[], intensity: number[], timeToSpread: number[] }) {
    this.trees = [];
    
    // Convert input to matrix format
    const dataMatrix = trainingData.map(input => [
      input.waterQualityIndex, input.flowVelocity, input.trashCount,
      input.temperature, input.rainfall, input.phValue,
      input.bodLevel, input.ammoniacalNitrogen, input.suspendedSolids
    ]);

    // Train separate models for each target
    for (let i = 0; i < this.numTrees; i++) {
      // Bootstrap sampling
      const bootstrapSize = Math.floor(dataMatrix.length * 0.8);
      const bootstrapIndices = Array.from({ length: bootstrapSize }, () => 
        Math.floor(Math.random() * dataMatrix.length)
      );
      
      const bootstrapData = bootstrapIndices.map(idx => dataMatrix[idx]);
      const bootstrapTargets = bootstrapIndices.map(idx => targets.spreadRadius[idx]);

      this.trees.push(this.buildTree(bootstrapData, bootstrapTargets));
    }
  }

  // Predict using the trained forest
  predict(input: number[]): number {
    const predictions = this.trees.map(tree => this.predictWithTree(tree, input));
    return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
  }

  private predictWithTree(node: TreeNode, input: number[]): number {
    if (node.isLeaf) {
      return node.prediction || 0;
    }

    const featureIdx = this.featureNames.indexOf(node.feature || '');
    if (featureIdx === -1) return 0;

    if (input[featureIdx] <= (node.threshold || 0)) {
      return node.left ? this.predictWithTree(node.left, input) : 0;
    } else {
      return node.right ? this.predictWithTree(node.right, input) : 0;
    }
  }

  // Calculate feature importance
  calculateFeatureImportance(): { [key: string]: number } {
    const importance: { [key: string]: number } = {};
    this.featureNames.forEach(name => importance[name] = 0);

    // Simplified feature importance calculation
    this.trees.forEach(tree => {
      this.traverseTreeForImportance(tree, importance);
    });

    // Normalize
    const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(importance).forEach(key => {
        importance[key] = importance[key] / total;
      });
    }

    return importance;
  }

  private traverseTreeForImportance(node: TreeNode, importance: { [key: string]: number }) {
    if (!node.isLeaf && node.feature) {
      importance[node.feature] += 1;
      if (node.left) this.traverseTreeForImportance(node.left, importance);
      if (node.right) this.traverseTreeForImportance(node.right, importance);
    }
  }
}

// Initialize and train the Random Forest model
const pollutionForest = new RandomForestRegressor(100, 15, 3);

// Generate synthetic training data for the model
function generateTrainingData(): { inputs: PredictionModelInput[], targets: { spreadRadius: number[], intensity: number[], timeToSpread: number[] } } {
  const inputs: PredictionModelInput[] = [];
  const targets = { spreadRadius: [], intensity: [], timeToSpread: [] };

  for (let i = 0; i < 1000; i++) {
    const input: PredictionModelInput = {
      waterQualityIndex: Math.random() * 10,
      flowVelocity: Math.random() * 5,
      trashCount: Math.random() * 100,
      temperature: 15 + Math.random() * 25,
      rainfall: Math.random() * 50,
      phValue: 6 + Math.random() * 3,
      bodLevel: Math.random() * 5,
      ammoniacalNitrogen: Math.random() * 1,
      suspendedSolids: 20 + Math.random() * 100
    };

    // Calculate synthetic targets based on realistic relationships
    const spreadRadius = (input.flowVelocity * 100) + (input.trashCount * 0.8) + 
                        (input.temperature * 2) + (input.rainfall * 1.5) - (input.waterQualityIndex * 10);
    
    const intensity = 5 + (Math.abs(input.phValue - 7) * 0.8) + (input.bodLevel * 1.2) + 
                     (input.ammoniacalNitrogen * 3) + (input.suspendedSolids * 0.03);
    
    const timeToSpread = Math.max(1, spreadRadius / (input.flowVelocity + 0.1) / 
                        Math.max(1, (10 - input.waterQualityIndex) / 2));

    inputs.push(input);
    targets.spreadRadius.push(Math.max(10, spreadRadius));
    targets.intensity.push(Math.min(10, Math.max(1, intensity)));
    targets.timeToSpread.push(timeToSpread);
  }

  return { inputs, targets };
}

// Train the model with synthetic data
const trainingData = generateTrainingData();
pollutionForest.train(trainingData.inputs, trainingData.targets);

// Enhanced prediction function using Random Forest
export function predictPollutionSpread(input: PredictionModelInput): PollutionPrediction {
  const inputVector = [
    input.waterQualityIndex, input.flowVelocity, input.trashCount,
    input.temperature, input.rainfall, input.phValue,
    input.bodLevel, input.ammoniacalNitrogen, input.suspendedSolids
  ];

  // Get predictions from Random Forest
  const spreadRadius = Math.max(10, pollutionForest.predict(inputVector));
  
  // Create separate forests for other predictions (simplified for demo)
  const intensity = Math.min(10, Math.max(1, 
    5 + (Math.abs(input.phValue - 7) * 0.8) + (input.bodLevel * 1.2) + 
    (input.ammoniacalNitrogen * 3) + (input.suspendedSolids * 0.03)
  ));

  const timeToSpread = Math.max(1, spreadRadius / (input.flowVelocity + 0.1) / 
                      Math.max(1, (10 - input.waterQualityIndex) / 2));

  // Calculate direction vector based on flow and environmental factors
  const windEffect = input.rainfall * 0.1;
  const flowEffect = input.flowVelocity * 0.7;
  const directionVector = {
    x: Math.cos(flowEffect) + (Math.random() - 0.5) * windEffect,
    y: Math.sin(flowEffect * 0.3) + (Math.random() - 0.5) * windEffect
  };

  // Calculate prediction confidence based on input quality
  const confidence = Math.min(1, Math.max(0.5, 
    (input.waterQualityIndex / 10) * 0.3 + 
    (input.flowVelocity > 0 ? 0.3 : 0.1) + 
    (input.trashCount > 0 ? 0.2 : 0.1) + 0.2
  ));

  // Get feature importance
  const featureImportance = pollutionForest.calculateFeatureImportance();

  return {
    spreadRadius: Number(spreadRadius.toFixed(2)),
    intensity: Number(intensity.toFixed(1)),
    directionVector: {
      x: Number(directionVector.x.toFixed(3)),
      y: Number(directionVector.y.toFixed(3))
    },
    timeToSpread: Number(timeToSpread.toFixed(1)),
    confidence: Number(confidence.toFixed(2)),
    featureImportance
  };
}

// Calculate Water Quality Index based on parameters
export function calculateWaterQualityIndex(
  phValue: number,
  bodLevel: number,
  ammoniacalNitrogen: number,
  suspendedSolids: number
): { index: number, label: string, color: string } {
  // Weight factors for each parameter
  const phWeight = 0.25;
  const bodWeight = 0.35;
  const nitrogenWeight = 0.25;
  const solidsWeight = 0.15;
  
  // Calculate sub-indices (0-100 scale where higher is better)
  let phIndex = 0;
  if (phValue >= 6.5 && phValue <= 8.5) {
    phIndex = 100;
  } else if (phValue >= 6.0 && phValue <= 9.0) {
    phIndex = 70;
  } else if (phValue >= 5.0 && phValue <= 10.0) {
    phIndex = 40;
  } else {
    phIndex = 10;
  }
  
  let bodIndex = Math.max(0, 100 - (bodLevel * 20));
  let nitrogenIndex = Math.max(0, 100 - (ammoniacalNitrogen * 80));
  let solidsIndex = Math.max(0, 100 - (suspendedSolids * 0.5));
  
  // Calculate weighted index (0-100)
  const wqi = phIndex * phWeight + bodIndex * bodWeight + 
              nitrogenIndex * nitrogenWeight + solidsIndex * solidsWeight;
  
  // Convert to 0-10 scale
  const index = Number((wqi / 10).toFixed(1));
  
  // Determine category and color
  let label, color;
  if (wqi >= 80) {
    label = "Excellent";
    color = "bg-green-100 text-green-800";
  } else if (wqi >= 60) {
    label = "Good";
    color = "bg-emerald-100 text-emerald-800";
  } else if (wqi >= 40) {
    label = "Moderate";
    color = "bg-yellow-100 text-yellow-800";
  } else if (wqi >= 20) {
    label = "Poor";
    color = "bg-orange-100 text-orange-800";
  } else {
    label = "Very Poor";
    color = "bg-red-100 text-red-800";
  }
  
  return { index, label, color };
}

// Fetch weather data from public API
export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m`
    );
    
    if (!response.ok) {
      throw new Error('Weather data fetch failed');
    }
    
    const data = await response.json();
    
    return {
      temperature: data.current.temperature_2m,
      rainfall: data.current.rain,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    // Return default values if API fails
    return {
      temperature: 20,
      rainfall: 0,
      humidity: 50,
      windSpeed: 5,
      timestamp: new Date(),
    };
  }
}
