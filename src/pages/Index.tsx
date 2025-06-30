import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import UploadSection from "@/components/UploadSection";
import VideoPlayer from "@/components/VideoPlayer";
import ProcessingVisualization from "@/components/ProcessingVisualization";
import { analyzeVideo } from "@/utils/videoAnalysis";
import { CloudLightning, FileVideo, ArrowRight, User } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { Card, CardContent } from "@/components/ui/card";
import WeatherTab from "@/components/WeatherTab";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import DepthVisualization from "@/components/DepthVisualization";
import { motion, AnimatePresence } from "framer-motion";
import SensorTab from "@/components/SensorTab";
import PollutionPredictionTab from "@/components/PollutionPredictionTab";
import { generateStateWaterQuality } from "@/utils/stateWaterQuality";

declare global {
  interface Window {
    updateProcessingStage: (stage: number) => void;
  }
}

const UserProfileButton = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {user?.name || "User"}
        </span>
      </button>
    </div>
  );
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, saveAnalysis } = useUser();

  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [processingStage, setProcessingStage] = useState(0);
  const [showWeatherAndSensor, setShowWeatherAndSensor] = useState(false);
  const [showPollutionPrediction, setShowPollutionPrediction] = useState(false);
  const [showWaterQuality, setShowWaterQuality] = useState(false);

  const handleVideoUpload = async (
    file: File,
    location: string,
    river: string,
  ) => {
    try {
      setIsProcessing(true);
      setProcessingStage(0);

      window.updateProcessingStage = (stage: number) => {
        setProcessingStage(stage);
      };

      toast.info("Processing video with AI analysis, please wait...");

      const result = await analyzeVideo(
        file,
        user?.preferences.opticalFlowMethod,
      );
      result.riverCategory = {
        state: location,
        river: river,
      };
      result.fileName = file.name;
      setAnalysisResult(result);

      // Auto-save analysis if enabled
      if (user?.preferences.autoSave) {
        saveAnalysis(result);
      }

      // Show different messages based on whether trash detection worked
      if (result.environmentalImpact?.includes("unavailable")) {
        toast.warning(
          "Video analysis complete! Trash detection was unavailable due to external service issues, but flow analysis succeeded.",
        );
      } else {
        toast.success("Video analysis complete!");
      }
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error("Error processing video. Please try again.");
    } finally {
      setIsProcessing(false);
      delete window.updateProcessingStage;
    }
  };

  // Toggle functions
  const toggleWeatherAndSensor = () => {
    setShowWeatherAndSensor(!showWeatherAndSensor);
  };

  const togglePollutionPrediction = () => {
    setShowPollutionPrediction(!showPollutionPrediction);
  };

  const toggleWaterQuality = () => {
    setShowWaterQuality(!showWaterQuality);
  };

  // Prepare flow data for the chart
  const prepareChartData = () => {
    if (
      !analysisResult?.flowVectors ||
      analysisResult.flowVectors.length === 0
    ) {
      return [];
    }

    return analysisResult.flowVectors.map((flow, frameIndex) => {
      const avgVelocity =
        flow.velocities.reduce((sum, v) => sum + v, 0) / flow.velocities.length;
      return {
        name: `Frame ${frameIndex + 1}`,
        velocity: Number(avgVelocity.toFixed(2)),
        average: analysisResult.averageVelocity,
      };
    });
  };

  const chartData = prepareChartData();

  // Group trash by categories and count
  const getTrashCategories = () => {
    if (!analysisResult?.trashCategories) return {};

    const categories: Record<string, number> = {};
    analysisResult.trashCategories.forEach((category) => {
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  };

  const trashCategories = getTrashCategories();

  // Get velocity color based on speed
  const getVelocityColor = (velocity: number) => {
    if (velocity < 0.5) return "bg-blue-200 text-blue-800"; // Slow
    if (velocity < 1.0) return "bg-blue-300 text-blue-800"; // Moderate
    if (velocity < 1.5) return "bg-blue-400 text-blue-900"; // Fast
    return "bg-blue-500 text-white"; // Very fast
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CloudLightning className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                River Analysis
              </h1>
              <p className="text-sm text-gray-500">
                Optical Flow & Trash Detection
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleWeatherAndSensor}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              Weather & Sensor
            </button>
            <button
              onClick={togglePollutionPrediction}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              Pollution Prediction
            </button>
            <button
              onClick={toggleWaterQuality}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
            >
              Water Quality
            </button>
            <UserProfileButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload and Summary */}
          <div className="lg:col-span-1">
            <UploadSection
              onVideoUploaded={handleVideoUpload}
              isProcessing={isProcessing}
            />

            {isProcessing && (
              <div className="mt-6">
                <ProcessingVisualization currentStage={processingStage} />
              </div>
            )}

            {showWeatherAndSensor && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                  className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-auto"
                  style={{ maxHeight: "80vh" }}
                >
                  <WeatherTab />
                  <SensorTab />
                  <button
                    onClick={toggleWeatherAndSensor}
                    className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {showPollutionPrediction && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                  className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-auto"
                  style={{ maxHeight: "80vh" }}
                >
                  <PollutionPredictionTab />
                  <button
                    onClick={togglePollutionPrediction}
                    className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {showWaterQuality && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                  className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 overflow-auto"
                  style={{ maxHeight: "80vh" }}
                >
                  <h2 className="text-2xl font-bold mb-4">
                    Malaysia States Water Quality Index
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generateStateWaterQuality().map((stateData) => (
                      <div
                        key={stateData.state}
                        className="p-4 border rounded-lg"
                      >
                        <h3 className="font-semibold text-lg">
                          {stateData.state}
                        </h3>
                        <div
                          className={`mt-2 px-3 py-1 rounded-full inline-block ${stateData.waterQualityIndex.color}`}
                        >
                          {stateData.waterQualityIndex.label} (
                          {stateData.waterQualityIndex.index})
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>pH: {stateData.phValue.toFixed(2)}</p>
                          <p>BOD: {stateData.bodLevel.toFixed(2)} mg/L</p>
                          <p>
                            NH3-N: {stateData.ammoniacalNitrogen.toFixed(2)}{" "}
                            mg/L
                          </p>
                          <p>SS: {stateData.suspendedSolids.toFixed(2)} mg/L</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={toggleWaterQuality}
                    className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 bg-white rounded-lg shadow p-4"
              >
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <FileVideo className="h-5 w-5 text-blue-500 mr-2" />
                  Analysis Summary
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Frames Analyzed:</span>
                    <span className="font-medium">
                      {analysisResult.frames.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Flow Velocity:</span>
                    <span className="font-medium">
                      {analysisResult.averageVelocity} m/s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Trash Items:</span>
                    <span className="font-medium">
                      {analysisResult.trashCount}
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 italic">
                  Note: All measurements are estimates based on AI analysis.
                </div>
                <button
                  onClick={() => {
                    toast.success(
                      "Video analysis data submitted successfully!",
                    );
                  }}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Submit Analysis
                </button>
              </motion.div>
            )}
          </div>

          {/* Right Column: Results Display */}
          <div className="lg:col-span-2">
            {!analysisResult ? (
              <div className="h-full flex items-center justify-center bg-white rounded-lg shadow p-8 border border-dashed border-gray-200">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-medium text-gray-700 mb-2">
                    Analyze River Videos
                  </h2>
                  <p className="text-gray-500">
                    Upload a river video to analyze water flow and detect trash.
                    Our AI-powered analysis provides insights on flow patterns
                    and pollution detection.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {analysisResult.videoUrl && (
                  <VideoPlayer
                    videoUrl={analysisResult.videoUrl}
                    trashDetections={analysisResult.trashDetections}
                    trashDetectionImages={analysisResult.trashDetectionImages}
                  />
                )}
                {analysisResult.depthProfile && (
                  <DepthVisualization
                    depthProfile={analysisResult.depthProfile}
                    averageDepth={analysisResult.averageDepth}
                    maxDepth={analysisResult.maxDepth}
                  />
                )}

                {/* Flow Analysis Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="w-full">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                          <div>
                            <h3 className="text-sm font-medium text-blue-800">
                              Average Velocity
                            </h3>
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold text-blue-700">
                                {analysisResult.averageVelocity}
                              </span>
                              <span className="ml-1 text-sm text-blue-600">
                                m/s
                              </span>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full ${getVelocityColor(analysisResult.averageVelocity)}`}
                          >
                            {analysisResult.averageVelocity < 0.5 && "Slow"}
                            {analysisResult.averageVelocity >= 0.5 &&
                              analysisResult.averageVelocity < 1.0 &&
                              "Moderate"}
                            {analysisResult.averageVelocity >= 1.0 &&
                              analysisResult.averageVelocity < 1.5 &&
                              "Fast"}
                            {analysisResult.averageVelocity >= 1.5 &&
                              "Very Fast"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                          <div>
                            <h3 className="text-sm font-medium text-blue-800">
                              Flow Magnitude
                            </h3>
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold text-blue-700">
                                {analysisResult.flowMagnitude}
                              </span>
                              <span className="ml-1 text-sm text-blue-600">
                                units
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ArrowRight
                              className={`h-5 w-5 ${analysisResult.flowMagnitude > 5 ? "text-blue-700" : "text-blue-500"}`}
                            />
                            {analysisResult.flowMagnitude > 3 && (
                              <ArrowRight
                                className={`h-5 w-5 ${analysisResult.flowMagnitude > 6 ? "text-blue-700" : "text-blue-500"}`}
                              />
                            )}
                            {analysisResult.flowMagnitude > 6 && (
                              <ArrowRight className="h-5 w-5 text-blue-700" />
                            )}
                          </div>
                        </div>
                      </div>

                      {chartData.length > 0 && (
                        <div className="mt-6 h-72">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Flow Velocity Over Time
                          </h3>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis
                                label={{
                                  value: "m/s",
                                  angle: -90,
                                  position: "insideLeft",
                                }}
                              />
                              <Tooltip />
                              <ReferenceLine
                                y={analysisResult.averageVelocity}
                                stroke="#8884d8"
                                strokeDasharray="3 3"
                                label="Average"
                              />
                              <Line
                                type="monotone"
                                dataKey="velocity"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                activeDot={{ r: 8 }}
                                name="Flow Velocity"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Trash Detection Summary */}
                {analysisResult.trashCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Card className="w-full">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Trash Classification Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-lg">
                            <span className="text-3xl font-bold text-red-600">
                              {analysisResult.trashCount}
                            </span>
                            <span className="text-sm text-red-600">
                              Total Trash Items
                            </span>
                          </div>
                          <div className="flex flex-col p-4 bg-green-50 border border-green-100 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800 mb-2">
                              Detected Categories
                            </h4>
                            {Object.entries(trashCategories).map(
                              ([category, count]) => (
                                <div
                                  key={category}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-sm text-green-700 capitalize">
                                    {category}
                                  </span>
                                  <span className="font-medium text-green-800">
                                    {count}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            This application uses advanced AI techniques to analyze river
            videos.
            <br />
            For research and educational purposes only.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
