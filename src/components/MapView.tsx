
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { NasaCard } from './NasaCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

// Sample data points for the map
const SAMPLE_DATA_POINTS = [
  {
    id: 1,
    name: "Mississippi River Cleanup Site",
    location: { lat: 38.6270, lng: -90.1994 },
    quality: "Poor",
    pollutants: ["Plastics", "Industrial waste"],
    lastUpdated: "2025-04-15",
  },
  {
    id: 2,
    name: "Columbia River Monitoring Station",
    location: { lat: 45.7060, lng: -121.7980 },
    quality: "Good",
    pollutants: ["Agricultural runoff"],
    lastUpdated: "2025-04-20",
  },
  {
    id: 3,
    name: "Colorado River Testing Site",
    location: { lat: 36.0986, lng: -112.0998 },
    quality: "Moderate",
    pollutants: ["Sediment", "Nutrient pollution"],
    lastUpdated: "2025-04-18",
  },
];

interface MapViewProps {
  selectedLocation?: {lat: number, lng: number, name: string} | null;
}

const MapView: React.FC<MapViewProps> = ({ selectedLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapTab, setMapTab] = useState<string>('satellite');
  const [selectedPoint, setSelectedPoint] = useState<typeof SAMPLE_DATA_POINTS[0] | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    const mapboxToken = 'pk.eyJ1IjoicnVubmVic2siLCJhIjoiY2txenN4ZHdhMDh3ZTMwcGJnbXc3c2loaCJ9.vpzE5NhN1JhkHNK9cmekHQ';
    
    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapTab === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/outdoors-v12',
      center: selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : [-95.7129, 37.0902],
      zoom: selectedLocation ? 12 : 3,
      pitch: 45,
    });
    
    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl());
    
    // Add markers when map loads
    map.current.on('load', () => {
      // Clear any existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add data points as markers
      SAMPLE_DATA_POINTS.forEach(point => {
        const markerElement = document.createElement('div');
        markerElement.className = 'flex flex-col items-center';
        
        const dotElement = document.createElement('div');
        dotElement.className = `w-4 h-4 rounded-full shadow-lg animate-pulse ${
          point.quality === 'Good' ? 'bg-green-500' : 
          point.quality === 'Moderate' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`;
        markerElement.appendChild(dotElement);
        
        // Create the marker
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([point.location.lng, point.location.lat])
          .addTo(map.current!);
          
        // Add click event
        markerElement.addEventListener('click', () => {
          setSelectedPoint(point);
          
          // Center map on the selected point
          map.current?.flyTo({
            center: [point.location.lng, point.location.lat],
            zoom: 13,
            speed: 0.8
          });
        });
        
        markersRef.current.push(marker);
      });
      
      // Add selected location marker if provided
      if (selectedLocation) {
        const markerElement = document.createElement('div');
        markerElement.className = 'flex flex-col items-center';
        
        const dotElement = document.createElement('div');
        dotElement.className = 'w-5 h-5 rounded-full bg-blue-500 shadow-lg animate-pulse';
        markerElement.appendChild(dotElement);
        
        // Create pulsing dot
        const pulseElement = document.createElement('div');
        pulseElement.className = 'w-12 h-12 rounded-full bg-blue-500/20 absolute -top-4 -left-4 animate-ping';
        markerElement.appendChild(pulseElement);
        
        // Create the live marker
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([selectedLocation.lng, selectedLocation.lat])
          .setPopup(new mapboxgl.Popup({ closeButton: false })
            .setHTML(`<div class="text-sm font-medium">${selectedLocation.name}</div><div class="text-xs">Live Stream</div>`))
          .addTo(map.current!);
          
        marker.togglePopup(); // Show popup by default
        markersRef.current.push(marker);
        
        // Add a point highlight
        map.current.addSource('selected-point', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'Point',
              'coordinates': [selectedLocation.lng, selectedLocation.lat]
            }
          }
        });
        
        map.current.addLayer({
          'id': 'selected-point-glow',
          'type': 'circle',
          'source': 'selected-point',
          'paint': {
            'circle-radius': 20,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.15
          }
        });
      }
    });
    
    return () => {
      map.current?.remove();
    };
  }, [mapTab, selectedLocation]);
  
  // Update map style when tab changes
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(
        mapTab === 'satellite' 
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : 'mapbox://styles/mapbox/outdoors-v12'
      );
    }
  }, [mapTab]);
  
  // Update map when selected location changes
  useEffect(() => {
    if (map.current && selectedLocation) {
      map.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 14,
        speed: 0.8
      });
    }
  }, [selectedLocation]);

  return (
    <NasaCard
      title="River Monitoring Network"
      description="Interactive Geographic Information System"
      gradient
      glassmorphism
      className="w-full"
    >
      <div className="mb-4">
        <Tabs value={mapTab} onValueChange={setMapTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="satellite">Satellite View</TabsTrigger>
            <TabsTrigger value="terrain">Terrain View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="relative h-[500px] rounded-lg overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0" />
        
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm p-3 rounded-lg max-w-[240px]">
          <h3 className="text-white text-sm font-medium mb-1">River Monitoring Network</h3>
          <p className="text-gray-300 text-xs">View water quality monitoring stations and live stream locations</p>
        </div>
        
        {selectedPoint && (
          <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-[300px] border border-gray-200">
            <h3 className="font-medium mb-2">{selectedPoint.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Water Quality:</span>
                <Badge variant={
                  selectedPoint.quality === 'Good' ? 'outline' : 
                  selectedPoint.quality === 'Moderate' ? 'secondary' : 
                  'destructive'
                }>
                  {selectedPoint.quality}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Pollutants:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPoint.pollutants.map((pollutant, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {pollutant}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated:</span>
                <span>{selectedPoint.lastUpdated}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Map displays river monitoring stations and environmental data collection points. Click on markers to view detailed information about each location.</p>
        {selectedLocation && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded">
            <p className="font-medium text-blue-700">Currently viewing: {selectedLocation.name}</p>
            <p className="text-xs text-blue-600">Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>
          </div>
        )}
      </div>
    </NasaCard>
  );
};

export default MapView;
