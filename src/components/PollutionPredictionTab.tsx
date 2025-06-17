import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define types
interface RiverCharacteristics {
  width: number;
  depth: number;
  flowResistance: number;
  vegetation: number;
  benthicDeposition: number;
  dissolved_oxygen: number;
  temperature: number;
  pH: number;
  turbidity: number;
}

interface RiverPoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
  description?: string;
  characteristics: RiverCharacteristics;
  elevation?: number;
  pollutantSources?: {
    type: string;
    intensity: number;
  }[];
}

interface PollutantProperties {
  name: string;
  decayRate: number;
  adsorptionRate: number;
  diffusionCoefficient: number;
  densityRelativeToWater: number;
  toxicityThreshold: number;
  bioaccumulation: number;
}

interface PollutionResults {
  sourcePoint: RiverPoint;
  thresholdPoint: RiverPoint;
  pollutedSegment: RiverPoint[];
  maxDistance: number;
  totalTime: number;
  finalDensity: number;
  pollutionData: any[];
  distances: number[];
  environmentalImpact: number;
  remediationTime: number;
  affectedSpecies: number;
  sensorReadings: {
    location: string;
    density: number;
    arrivalTime: number;
    qualityImpact: string;
  }[];
}

// Simplified river path data
const riverPath: RiverPoint[] = [
  { 
    id: "estuary",
    lat: 3.3380, 
    lon: 101.2450, 
    name: "Estuary (Straits of Malacca)",
    description: "River mouth meeting the Straits of Malacca",
    elevation: 0,
    characteristics: { 
      width: 180, 
      depth: 10, 
      flowResistance: 0.2, 
      vegetation: 0.3,
      benthicDeposition: 0.6,
      dissolved_oxygen: 5.8,
      temperature: 29.5,
      pH: 7.7,
      turbidity: 35
    }
  },
  { 
    id: "kuala_selangor",
    lat: 3.3355, 
    lon: 101.2600, 
    name: "Kuala Selangor",
    description: "Main town area with moderate development",
    elevation: 3,
    characteristics: { 
      width: 140, 
      depth: 8, 
      flowResistance: 0.25, 
      vegetation: 0.4,
      benthicDeposition: 0.5,
      dissolved_oxygen: 5.4,
      temperature: 29.8,
      pH: 7.5,
      turbidity: 30
    },
    pollutantSources: [
      { type: "urban_runoff", intensity: 30 },
      { type: "sewage", intensity: 25 }
    ]
  },
  { 
    id: "kampung_kuantan",
    lat: 3.3330, 
    lon: 101.2750, 
    name: "Kampung Kuantan",
    description: "Famous firefly sanctuary area",
    elevation: 8,
    characteristics: { 
      width: 120, 
      depth: 7, 
      flowResistance: 0.35, 
      vegetation: 0.7,
      benthicDeposition: 0.4,
      dissolved_oxygen: 6.0,
      temperature: 29.5,
      pH: 7.3,
      turbidity: 25
    }
  },
  { 
    id: "bestari_jaya",
    lat: 3.3255, 
    lon: 101.3200, 
    name: "Bestari Jaya",
    description: "Developed area with educational institutions",
    elevation: 22,
    characteristics: { 
      width: 70, 
      depth: 4.5, 
      flowResistance: 0.6, 
      vegetation: 0.5,
      benthicDeposition: 0.15,
      dissolved_oxygen: 6.1,
      temperature: 29.0,
      pH: 6.9,
      turbidity: 12
    },
    pollutantSources: [
      { type: "urban_runoff", intensity: 20 }
    ]
  }
];

// Define pollutant types
const pollutantTypes: Record<string, PollutantProperties> = {
  oil: {
    name: "Oil Pollutants",
    decayRate: 0.05,
    adsorptionRate: 0.3,
    diffusionCoefficient: 0.2,
    densityRelativeToWater: 0.85,
    toxicityThreshold: 0.5,
    bioaccumulation: 0.7
  },
  chemical: {
    name: "Chemical Pollutants",
    decayRate: 0.03,
    adsorptionRate: 0.5,
    diffusionCoefficient: 0.4,
    densityRelativeToWater: 1.1,
    toxicityThreshold: 0.3,
    bioaccumulation: 0.8
  },
  plastic: {
    name: "Plastic Waste",
    decayRate: 0.001,
    adsorptionRate: 0.2,
    diffusionCoefficient: 0.1,
    densityRelativeToWater: 0.9,
    toxicityThreshold: 0.6,
    bioaccumulation: 0.9
  }
};

