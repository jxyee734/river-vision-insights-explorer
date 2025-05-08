
import axios from 'axios';

interface RoboflowDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoboflowResponse {
  predictions: RoboflowDetection[];
  image: {
    width: number;
    height: number;
  };
}

const ROBOFLOW_API_KEY = "rJMJV2iPeGELo9CaJi9a";
const DEFAULT_CONFIDENCE_THRESHOLD = 0.45; // Increased default threshold for better accuracy

export const detectTrashInImage = async (
  imageData: string, 
  confidenceThreshold: number = DEFAULT_CONFIDENCE_THRESHOLD
): Promise<RoboflowResponse> => {
  try {
    const response = await axios({
      method: "POST",
      url: "https://serverless.roboflow.com/ocean-plastics-waste-detection-float-plastics/1",
      params: {
        api_key: ROBOFLOW_API_KEY,
        confidence: confidenceThreshold
      },
      data: imageData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error detecting trash:', error);
    throw error;
  }
};
