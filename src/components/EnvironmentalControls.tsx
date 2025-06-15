
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface EnvironmentalControlsProps {
  flowVelocity: number;
  setFlowVelocity: (value: number) => void;
  initialDensity: number;
  setInitialDensity: (value: number) => void;
  trappingRate: number;
  setTrappingRate: (value: number) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  windSpeed: number;
  setWindSpeed: (value: number) => void;
  windDirection: number;
  setWindDirection: (value: number) => void;
  precipitation: number;
  setPrecipitation: (value: number) => void;
}

const EnvironmentalControls: React.FC<EnvironmentalControlsProps> = ({
  flowVelocity,
  setFlowVelocity,
  initialDensity,
  setInitialDensity,
  trappingRate,
  setTrappingRate,
  temperature,
  setTemperature,
  windSpeed,
  setWindSpeed,
  windDirection,
  setWindDirection,
  precipitation,
  setPrecipitation,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="flow-velocity">Flow Velocity ({flowVelocity.toFixed(1)} m/s)</Label>
        <Slider
          id="flow-velocity"
          min={0.1}
          max={2.0}
          step={0.1}
          value={[flowVelocity]}
          onValueChange={(value) => setFlowVelocity(value[0])}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="initial-density">Initial Pollution Density ({initialDensity.toFixed(0)} units)</Label>
        <Slider
          id="initial-density"
          min={100}
          max={5000}
          step={50}
          value={[initialDensity]}
          onValueChange={(value) => setInitialDensity(value[0])}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trapping-rate">Trapping Rate ({trappingRate.toFixed(2)})</Label>
        <Slider
          id="trapping-rate"
          min={0}
          max={1}
          step={0.05}
          value={[trappingRate]}
          onValueChange={(value) => setTrappingRate(value[0])}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="temperature">Water Temperature ({temperature.toFixed(1)}°C)</Label>
        <Slider
          id="temperature"
          min={25}
          max={35}
          step={0.5}
          value={[temperature]}
          onValueChange={(value) => setTemperature(value[0])}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wind-speed">Wind Speed ({windSpeed.toFixed(1)} m/s)</Label>
        <Slider
          id="wind-speed"
          min={0}
          max={20}
          step={0.5}
          value={[windSpeed]}
          onValueChange={(value) => setWindSpeed(value[0])}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wind-direction">Wind Direction ({windDirection}°)</Label>
        <Slider
          id="wind-direction"
          min={0}
          max={359}
          step={1}
          value={[windDirection]}
          onValueChange={(value) => setWindDirection(value[0])}
        />
        <div className="text-xs text-gray-500">0° = North, 90° = East, 180° = South, 270° = West</div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="precipitation">Precipitation ({precipitation.toFixed(1)} mm/h)</Label>
        <Slider
          id="precipitation"
          min={0}
          max={50}
          step={1}
          value={[precipitation]}
          onValueChange={(value) => setPrecipitation(value[0])}
        />
      </div>
    </div>
  );
};

export default EnvironmentalControls;
