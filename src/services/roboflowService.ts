
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

const ROBOFLOW_API_KEY = "hqoayI9gLjP3qmVGXdIf";

export const detectTrashInImage = async (imageData: string): Promise<RoboflowResponse> => {
  try {
    const response = await axios({
      method: "POST",
      url: "https://detect.roboflow.com/ocean-plastics-waste-detection-float-plastics/1",
      params: {
        api_key: ROBOFLOW_API_KEY
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