const PollutionPredictionTab: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>("estuary");
  const [selectedPollutant, setSelectedPollutant] = useState<string>("chemical");
  const [flowVelocity, setFlowVelocity] = useState<number>(0.5);
  const [initialDensity, setInitialDensity] = useState<number>(1500);
  const [trappingRate, setTrappingRate] = useState<number>(0.2);
  const [results, setResults] = useState<PollutionResults | null>(null);

  const sourceIndex = riverPath.findIndex(point => point.id === selectedLocation);

  function haversine(point1: RiverPoint, point2: RiverPoint): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lon - point1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  function calculatePollutionSpread() {
    console.log('Calculating pollution spread...');
    
    // Calculate distances between river points
    const distances: number[] = [0];
    for (let i = 1; i < riverPath.length; i++) {
      const dist = haversine(riverPath[i - 1], riverPath[i]);
      distances.push(distances[i - 1] + dist);
    }

    // Get pollutant properties
    const pollutant = pollutantTypes[selectedPollutant];
    const thresholdDensity = initialDensity * 0.1;
    const pollutionData: any[] = [];
    let thresholdIndex: number | null = null;

    for (let i = 0; i < riverPath.length; i++) {
      let density = 0;
      let timeHours = 0;
      let waterQualityImpact = "None";

      if (i >= sourceIndex) {
        const distanceKm = distances[i] - distances[sourceIndex];
        
        // Simple time calculation
        timeHours = distanceKm / flowVelocity;
        
        // Simple dilution calculation
        const dilutionFactor = Math.exp(-0.1 * distanceKm);
        const trappingFactor = Math.exp(-trappingRate * distanceKm);
        const decayFactor = Math.exp(-pollutant.decayRate * timeHours);
        
        density = initialDensity * dilutionFactor * trappingFactor * decayFactor;
        
        // Determine water quality impact
        const relativeImpact = density / (pollutant.toxicityThreshold * 1500);
        if (relativeImpact < 0.2) waterQualityImpact = "Minimal";
        else if (relativeImpact < 0.5) waterQualityImpact = "Low";
        else if (relativeImpact < 1.0) waterQualityImpact = "Moderate";
        else if (relativeImpact < 2.0) waterQualityImpact = "High";
        else waterQualityImpact = "Severe";
        
        if (density <= thresholdDensity && thresholdIndex === null && i > sourceIndex) {
          thresholdIndex = i;
        }
      }

      pollutionData.push({
        point: riverPath[i],
        density: Math.max(density, 0),
        distance: distances[i],
        time: timeHours,
        waterQualityImpact: waterQualityImpact
      });
    }

    if (thresholdIndex === null) {
      thresholdIndex = riverPath.length - 1;
    }
    
    const environmentalImpact = (pollutionData[pollutionData.length - 1].density / initialDensity) * 
                               10 * pollutant.bioaccumulation;
    
    const remediationTime = pollutionData[thresholdIndex].time * 
                           (3 + 5 * (1 - pollutant.decayRate));
    
    const affectedSpecies = Math.round(15 * 
                           Math.min(1, (environmentalImpact * pollutant.toxicityThreshold) / 5));
    
    setResults({
      sourcePoint: riverPath[sourceIndex],
      thresholdPoint: riverPath[thresholdIndex],
      pollutedSegment: riverPath.slice(sourceIndex, thresholdIndex + 1),
      maxDistance: distances[thresholdIndex] - distances[sourceIndex],
      totalTime: pollutionData[thresholdIndex].time,
      finalDensity: pollutionData[pollutionData.length - 1].density,
      pollutionData: pollutionData,
      distances: distances,
      environmentalImpact: environmentalImpact,
      remediationTime: remediationTime,
      affectedSpecies: affectedSpecies,
      sensorReadings: []
    });
  }

  useEffect(() => {
    console.log('useEffect triggered, calculating pollution spread');
    calculatePollutionSpread();
  }, [sourceIndex, selectedPollutant, flowVelocity, initialDensity, trappingRate]);

  const getPollutionColor = (density: number, maxDensity: number): string => {
    const ratio = density / maxDensity;
    if (ratio > 0.8) return '#8B0000';
    if (ratio > 0.6) return '#FF0000';
    if (ratio > 0.4) return '#FF4500';
    if (ratio > 0.2) return '#FFA500';
    if (ratio > 0.1) return '#FFFF00';
    return '#90EE90';
  };

  const MapVisualization = () => {
    if (!results) return null;

    const maxDensity = Math.max(...results.pollutionData.map((d: any) => d.density));

    return (
      <MapContainer
        center={[3.3315, 101.2750]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Polyline
          positions={riverPath.map(point => [point.lat, point.lon])}
          color="#0066cc"
          weight={4}
          opacity={0.7}
        />
        
        {results.pollutionData.map((data: any, index: number) => {
          if (data.density <= 0) return null;
          
          const radius = Math.max(5, (data.density / maxDensity) * 20);
          const color = getPollutionColor(data.density, maxDensity);
          
          return (
            <CircleMarker
              key={`pollution-${index}`}
              center={[data.point.lat, data.point.lon]}
              radius={radius}
              fillColor={color}
              color={color}
              weight={2}
              opacity={0.8}
              fillOpacity={0.6}
            >
              <Popup>
                <div className="text-sm">
                  <h4 className="font-semibold">{data.point.name}</h4>
                  <p>Pollution Density: {data.density.toFixed(2)}</p>
                  <p>Distance from Source: {(data.distance - results.distances[sourceIndex]).toFixed(2)} km</p>
                  <p>Travel Time: {data.time.toFixed(2)} hours</p>
                  <p>Water Quality Impact: {data.waterQualityImpact}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        
        {riverPath.map((point) => (
          <CircleMarker
            key={`point-${point.id}`}
            center={[point.lat, point.lon]}
            radius={point.id === selectedLocation ? 8 : 5}
            fillColor={point.id === selectedLocation ? '#ff0000' : '#333333'}
            color="#ffffff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div className="text-sm">
                <h4 className="font-semibold">{point.name}</h4>
                <p>{point.description}</p>
                <p>Width: {point.characteristics.width}m</p>
                <p>Depth: {point.characteristics.depth}m</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pollution Prediction Model</CardTitle>
          <CardDescription>
            Simulate the spread of pollutants through the Selangor River system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label>Source Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {riverPath.map((point) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label>Pollutant Type</Label>
                <Select value={selectedPollutant} onValueChange={setSelectedPollutant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pollutant type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(pollutantTypes).map((key) => (
                      <SelectItem key={key} value={key}>
                        {pollutantTypes[key].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>

            <Button onClick={calculatePollutionSpread} className="w-full md:w-auto">
              Recalculate Prediction
            </Button>

            {results && (
              <div className="mt-6 space-y-6">
                <h3 className="text-lg font-semibold">Prediction Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 border border-green-100 rounded-md text-sm">
                    <h4 className="font-semibold text-green-800 mb-2">Transport Metrics</h4>
                    <p><strong>Source:</strong> {results.sourcePoint.name}</p>
                    <p><strong>Threshold Reached At:</strong> {results.thresholdPoint.name}</p>
                    <p><strong>Polluted Segment Length:</strong> {results.maxDistance.toFixed(2)} km</p>
                    <p><strong>Time to Threshold:</strong> {results.totalTime.toFixed(2)} hours</p>
                    <p><strong>Final Density:</strong> {results.finalDensity.toFixed(2)} units</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-md text-sm">
                    <h4 className="font-semibold text-blue-800 mb-2">Environmental Impact</h4>
                    <p><strong>Environmental Impact Score:</strong> {results.environmentalImpact.toFixed(2)}/10</p>
                    <p><strong>Estimated Remediation Time:</strong> {results.remediationTime.toFixed(1)} hours</p>
                    <p><strong>Affected Species:</strong> ~{results.affectedSpecies} significant species</p>
                    <p><strong>Pollutant Type:</strong> {pollutantTypes[selectedPollutant].name}</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-md text-sm">
                    <h4 className="font-semibold text-amber-800 mb-2">Status</h4>
                    <p><strong>Model:</strong> Simplified Prediction</p>
                    <p><strong>River Points:</strong> {riverPath.length} locations</p>
                    <p><strong>Calculation Status:</strong> Complete</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-4">OpenStreetMap Visualization</h4>
                  <div className="w-full h-[500px] border rounded-lg overflow-hidden">
                    <MapVisualization />
                  </div>
                  
                  <div className="bg-white p-4 border rounded-lg mt-4">
                    <h4 className="font-semibold mb-2">Map Legend</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span>River Path</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                        <span>Pollution Source</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-black rounded-full"></div>
                        <span>River Points</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-red-600 to-green-300 rounded-full"></div>
                        <span>Pollution Intensity</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PollutionPredictionTab;
