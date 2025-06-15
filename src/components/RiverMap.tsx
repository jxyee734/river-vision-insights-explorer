
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon which is a common issue with bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// For a larger app, these should be in a central types file.
interface RiverPoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
}

interface PollutionResults {
  sourcePoint: RiverPoint;
  thresholdPoint: RiverPoint;
  pollutedSegment: RiverPoint[];
}

interface RiverMapProps {
  results: PollutionResults | null;
  riverPath: RiverPoint[];
}

// A component to automatically fit the map bounds to the river path
const ChangeView: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    console.log('ChangeView: Setting bounds', bounds);
    try {
      if (bounds && map) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (error) {
      console.error('Error setting map bounds:', error);
    }
  }, [map, bounds]);
  
  return null;
};

const RiverMap: React.FC<RiverMapProps> = ({ results, riverPath }) => {
  console.log('RiverMap props:', { results, riverPathLength: riverPath.length });
  
  if (!results) {
    console.log('RiverMap: No results, showing placeholder');
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-md text-sm text-gray-500 border">
        <div className="text-center">
          <p className="mb-2">🗺️ Map will appear here</p>
          <p>Waiting for prediction results to display map...</p>
        </div>
      </div>
    );
  }
  
  console.log('RiverMap: Rendering map with results');
  
  try {
    const riverPathPositions: L.LatLngExpression[] = riverPath.map(p => {
      console.log('River point:', p.name, p.lat, p.lon);
      return [p.lat, p.lon];
    });
    
    const pollutedSegmentPositions: L.LatLngExpression[] = results.pollutedSegment.map(p => {
      console.log('Polluted segment point:', p.name, p.lat, p.lon);
      return [p.lat, p.lon];
    });

    const bounds = L.latLngBounds(riverPathPositions as L.LatLngTuple[]);
    console.log('Map bounds:', bounds);

    return (
      <div className="w-full h-[400px] border rounded-md overflow-hidden bg-gray-50 relative">
        <MapContainer 
          style={{ height: '100%', width: '100%', minHeight: '400px' }} 
          center={[3.33, 101.28]} 
          zoom={11} 
          scrollWheelZoom={true}
          className="z-0"
        >
          <ChangeView bounds={bounds} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* River path line */}
          <Polyline 
            pathOptions={{ color: 'blue', weight: 4, opacity: 0.6 }} 
            positions={riverPathPositions} 
          />

          {/* Polluted segment highlighting */}
          {pollutedSegmentPositions.length > 0 && (
            <Polyline 
              pathOptions={{ color: 'red', weight: 6, opacity: 0.8 }} 
              positions={pollutedSegmentPositions} 
            />
          )}

          {/* Source marker */}
          <Marker position={[results.sourcePoint.lat, results.sourcePoint.lon]}>
            <Popup>
              <div className="text-center">
                <strong>🏭 Pollution Source</strong><br />
                {results.sourcePoint.name}
              </div>
            </Popup>
          </Marker>

          {/* Threshold marker */}
          <Marker position={[results.thresholdPoint.lat, results.thresholdPoint.lon]}>
            <Popup>
              <div className="text-center">
                <strong>🎯 Threshold Reached</strong><br />
                {results.thresholdPoint.name}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
        
        {/* Map legend */}
        <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-md text-xs z-10">
          <div className="flex items-center mb-1">
            <div className="w-4 h-1 bg-blue-500 opacity-60 mr-2"></div>
            <span>River Path</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-1 bg-red-500 mr-2"></div>
            <span>Polluted Segment</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span>Source & Threshold</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering RiverMap:', error);
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-red-50 rounded-md text-sm text-red-600 border border-red-200">
        <div className="text-center">
          <p className="mb-2">⚠️ Map Error</p>
          <p>Unable to render map. Please check console for details.</p>
        </div>
      </div>
    );
  }
};

export default RiverMap;
