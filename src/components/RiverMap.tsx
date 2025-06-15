
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
const ChangeView = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);
  return null;
}

const RiverMap: React.FC<RiverMapProps> = ({ results, riverPath }) => {
  if (!results) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-md text-sm text-gray-500">
        Waiting for prediction results to display map...
      </div>
    );
  }
  
  const riverPathPositions: L.LatLngExpression[] = riverPath.map(p => [p.lat, p.lon]);
  const pollutedSegmentPositions: L.LatLngExpression[] = results.pollutedSegment.map(p => [p.lat, p.lon]);

  const bounds = L.latLngBounds(riverPathPositions as L.LatLngTuple[]);

  return (
    <div className="rounded-md overflow-hidden border">
      <MapContainer style={{ height: '400px', width: '100%' }} center={[3.33, 101.28]} zoom={11} scrollWheelZoom={false}>
        <ChangeView bounds={bounds} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Polyline pathOptions={{ color: 'blue', weight: 4, opacity: 0.6 }} positions={riverPathPositions} />

        {pollutedSegmentPositions.length > 0 && (
          <Polyline pathOptions={{ color: 'red', weight: 6 }} positions={pollutedSegmentPositions} />
        )}

        <Marker position={[results.sourcePoint.lat, results.sourcePoint.lon]}>
          <Popup>
            <strong>Source:</strong> {results.sourcePoint.name}
          </Popup>
        </Marker>

        <Marker position={[results.thresholdPoint.lat, results.thresholdPoint.lon]}>
          <Popup>
            <strong>Threshold Reached:</strong> {results.thresholdPoint.name}
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
};

export default RiverMap;
