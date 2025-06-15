import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import * as d3 from 'd3';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, BarChart, LineChart } from 'lucide-react';
import RiverMap from './RiverMap';

// Define advanced types for river path points
interface RiverCharacteristics {
  width: number;               // meters
  depth: number;               // meters
  flowResistance: number;      // 0-1 scale
  vegetation: number;          // 0-1 scale - percentage of riverbank with vegetation
  benthicDeposition: number;   // 0-1 scale - tendency for pollutants to settle in sediment
  dissolved_oxygen: number;    // mg/L
  temperature: number;         // Celsius
  pH: number;                  // pH scale
  turbidity: number;           // NTU
}

interface RiverPoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
  description?: string;
  characteristics: RiverCharacteristics;
  elevation?: number;          // meters above sea level
  pollutantSources?: {
    type: string;
    intensity: number;         // 0-100 scale
  }[];
}

interface WeatherConditions {
  wind_speed: number;          // m/s
  wind_direction: number;      // degrees (0-359, 0 = North)
  precipitation: number;       // mm/hour
  temperature: number;         // Celsius
  humidity: number;            // percentage
  cloudCover: number;          // percentage
  solarRadiation: number;      // W/m²
}

interface PollutantProperties {
  name: string;
  decayRate: number;           // natural decay rate (0-1 scale)
  adsorptionRate: number;      // tendency to bind to sediment (0-1 scale)
  diffusionCoefficient: number; // rate of diffusion in water
  densityRelativeToWater: number; // relative to water (1 = neutrally buoyant)
  toxicityThreshold: number;   // concentration at which ecological effects occur
  bioaccumulation: number;     // tendency to accumulate in organisms (0-1 scale)
}

// Define the props type
interface PollutionPredictionProps {
  pollutionData?: any; // Replace with specific type if known
}

// Enhanced river path with more detailed data
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
    id: "pasir_penambang",
    lat: 3.3365, 
    lon: 101.2525, 
    name: "Pasir Penambang",
    description: "Fishing village with seafood restaurants",
    elevation: 1,
    characteristics: { 
      width: 160, 
      depth: 9, 
      flowResistance: 0.2, 
      vegetation: 0.3,
      benthicDeposition: 0.55,
      dissolved_oxygen: 5.6,
      temperature: 29.6,
      pH: 7.6,
      turbidity: 32
    },
    pollutantSources: [
      { type: "food_industry", intensity: 15 }
    ]
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
    id: "tanjung_karang",
    lat: 3.3345, 
    lon: 101.2680, 
    name: "Tanjung Karang",
    description: "Agricultural area with rice paddies",
    elevation: 5,
    characteristics: { 
      width: 130, 
      depth: 7.5, 
      flowResistance: 0.3, 
      vegetation: 0.5,
      benthicDeposition: 0.45,
      dissolved_oxygen: 5.2,
      temperature: 29.9,
      pH: 7.4,
      turbidity: 28
    },
    pollutantSources: [
      { type: "agricultural_runoff", intensity: 45 }
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
    id: "kuala_sungai_buloh",
    lat: 3.3315, 
    lon: 101.2850, 
    name: "Kuala Sungai Buloh",
    description: "Tributary confluence with mangrove areas",
    elevation: 10,
    characteristics: { 
      width: 110, 
      depth: 6.5, 
      flowResistance: 0.4, 
      vegetation: 0.8,
      benthicDeposition: 0.35,
      dissolved_oxygen: 6.2,
      temperature: 29.3,
      pH: 7.2,
      turbidity: 22
    }
  },
  { 
    id: "pasangan",
    lat: 3.3300, 
    lon: 101.2950, 
    name: "Pasangan",
    description: "Small riverside community with limited infrastructure",
    elevation: 12,
    characteristics: { 
      width: 100, 
      depth: 6, 
      flowResistance: 0.45, 
      vegetation: 0.6,
      benthicDeposition: 0.6,
      dissolved_oxygen: 6.0,
      temperature: 29.4,
      pH: 7.2,
      turbidity: 20
    },
    pollutantSources: [
      { type: "domestic_waste", intensity: 15 }
    ]
  },
  { 
    id: "bukit_rotan",
    lat: 3.3285, 
    lon: 101.3020, 
    name: "Bukit Rotan",
    description: "Upstream area with natural surroundings",
    elevation: 15,
    characteristics: { 
      width: 90, 
      depth: 5.5, 
      flowResistance: 0.5, 
      vegetation: 0.7,
      benthicDeposition: 0.25,
      dissolved_oxygen: 6.5,
      temperature: 29.2,
      pH: 7.1,
      turbidity: 18
    }
  },
  { 
    id: "ijok",
    lat: 3.3270, 
    lon: 101.3100, 
    name: "Ijok",
    description: "Rural settlement with small-scale industry",
    elevation: 18,
    characteristics: { 
      width: 80, 
      depth: 5, 
      flowResistance: 0.55, 
      vegetation: 0.6,
      benthicDeposition: 0.2,
      dissolved_oxygen: 6.3,
      temperature: 29.1,
      pH: 7.0,
      turbidity: 15
    },
    pollutantSources: [
      { type: "light_industry", intensity: 25 }
    ]
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
  },
  { 
    id: "kuala_sg_selangor",
    lat: 3.3240, 
    lon: 101.3300, 
    name: "Kuala Sg. Selangor Dam Vicinity",
    description: "Area near the dam with regulated water flow",
    elevation: 25,
    characteristics: { 
      width: 60, 
      depth: 4, 
      flowResistance: 0.65, 
      vegetation: 0.6,
      benthicDeposition: 0.1,
      dissolved_oxygen: 6.8,
      temperature: 28.5,
      pH: 6.8,
      turbidity: 10
    }
  }
];

