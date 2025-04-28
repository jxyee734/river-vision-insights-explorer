
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGPS } from '@/hooks/useGPS';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FileChartColumn, Map, MapPin } from 'lucide-react';

interface SatelliteReportProps {
  data: {
    averageDepth: number;
    maxDepth: number;
    averageVelocity: number;
    trashCount: number;
    trashCategories: string[];
    environmentalImpact: string;
  };
}

const SatelliteReport: React.FC<SatelliteReportProps> = ({ data }) => {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const { location } = useGPS();
  const [mapboxToken, setMapboxToken] = React.useState('');

  React.useEffect(() => {
    if (!mapContainer.current || !location || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [location.longitude, location.latitude],
      zoom: 15
    });

    // Add marker for current location
    new mapboxgl.Marker()
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [location, mapboxToken]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Location & Satellite View
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!mapboxToken ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please enter your Mapbox public token to view the satellite map.
                  You can get one from <a href="https://mapbox.com" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">mapbox.com</a>
                </p>
                <input
                  type="text"
                  placeholder="Enter Mapbox public token"
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => setMapboxToken(e.target.value)}
                />
              </div>
            ) : null}
            <div className="h-[300px] relative rounded-lg overflow-hidden">
              <div ref={mapContainer} className="absolute inset-0" />
            </div>
            {location && (
              <div className="mt-4 flex items-start gap-2">
                <MapPin className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <p className="font-medium">Current Location</p>
                  <p className="text-sm text-muted-foreground">
                    Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileChartColumn className="h-5 w-5" />
              Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Depth</p>
                  <p className="text-lg font-medium">{data.averageDepth.toFixed(2)}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maximum Depth</p>
                  <p className="text-lg font-medium">{data.maxDepth.toFixed(2)}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flow Velocity</p>
                  <p className="text-lg font-medium">{data.averageVelocity.toFixed(2)}m/s</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trash Items</p>
                  <p className="text-lg font-medium">{data.trashCount}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Trash Categories</p>
                <div className="flex flex-wrap gap-2">
                  {data.trashCategories.map((category, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Environmental Impact</p>
                <p className="text-sm border-l-2 border-blue-500 pl-3">
                  {data.environmentalImpact}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SatelliteReport;
