import axios from "axios";

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

const ROBOFLOW_API_KEY = "T8wNQVjhfarVRTdutLGh";
const DEFAULT_CONFIDENCE_THRESHOLD = 0.45; // Increased default threshold for better accuracy

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 30000; // 30 seconds

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const detectTrashInImage = async (
  imageData: string,
  confidenceThreshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
): Promise<RoboflowResponse> => {
  console.log("Starting trash detection in image...");
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Optimize image data by removing metadata
      const cleanImageData = imageData.replace(
        /^data:image\/[a-z]+;base64,/,
        "",
      );

      const response = await axios({
        method: "POST",
        url: "https://serverless.roboflow.com/ocean-plastics-waste-detection-float-plastics/1",
        params: {
          api_key: ROBOFLOW_API_KEY,
          confidence: confidenceThreshold,
        },
        data: cleanImageData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: TIMEOUT,
        timeoutErrorMessage:
          "Request timed out after " + TIMEOUT / 1000 + " seconds",
      });

      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.error("All retry attempts failed");
  console.error(
    "Last error details:",
    lastError.response?.data || lastError.message,
  );
  throw lastError;
};
