import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Database, RefreshCw, AlertCircle, BarChart2, ThermometerSnowflake, Droplet, CloudRain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { detectAnomalies } from '@/utils/aiDetection';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const sensorLocations = [
  { id: 'sensor-001', name: 'Sungai Klang - Water Quality Station', location: 'Kuala Lumpur', status: 'active' },
  { id: 'sensor-002', name: 'Sungai Gombak - Monitoring Station', location: 'Kuala Lumpur', status: 'active' },
  { id: 'sensor-003', name: 'Sungai Pinang - River Mouth', location: 'Penang', status: 'inactive' },
  { id: 'sensor-004', name: 'Sungai Kelantan - Northern Point', location: 'Kelantan', status: 'active' },
];

const sensorTypes = [
  { id: 'ph', name: 'pH Level', unit: 'pH', icon: <Droplet className="h-4 w-4" /> },
  { id: 'do', name: 'Dissolved Oxygen', unit: 'mg/L', icon: <CloudRain className="h-4 w-4" /> },
  { id: 'temp', name: 'Temperature', unit: '°C', icon: <ThermometerSnowflake className="h-4 w-4" /> },
  { id: 'turbidity', name: 'Turbidity', unit: 'NTU', icon: <BarChart2 className="h-4 w-4" /> },
  { id: 'conductivity', name: 'Conductivity', unit: 'µS/cm', icon: <AlertCircle className="h-4 w-4" /> },
];

const generateRealisticMockData = () => {
  let ph = 7.2 + (Math.random() * 0.3 - 0.15);
  let dissolvedOxygen = 7 + (Math.random() * 0.8 - 0.4);
  let temp = 28 + (Math.random() * 1 - 0.5);
  let turbidity = 30 + (Math.random() * 5);
  let conductivity = 250 + (Math.random() * 20);
  
  return Array(24).fill(null).map((_, i) => {
    ph += Math.random() * 0.2 - 0.1;
    if (i === 8 || i === 16) ph -= Math.random() * 1.5;
    ph = Math.max(4.5, Math.min(9.5, ph));
    
    dissolvedOxygen += Math.random() * 0.3 - 0.15;
    if (i >= 20 || i <= 5) dissolvedOxygen -= 0.8;
    dissolvedOxygen = Math.max(2, Math.min(10, dissolvedOxygen));
    
    temp += Math.random() * 0.3 - 0.15;
    if (i >= 10 && i <= 16) temp += 0.7;
    temp = Math.max(26, Math.min(33, temp));
    
    turbidity += Math.random() * 6 - 3;
    if (i === 12) turbidity += Math.random() * 80;
    turbidity = Math.max(10, Math.min(150, turbidity));
    
    conductivity += Math.random() * 15 - 7.5;
    if (i === 12 || i === 13) conductivity += Math.random() * 120;
    conductivity = Math.max(100, Math.min(500, conductivity));
    
    const hour = i.toString().padStart(2, '0') + ':00';
    return {
      time: hour,
      ph: parseFloat(ph.toFixed(2)),
      do: parseFloat(dissolvedOxygen.toFixed(2)),
      temp: parseFloat(temp.toFixed(1)),
      turbidity: parseFloat(turbidity.toFixed(1)),
      conductivity: parseFloat(conductivity.toFixed(1)),
    };
  });
};

const SensorTab: React.FC = () => {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>('sensor-001');
  const [selectedSensorType, setSelectedSensorType] = useState<string>('ph');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [sensorData, setSensorData] = useState<any[]>(generateRealisticMockData());
  const [realTimeEnabled, setRealTimeEnabled] = useState<boolean>(false);
  const [anomaly, setAnomaly] = useState<{isAnomaly: boolean; parameter?: string; message?: string; severity?: string} | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        setSensorData(generateRealisticMockData());
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (realTimeEnabled) {
      intervalId = setInterval(() => {
        setSensorData(currentData => {
          const lastPoint = currentData[currentData.length - 1];
          const newPoint = {
            time: new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'}),
            ph: Math.max(4, Math.min(9.5, lastPoint.ph + (Math.random() * 0.4 - 0.2))),
            do: Math.max(2, Math.min(10, lastPoint.do + (Math.random() * 0.6 - 0.3))),
            temp: Math.max(26, Math.min(33, lastPoint.temp + (Math.random() * 0.4 - 0.2))),
            turbidity: Math.max(10, Math.min(150, lastPoint.turbidity + (Math.random() * 6 - 3))),
            conductivity: Math.max(100, Math.min(500, lastPoint.conductivity + (Math.random() * 15 - 7.5))),
          };
          return [...currentData.slice(-23), newPoint];
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [realTimeEnabled]);

  const handleRefresh = () => {
    setSensorData(generateRealisticMockData());
    toast({
      title: 'Data Refreshed',
      description: 'Sensor data has been successfully updated.',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>IoT Sensor Data</CardTitle>
        <CardDescription>Real-time monitoring of water quality sensors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sensor Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {sensorLocations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sensor Type</Label>
              <Select value={selectedSensorType} onValueChange={setSelectedSensorType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sensor type" />
                </SelectTrigger>
                <SelectContent>
                  {sensorTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center">
                        {type.icon}
                        <span className="ml-2">{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="real-time" checked={realTimeEnabled} onCheckedChange={setRealTimeEnabled} />
              <Label htmlFor="real-time">Real-time Data</Label>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={selectedSensorType} stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensorTab;