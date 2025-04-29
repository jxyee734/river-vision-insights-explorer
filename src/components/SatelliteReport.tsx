
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGPS } from '@/hooks/useGPS';
import { Badge } from '@/components/ui/badge';
import { FileChartColumn, Map, MapPin, Droplet, Water, TestTubes } from 'lucide-react';

interface SatelliteReportProps {
  data: {
    averageDepth: number;
    maxDepth: number;
    averageVelocity: number;
    trashCount: number;
    trashCategories: string[];
    environmentalImpact: string;
    // Add new water quality parameters
    phValue?: number;
    bodLevel?: number;
    ammoniacalNitrogen?: number;
    suspendedSolids?: number;
  };
}

const SatelliteReport: React.FC<SatelliteReportProps> = ({ data }) => {
  const { location } = useGPS();

  // Determine water quality index based on parameters
  const getWaterQualityIndex = () => {
    // This is a simplified calculation
    if (!data.phValue || !data.bodLevel || !data.ammoniacalNitrogen || !data.suspendedSolids) {
      return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    }
    
    // Simplified WQI calculation
    const isGood = 
      data.phValue >= 6.5 && data.phValue <= 8.5 &&
      data.bodLevel < 3 &&
      data.ammoniacalNitrogen < 0.3 &&
      data.suspendedSolids < 50;
    
    const isModerate = 
      data.phValue >= 6.0 && data.phValue <= 9.0 &&
      data.bodLevel < 6 &&
      data.ammoniacalNitrogen < 0.9 &&
      data.suspendedSolids < 150;
    
    if (isGood) return { label: "Good", color: "bg-green-100 text-green-800" };
    if (isModerate) return { label: "Moderate", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Poor", color: "bg-red-100 text-red-800" };
  };

  const waterQuality = getWaterQualityIndex();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Location & Map View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] relative rounded-lg overflow-hidden">
              {location && (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                  style={{ border: '1px solid #ddd', borderRadius: '0.5rem' }}
                />
              )}
            </div>
            {location && (
              <div className="mt-4 flex items-start gap-2">
                <MapPin className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <p className="font-medium">Current Location</p>
                  <p className="text-sm text-muted-foreground">
                    Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                  </p>
                  <a 
                    href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=15/${location.latitude}/${location.longitude}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View on OpenStreetMap
                  </a>
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
              
              {/* Water Quality Parameters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  <p className="font-medium">Water Quality</p>
                  <Badge className={waterQuality.color}>{waterQuality.label}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-muted-foreground">pH Value</p>
                    <p className="text-lg font-medium">{data.phValue ? data.phValue.toFixed(1) : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">BOD</p>
                    <p className="text-lg font-medium">{data.bodLevel ? `${data.bodLevel.toFixed(1)} mg/L` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NH₃-N</p>
                    <p className="text-lg font-medium">{data.ammoniacalNitrogen ? `${data.ammoniacalNitrogen.toFixed(2)} mg/L` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Suspended Solids</p>
                    <p className="text-lg font-medium">{data.suspendedSolids ? `${data.suspendedSolids.toFixed(1)} mg/L` : "N/A"}</p>
                  </div>
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
