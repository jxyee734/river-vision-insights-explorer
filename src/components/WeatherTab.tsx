import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Thermometer,
  Wind,
  CloudRain,
  Eye,
  Gauge,
  Droplets,
  Sun,
  Cloud,
  RefreshCw,
  MapPin,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WeatherData {
  current: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    rainfall: number;
    humidity: number;
    pressure: number;
    visibility: number;
    cloudcover: number;
    uvindex: number;
    apparentTemperature: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    humidity: number;
    precipitation: number;
    windspeed: number;
  }>;
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  lastUpdate: string;
}

const WeatherTab: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (latitude: number, longitude: number) => {
    setLoading(true);
    try {
      // Enhanced Open-Meteo API call with more parameters
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${latitude}&longitude=${longitude}&` +
          `current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,` +
          `weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,` +
          `wind_gusts_10m&` +
          `hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&` +
          `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&` +
          `timezone=auto`,
      );
      const data = await response.json();

      // Get location name using reverse geocoding (Open-Meteo geocoding API)
      const locationResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}`,
      );
      const locationData = await locationResponse.json();

      const processedWeather: WeatherData = {
        current: {
          temperature: data.current.temperature_2m || 0,
          windspeed: data.current.wind_speed_10m || 0,
          winddirection: data.current.wind_direction_10m || 0,
          rainfall: data.current.precipitation || 0,
          humidity: data.current.relative_humidity_2m || 0,
          pressure: data.current.pressure_msl || 0,
          visibility: 15, // Open-Meteo doesn't provide visibility, using default
          cloudcover: data.current.cloud_cover || 0,
          uvindex: 5, // Open-Meteo doesn't provide UV index in free tier, using default
          apparentTemperature:
            data.current.apparent_temperature ||
            data.current.temperature_2m ||
            0,
        },
        hourly: data.hourly.time
          .slice(0, 24)
          .map((time: string, index: number) => ({
            time: new Date(time).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            temperature: data.hourly.temperature_2m[index] || 0,
            humidity: data.hourly.relative_humidity_2m[index] || 0,
            precipitation: data.hourly.precipitation[index] || 0,
            windspeed: data.hourly.wind_speed_10m[index] || 0,
          })),
        location: {
          name: locationData.results?.[0]?.name || "Unknown Location",
          country: locationData.results?.[0]?.country || "Unknown Country",
          latitude: latitude,
          longitude: longitude,
        },
        lastUpdate: new Date().toLocaleTimeString(),
      };

      setWeather(processedWeather);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to Kuala Lumpur for Malaysia river analysis
          fetchWeather(3.139, 101.6869);
        },
      );
    } else {
      // Fallback to Kuala Lumpur
      fetchWeather(3.139, 101.6869);
    }
  }, []);

  const getWindDirection = (degrees: number) => {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const getWeatherCondition = (cloudCover: number, precipitation: number) => {
    if (precipitation > 0) return { text: "Rainy", color: "bg-blue-500" };
    if (cloudCover > 75) return { text: "Cloudy", color: "bg-gray-500" };
    if (cloudCover > 25)
      return { text: "Partly Cloudy", color: "bg-yellow-500" };
    return { text: "Clear", color: "bg-green-500" };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weather Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
            <div className="flex items-center">
              <Thermometer className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-100">
                  Temperature
                </h3>
                <span className="text-xl font-bold text-gray-300">
                  {weather?.temperature ?? "--"}°C
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
            <div className="flex items-center">
              <Wind className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-100">
                  Wind Speed
                </h3>
                <span className="text-xl font-bold text-gray-300">
                  {weather?.windspeed ?? "--"} km/h
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
            <div className="flex items-center">
              <CloudRain className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-100">Rainfall</h3>
                <span className="text-xl font-bold text-gray-300">
                  {weather?.rainfall ?? "--"} mm
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherTab;
