
// Random Forest model implementation for pollution spread prediction
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
}

// Random forest model simulation (simplified for demonstration)
export function predictPollutionSpread(input: PredictionModelInput): PollutionPrediction {
  // In a real implementation, this would use actual trained model weights
  // For demo purposes, we're using a simplified algorithm
  
  // Base spread radius based on flow velocity and trash count
  let spreadRadius = (input.flowVelocity * 50) + (input.trashCount * 0.5);
  
  // Adjust based on water quality (worse quality = faster spread)
  const qualityFactor = Math.max(1, (10 - input.waterQualityIndex) / 2);
  spreadRadius *= qualityFactor;
  
  // Adjust based on temperature (higher temp = faster spread due to chemical reactions)
  const tempFactor = 1 + ((input.temperature - 15) / 30);
  spreadRadius *= tempFactor;
  
  // Adjust based on rainfall (higher rainfall = dilution but wider spread)
  const rainfallFactor = 1 + (input.rainfall / 50);
  spreadRadius *= rainfallFactor;
  
  // Calculate pollution intensity
  const baseIntensity = 5;
  const phEffect = Math.abs(input.phValue - 7) * 0.5;
  const bodEffect = input.bodLevel * 0.8;
  const nitrogenEffect = input.ammoniacalNitrogen * 2;
  const solidsEffect = input.suspendedSolids * 0.02;
  
  let intensity = baseIntensity + phEffect + bodEffect + nitrogenEffect + solidsEffect;
  intensity = Math.min(10, Math.max(1, intensity)); // Clamp between 1-10
  
  // Calculate direction vector (simplified - in reality would be based on terrain and flow)
  const directionVector = {
    x: Math.cos(input.flowVelocity * 0.7),
    y: Math.sin(input.flowVelocity * 0.3)
  };
  
  // Calculate time to spread
  const timeToSpread = spreadRadius / (input.flowVelocity + 0.1) / qualityFactor;
  
  return {
    spreadRadius: Number(spreadRadius.toFixed(2)),
    intensity: Number(intensity.toFixed(1)),
    directionVector: {
      x: Number(directionVector.x.toFixed(2)),
      y: Number(directionVector.y.toFixed(2))
    },
    timeToSpread: Number(timeToSpread.toFixed(1))
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