// Define different types of pollutants
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
  sediment: {
    name: "Sediment",
    decayRate: 0.01,
    adsorptionRate: 0.9,
    diffusionCoefficient: 0.1,
    densityRelativeToWater: 1.5,
    toxicityThreshold: 0.8,
    bioaccumulation: 0.1
  },
  nutrients: {
    name: "Nutrients (N, P)",
    decayRate: 0.06,
    adsorptionRate: 0.4,
    diffusionCoefficient: 0.6,
    densityRelativeToWater: 1.0,
    toxicityThreshold: 0.4,
    bioaccumulation: 0.5
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

const PollutionPredictionTab: React.FC<PollutionPredictionProps> = ({ pollutionData }) => {
  const [selectedLocation, setSelectedLocation] = useState<string>("estuary");
  const [selectedPollutant, setSelectedPollutant] = useState<string>("chemical");
  const [flowVelocity, setFlowVelocity] = useState<number>(0.5);
  const [windSpeed, setWindSpeed] = useState<number>(5);
  const [windDirection, setWindDirection] = useState<number>(180);
  const [initialDensity, setInitialDensity] = useState<number>(1500);
  const [trappingRate, setTrappingRate] = useState<number>(0.2);
  const [temperature, setTemperature] = useState<number>(29);
  const [precipitation, setPrecipitation] = useState<number>(10);
  const [results, setResults] = useState<PollutionResults | null>(null);
  const [viewMode, setViewMode] = useState<string>("density");
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Enhanced pollution spread calculation with advanced hydrodynamic modeling
  function calculatePollutionSpread() {
    // Calculate distances between river points
    const distances: number[] = [0];
    for (let i = 1; i < riverPath.length; i++) {
      const dist = haversine(riverPath[i - 1], riverPath[i]);
      distances.push(distances[i - 1] + dist);
    }

    // Get pollutant properties
    const pollutant = pollutantTypes[selectedPollutant];
    
    // Weather and environmental conditions
    const weather: WeatherConditions = { 
      wind_speed: windSpeed, 
      wind_direction: windDirection,
      precipitation: precipitation, 
      temperature: temperature,
      humidity: 70, 
      cloudCover: 30,
      solarRadiation: (100 - 30) * 10 // Simplified calculation based on cloud cover
    };
    
    // Calculate environmental modifiers
    const windFactor = 1 + (0.05 * weather.wind_speed * 
      Math.abs(Math.cos(((weather.wind_direction - 180) % 360) * Math.PI / 180))); // Wind along/against flow direction
    const precipitationFactor = 1 - (weather.precipitation * 0.02); // Precipitation reduces pollution density
    const temperatureFactor = 1 + ((weather.temperature - 25) * 0.01); // Higher temperatures increase reaction rates
    const radiationFactor = 1 - (weather.solarRadiation * 0.0001 * pollutant.decayRate); // Solar radiation aids in photodegradation
    
    const sourceCharacteristics = riverPath[sourceIndex].characteristics;
    
    // Calculate effective velocity considering all factors
    const baseVelocity = flowVelocity * (1 - sourceCharacteristics.flowResistance);
    const effectiveVelocity = baseVelocity * windFactor * precipitationFactor;
    
    // Define threshold density as 10% of initial
    const thresholdDensity = initialDensity * 0.1;
    const pollutionData: any[] = [];
    let thresholdIndex: number | null = null;
    
    // Sensor locations for monitoring - using a subset of river points
    const sensorLocations = [0, 2, 5, 8, riverPath.length - 1]; // Indices of monitoring stations
    const sensorReadings: { location: string; density: number; arrivalTime: number; qualityImpact: string }[] = [];

    for (let i = 0; i < riverPath.length; i++) {
      let density = 0;
      let timeHours = 0;
      let waterQualityImpact = "None";

      if (i >= sourceIndex) {
        // Distance from source in km
        const distanceKm = distances[i] - distances[sourceIndex];
        
        // Calculate time to reach this point considering variable velocity
        // For more accuracy, we calculate segment by segment
        let cumulativeTime = 0;
        let prevIndex = sourceIndex;
        
        for (let j = sourceIndex + 1; j <= i; j++) {
          const segmentDistance = distances[j] - distances[j - 1];
          const upstreamCharacteristics = riverPath[j - 1].characteristics;
          const downstreamCharacteristics = riverPath[j].characteristics;
          
          // Average characteristics for the segment
          const avgWidth = (upstreamCharacteristics.width + downstreamCharacteristics.width) / 2;
          const avgDepth = (upstreamCharacteristics.depth + downstreamCharacteristics.depth) / 2;
          const avgResistance = (upstreamCharacteristics.flowResistance + downstreamCharacteristics.flowResistance) / 2;
          
          // Adjust velocity for this specific segment
          const elevationChange = (riverPath[j].elevation || 0) - (riverPath[j-1].elevation || 0);
          const elevationFactor = 1 + (elevationChange * 0.01); // Steeper segments increase velocity
          
          const segmentVelocity = baseVelocity * (1 - avgResistance) * elevationFactor * windFactor;
          const segmentTimeHours = (segmentDistance * 1000) / (segmentVelocity * 3600);
          
          cumulativeTime += segmentTimeHours;
        }
        
        timeHours = cumulativeTime;
        
        // Current point characteristics
        const currentCharacteristics = riverPath[i].characteristics;
        
        // Calculate dilution factor with more sophisticated approach
        // Consider cross-sectional area changes, river morphology, and mixing zones
        const crossSectionalAreaRatio = (sourceCharacteristics.width * sourceCharacteristics.depth) / 
                                       (currentCharacteristics.width * currentCharacteristics.depth);
        
        // Enhanced dilution model including river characteristics and distance
        const dilutionBase = crossSectionalAreaRatio * Math.exp(-0.1 * distanceKm);
        
        // Adjust for temperature effects on diffusion
        const temperatureDiffusionFactor = 1 + ((weather.temperature - 25) * 0.02 * pollutant.diffusionCoefficient);
        
        // Adjust for turbulence in the flow
        const turbulenceFactor = 1 + (0.05 * (1 - currentCharacteristics.flowResistance));
        
        // Combined dilution factor
        const dilutionFactor = dilutionBase * temperatureDiffusionFactor * turbulenceFactor;
        
        // Calculate trapping/retention in the riverbed and vegetation
        // Affected by pollutant properties, river characteristics, and flow conditions
        const vegetationTrapping = currentCharacteristics.vegetation * pollutant.adsorptionRate * 0.2;
        const sedimentTrapping = currentCharacteristics.benthicDeposition * pollutant.adsorptionRate * 0.3;
        const bankTrapping = trappingRate * 0.5;
        
        // Calculate density-dependent settling for the pollutant
        const densitySettling = Math.max(0, (pollutant.densityRelativeToWater - 1) * 0.1);
        
        // Combined trapping factor
        const combinedTrappingRate = vegetationTrapping + sedimentTrapping + bankTrapping + densitySettling;
        
        // Natural decay of pollutant over time (biodegradation, chemical breakdown)
        const naturalDecay = pollutant.decayRate * timeHours * temperatureFactor * radiationFactor;
        
        // Calculate trapping factor
        const trappingFactor = Math.exp(-combinedTrappingRate * distanceKm);
        
        // Calculate decay factor
        const decayFactor = Math.exp(-naturalDecay);
        
        // Compute final density at this point
        density = initialDensity * dilutionFactor * trappingFactor * decayFactor * precipitationFactor;
        
        // Determine water quality impact based on density relative to toxicity threshold
        const relativeImpact = density / (pollutant.toxicityThreshold * 1500);
        if (relativeImpact < 0.2) waterQualityImpact = "Minimal";
        else if (relativeImpact < 0.5) waterQualityImpact = "Low";
        else if (relativeImpact < 1.0) waterQualityImpact = "Moderate";
        else if (relativeImpact < 2.0) waterQualityImpact = "High";
        else waterQualityImpact = "Severe";
        
        // Record when we first cross below threshold
        if (density <= thresholdDensity && thresholdIndex === null && i > sourceIndex) {
          thresholdIndex = i;
        }
        
        // Record data for sensor locations
        if (sensorLocations.includes(i)) {
          sensorReadings.push({
            location: riverPath[i].name,
            density: Math.max(density, 0),
            arrivalTime: timeHours,
            qualityImpact: waterQualityImpact
          });
        }
      }

      // Store comprehensive data for each point
      pollutionData.push({
        point: riverPath[i],
        density: Math.max(density, 0),
        distance: distances[i],
        time: timeHours,
        waterQualityImpact: waterQualityImpact,
        dissolvedOxygen: i >= sourceIndex ? 
          Math.max(0, riverPath[i].characteristics.dissolved_oxygen - (density/initialDensity * 2)) : 
          riverPath[i].characteristics.dissolved_oxygen,
        pH: i >= sourceIndex ? 
          riverPath[i].characteristics.pH - (density/initialDensity * 0.5) : 
          riverPath[i].characteristics.pH,
        turbidity: i >= sourceIndex ? 
          riverPath[i].characteristics.turbidity + (density/initialDensity * 15) : 
          riverPath[i].characteristics.turbidity
      });
    }

    // If threshold never reached, set to last point
    if (thresholdIndex === null) {
      thresholdIndex = riverPath.length - 1;
    }
    
    // Calculate environmental impact metrics
    const environmentalImpact = (pollutionData[pollutionData.length - 1].density / initialDensity) * 
                               10 * pollutant.bioaccumulation * 
                               (1 - Math.min(1, (riverPath[riverPath.length - 1].characteristics.dissolved_oxygen / 8)));
    
    // Estimate remediation time - dependent on pollutant type and environmental conditions
    const remediationTime = pollutionData[thresholdIndex].time * 
                           (3 + 5 * (1 - pollutant.decayRate)) * 
                           (1 + 0.5 * pollutant.bioaccumulation);
    
    // Estimate affected species based on river health metrics and toxicity
    const baseSpeciesCount = 15; // Baseline number of significant species
    const affectedSpecies = Math.round(baseSpeciesCount * 
                           Math.min(1, (environmentalImpact * pollutant.toxicityThreshold) / 5));
    
    // Set complete results
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
      sensorReadings: sensorReadings
    });
  }

  useEffect(() => {
    calculatePollutionSpread();
  }, [sourceIndex, selectedPollutant, flowVelocity, windSpeed, windDirection, initialDensity, trappingRate, temperature, precipitation]);

  // Draw the data visualization charts
  useEffect(() => {
    if (!results || !svgRef.current) return;

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Select data series based on view mode
    let dataKey = 'density';
    let yAxisLabel = 'Pollution Density';
    let lineColor = 'steelblue';
    
    if (viewMode === 'oxygen') {
      dataKey = 'dissolvedOxygen';
      yAxisLabel = 'Dissolved Oxygen (mg/L)';
      lineColor = '#00cc66';
    } else if (viewMode === 'ph') {
      dataKey = 'pH';
      yAxisLabel = 'pH Level';
      lineColor = '#9933cc';
    } else if (viewMode === 'turbidity') {
      dataKey = 'turbidity';
      yAxisLabel = 'Turbidity (NTU)';
      lineColor = '#ff9900';
    } else if (viewMode === 'time') {
      dataKey = 'time';
      yAxisLabel = 'Travel Time (hours)';
      lineColor = '#ff3333';
    }

    // Prepare data series that corresponds to polluted segments only
    const chartData = results.pollutionData.filter((d: any) => d.distance >= results.distances[sourceIndex]);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(chartData.map((d: any) => d.distance - results.distances[sourceIndex])) || 0])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData.map((d: any) => d[dataKey])) || 0])
      .range([height - margin.bottom, margin.top]);

    // Create line generator
    const line = d3.line()
      .x((d: any) => xScale(d.distance - results.distances[sourceIndex]))
      .y((d: any) => yScale(d[dataKey]))
      .curve(d3.curveMonotoneX);

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width - margin.right)
      .attr('y', -10)
      .attr('fill', 'black')
      .text('Distance from Source (km)');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -margin.top - 100)
      .attr('fill', 'black')
      .text(yAxisLabel);

    // Draw line path
    svg
      .append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2)
      .attr('d', line as any);

    // Add area under the curve for density graph
    if (viewMode === 'density') {
      const area = d3.area()
        .x((d: any) => xScale(d.distance - results.distances[sourceIndex]))
        .y0(height - margin.bottom)
        .y1((d: any) => yScale(d.density))
        .curve(d3.curveMonotoneX);

      svg
        .append('path')
        .datum(chartData)
        .attr('fill', 'steelblue')
        .attr('fill-opacity', 0.2)
        .attr('d', area as any);
    }

    // Add dots for data points
    svg
      .selectAll('circle')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('cx', (d: any) => xScale(d.distance - results.distances[sourceIndex]))
      .attr('cy', (d: any) => yScale(d[dataKey]))
      .attr('r', 3)
      .attr('fill', lineColor);

    // Add threshold line for density view
    if (viewMode === 'density') {
      const thresholdValue = results.pollutionData[sourceIndex].density * 0.1;
      
      svg
        .append('line')
        .attr('x1', margin.left)
        .attr('y1', yScale(thresholdValue))
        .attr('x2', width - margin.right)
        .attr('y2', yScale(thresholdValue))
        .attr('stroke', 'red')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5');
        
      svg
        .append('text')
        .attr('x', margin.left + 10)
        .attr('y', yScale(thresholdValue) - 5)
        .attr('fill', 'red')
        .attr('font-size', 12)
        .text('Threshold (10%)');
    }

    // Add markers for source and threshold points
    svg
      .append('circle')
      .attr('cx', xScale(0))
      .attr('cy', yScale(chartData[0][dataKey]))
      .attr('r', 5)
      .attr('fill', 'red');

    const thresholdIndex = results.pollutedSegment.length - 1;
    const thresholdDistance = 
      results.pollutionData.find((d: any) => d.point.id === results.thresholdPoint.id)?.distance - 
      results.distances[sourceIndex];
      
    if (thresholdDistance) {
      const thresholdY = results.pollutionData.find((d: any) => d.point.id === results.thresholdPoint.id)?.[dataKey] || 0;
      
      svg
        .append('circle')
        .attr('cx', xScale(thresholdDistance))
        .attr('cy', yScale(thresholdY))
        .attr('r', 5)
        .attr('fill', 'green');
    }

    // Add tooltips for important points
    const tooltipData = [
      { label: 'Source', x: 0, y: chartData[0][dataKey], color: 'red' },
      { label: 'Threshold Point', x: thresholdDistance || 0, 
        y: results.pollutionData.find((d: any) => d.point.id === results.thresholdPoint.id)?.[dataKey] || 0, 
        color: 'green' }
    ];

    tooltipData.forEach(point => {
      svg
        .append('text')
        .attr('x', xScale(point.x))
        .attr('y', yScale(point.y) - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('fill', point.color)
        .text(point.label);
    });
  }, [results, viewMode, sourceIndex]);

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Advanced Pollution Prediction Model</CardTitle>
          <CardDescription>
            Simulate the spread of pollutants through the Selangor River system with advanced hydrodynamic modeling
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
                {selectedLocation && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
                    <p><strong>Selected Location:</strong> {riverPath.find(p => p.id === selectedLocation)?.name}</p>
                    <p><strong>Description:</strong> {riverPath.find(p => p.id === selectedLocation)?.description}</p>
                    <p><strong>Characteristics:</strong> Width: {riverPath.find(p => p.id === selectedLocation)?.characteristics.width}m, 
                       Depth: {riverPath.find(p => p.id === selectedLocation)?.characteristics.depth}m</p>
                    <p><strong>Water Quality:</strong> DO: {riverPath.find(p => p.id === selectedLocation)?.characteristics.dissolved_oxygen} mg/L, 
                       pH: {riverPath.find(p => p.id === selectedLocation)?.characteristics.pH}</p>
                  </div>
                )}
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
                {selectedPollutant && (
                  <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-md text-sm text-rose-700">
                    <p><strong>Pollutant:</strong> {pollutantTypes[selectedPollutant].name}</p>
                    <p><strong>Decay Rate:</strong> {pollutantTypes[selectedPollutant].decayRate.toFixed(3)} (higher = faster natural breakdown)</p>
                    <p><strong>Bioaccumulation:</strong> {pollutantTypes[selectedPollutant].bioaccumulation.toFixed(1)} (higher = greater ecological impact)</p>
                  </div>
                )}
              </div>
            </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <h4 className="font-semibold text-amber-800 mb-2">Monitoring Data</h4>
                    {results.sensorReadings.map((sensor, idx) => (
                      <div key={idx} className="mb-1">
                        <span>{sensor.location}: </span>
                        <span className={
                          sensor.qualityImpact === "Severe" ? "text-red-600 font-bold" : 
                          sensor.qualityImpact === "High" ? "text-red-500" : 
                          sensor.qualityImpact === "Moderate" ? "text-amber-500" : 
                          sensor.qualityImpact === "Low" ? "text-amber-400" : "text-green-500"
                        }>
                          {sensor.qualityImpact}
                        </span>
                        <span className="text-xs ml-1">({sensor.arrivalTime.toFixed(1)}h)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Tabs defaultValue="map" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="map" className="flex items-center gap-1">
                        <AreaChart className="h-4 w-4" />
                        River Map
                      </TabsTrigger>
                      <TabsTrigger value="chart" className="flex items-center gap-1">
                        <LineChart className="h-4 w-4" />
                        Data Charts
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="map" className="space-y-4">
                      <RiverMap results={results} riverPath={riverPath} />
                    </TabsContent>
                    <TabsContent value="chart" className="space-y-4">
                      <div className="flex justify-center mb-4">
                        <div className="inline-flex rounded-md shadow-sm">
                          <button
                            onClick={() => setViewMode('density')}
                            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                              viewMode === 'density' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            } border border-gray-200`}
                          >
                            Density
                          </button>
                          <button
                            onClick={() => setViewMode('oxygen')}
                            className={`px-4 py-2 text-sm font-medium ${
                              viewMode === 'oxygen' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            } border-t border-b border-gray-200`}
                          >
                            Dissolved Oxygen
                          </button>
                          <button
                            onClick={() => setViewMode('ph')}
                            className={`px-4 py-2 text-sm font-medium ${
                              viewMode === 'ph' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            } border-t border-b border-gray-200`}
                          >
                            pH
                          </button>
                          <button
                            onClick={() => setViewMode('turbidity')}
                            className={`px-4 py-2 text-sm font-medium ${
                              viewMode === 'turbidity' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            } border-t border-b border-gray-200`}
                          >
                            Turbidity
                          </button>
                          <button
                            onClick={() => setViewMode('time')}
                            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                              viewMode === 'time' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            } border border-gray-200`}
                          >
                            Travel Time
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="w-full overflow-x-auto">
                          <svg ref={svgRef} width={800} height={400}></svg>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
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
