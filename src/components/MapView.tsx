
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Flag, AlertTriangle } from 'lucide-react';
import { toast } from "sonner";

interface CleanupLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pollutionLevel: 'Good' | 'Moderate' | 'High' | 'Alert';
  cleanupComplete: boolean;
  lastUpdated: string;
}

const MapView: React.FC = () => {
  const [cleanupLocations, setCleanupLocations] = useState<CleanupLocation[]>([
    {
      id: '1',
      name: 'North River Bend',
      lat: 34.052,
      lng: -118.243,
      pollutionLevel: 'High',
      cleanupComplete: false,
      lastUpdated: '2025-03-15'
    },
    {
      id: '2',
      name: 'East River Crossing',
      lat: 34.058,
      lng: -118.235,
      pollutionLevel: 'Moderate',
      cleanupComplete: true,
      lastUpdated: '2025-04-10'
    },
    {
      id: '3',
      name: 'South River Junction',
      lat: 34.045,
      lng: -118.251,
      pollutionLevel: 'Alert',
      cleanupComplete: false,
      lastUpdated: '2025-04-22'
    },
    {
      id: '4',
      name: 'West River Shore',
      lat: 34.049,
      lng: -118.260,
      pollutionLevel: 'Good',
      cleanupComplete: true,
      lastUpdated: '2025-04-02'
    },
  ]);

  const markAsComplete = (id: string) => {
    setCleanupLocations(locations => 
      locations.map(loc => 
        loc.id === id ? { ...loc, cleanupComplete: true, lastUpdated: new Date().toISOString().split('T')[0] } : loc
      )
    );
    toast.success("Location marked as cleaned successfully!");
  };

  const getPollutionBadgeColor = (level: string) => {
    switch(level) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Alert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>River Cleanup Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 rounded-lg bg-gray-100 relative aspect-video flex items-center justify-center">
          <div className="text-gray-500 absolute">Interactive map will render here</div>
          
          {/* Map visualization */}
          <div className="absolute inset-0">
            <div className="absolute w-full h-full bg-blue-50 opacity-50 rounded-lg"></div>
            
            {cleanupLocations.map((location) => (
              <div 
                key={location.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  top: `${30 + Math.random() * 40}%`, 
                  left: `${20 + Math.random() * 60}%`
                }}
              >
                <div className={`flex flex-col items-center ${location.cleanupComplete ? 'opacity-60' : 'opacity-100'}`}>
                  {location.cleanupComplete ? (
                    <Check className="h-6 w-6 text-green-600 bg-white rounded-full p-1 shadow-md" />
                  ) : (
                    location.pollutionLevel === 'Alert' ? (
                      <AlertTriangle className="h-6 w-6 text-red-600 bg-white rounded-full p-1 shadow-md animate-pulse" />
                    ) : (
                      <Flag className="h-6 w-6 text-blue-600 bg-white rounded-full p-1 shadow-md" />
                    )
                  )}
                  <span className="mt-1 text-xs font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">{location.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Cleanup Locations</h3>
          <div className="space-y-2">
            {cleanupLocations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-start space-x-3">
                  <div>
                    <MapPin className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{location.name}</h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPollutionBadgeColor(location.pollutionLevel)}`}>
                        {location.pollutionLevel}
                      </span>
                      <span className="text-xs text-gray-500">Updated: {location.lastUpdated}</span>
                    </div>
                  </div>
                </div>
                <div>
                  {location.cleanupComplete ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <Check className="h-4 w-4 mr-1" /> 
                      <span>Cleaned</span>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => markAsComplete(location.id)}
                    >
                      Mark as Cleaned
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
            <h4 className="font-medium text-blue-700 mb-1">For NGOs and Government Agencies</h4>
            <p>
              Monitor river pollution levels and track cleanup operations. 
              Data from Gemini AI analysis helps prioritize interventions. 
              Contact our team for access to detailed analytics and reports.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapView;
