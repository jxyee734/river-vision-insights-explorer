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

  if (!weather) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            <span>Loading weather data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const condition = getWeatherCondition(
    weather.current.cloudcover,
    weather.current.rainfall,
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-orange-500" />
              Weather Station - Open-Meteo API
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4" />
              {weather.location.name}, {weather.location.country}
              <Clock className="h-4 w-4 ml-4" />
              Last update: {weather.lastUpdate}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              fetchWeather(
                weather.location.latitude,
                weather.location.longitude,
              )
            }
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="forecast">24h Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">
                  {weather.current.temperature.toFixed(1)}°C
                </div>
                <div>
                  <Badge className={`${condition.color} text-white`}>
                    {condition.text}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">
                    Feels like {weather.current.apparentTemperature.toFixed(1)}
                    °C
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Wind</span>
                  </div>
                  <div className="text-xl font-bold">
                    {weather.current.windspeed.toFixed(1)} km/h
                  </div>
                  <div className="text-sm text-gray-500">
                    {getWindDirection(weather.current.winddirection)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Humidity</span>
                  </div>
                  <div className="text-xl font-bold">
                    {weather.current.humidity.toFixed(0)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Pressure</span>
                  </div>
                  <div className="text-xl font-bold">
                    {weather.current.pressure.toFixed(0)} hPa
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CloudRain className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Rainfall</span>
                  </div>
                  <div className="text-xl font-bold">
                    {weather.current.rainfall.toFixed(1)} mm
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Visibility</span>
                  </div>
                  <div className="text-xl font-bold">
                    {weather.current.visibility} km
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Cloud Cover</span>
                  </div>
                  <div className="text-xl font-bold">
                    {weather.current.cloudcover.toFixed(0)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weather.hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Humidity (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="precipitation"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Precipitation (mm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                Weather Impact on River Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Water Conditions:</span>
                  <p className="text-gray-600">
                    {weather.current.rainfall > 5
                      ? "Heavy rainfall may affect water clarity and flow patterns"
                      : weather.current.rainfall > 1
                        ? "Light rainfall present, minimal impact on analysis"
                        : "Clear conditions optimal for video analysis"}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Visibility:</span>
                  <p className="text-gray-600">
                    {weather.current.cloudcover > 75
                      ? "Overcast conditions may reduce natural lighting"
                      : "Good visibility for drone operations"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WeatherTab;
