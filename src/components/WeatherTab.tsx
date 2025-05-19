import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, Wind, CloudRain } from 'lucide-react';

interface WeatherData {
  temperature: number;
  windspeed: number;
  rainfall: number;
}

const WeatherTab: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,precipitation`);
        const data = await response.json();
        setWeather({
          temperature: data.current.temperature_2m,
          windspeed: data.current.wind_speed_10m,
          rainfall: data.current.precipitation
        });
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to default location if geolocation fails
          fetchWeather(52.52, 13.41);
        }
      );
    } else {
      // Fallback to default location if geolocation is not supported
      fetchWeather(52.52, 13.41);
    }
  }, []);

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
                <h3 className="text-sm font-medium text-gray-100">Temperature</h3>
                <span className="text-xl font-bold text-gray-300">{weather?.temperature ?? '--'}°C</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
            <div className="flex items-center">
              <Wind className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-100">Wind Speed</h3>
                <span className="text-xl font-bold text-gray-300">{weather?.windspeed ?? '--'} km/h</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
            <div className="flex items-center">
              <CloudRain className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-100">Rainfall</h3>
                <span className="text-xl font-bold text-gray-300">{weather?.rainfall ?? '--'} mm</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherTab;