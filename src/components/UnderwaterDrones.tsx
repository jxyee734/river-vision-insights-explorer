import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Ship,
  MapPin,
  Navigation,
  Battery,
  Wifi,
  Camera,
  Thermometer,
  Droplet,
  Fish,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface DroneStatus {
  id: string;
  name: string;
  location: { lat: number; lng: number; depth: number };
  battery: number;
  status: "active" | "standby" | "maintenance" | "mission";
  signal: number;
  lastUpdate: string;
}

interface SensorReading {
  timestamp: string;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  turbidity: number;
  depth: number;
  pressure: number;
}

interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  depth: number;
  duration: number;
  action: "sample" | "record" | "monitor" | "survey";
  notes?: string;
}

interface Mission {
  id: string;
  name: string;
  description?: string;
  waypoints: Waypoint[];
  status: "pending" | "active" | "completed" | "paused";
  progress: number;
  estimatedTime: number;
  startTime?: string;
  createdAt: string;
  priority: "low" | "medium" | "high";
}

const mockDrones: DroneStatus[] = [
  {
    id: "drone-001",
    name: "AquaBot Alpha",
    location: { lat: 3.139, lng: 101.6869, depth: 5.2 },
    battery: 87,
    status: "active",
    signal: 95,
    lastUpdate: "2 min ago",
  },
  {
    id: "drone-002",
    name: "DeepScan Beta",
    location: { lat: 3.1395, lng: 101.6875, depth: 8.1 },
    battery: 62,
    status: "mission",
    signal: 78,
    lastUpdate: "1 min ago",
  },
  {
    id: "drone-003",
    name: "HydroProbe Gamma",
    location: { lat: 3.1385, lng: 101.6863, depth: 3.5 },
    battery: 23,
    status: "standby",
    signal: 89,
    lastUpdate: "5 min ago",
  },
];

const generateSensorData = (): SensorReading[] => {
  return Array(20)
    .fill(null)
    .map((_, i) => {
      const time = new Date(Date.now() - (19 - i) * 60000);
      return {
        timestamp: time.toLocaleTimeString(),
        temperature: 24 + Math.random() * 4 + Math.sin(i * 0.3) * 2,
        ph: 7.0 + Math.random() * 1.5 + Math.sin(i * 0.2) * 0.5,
        dissolved_oxygen: 6 + Math.random() * 2 + Math.cos(i * 0.4) * 1,
        turbidity: 15 + Math.random() * 10 + Math.sin(i * 0.5) * 5,
        depth: 5 + Math.random() * 3 + Math.cos(i * 0.3) * 2,
        pressure: 1.5 + Math.random() * 0.5 + Math.sin(i * 0.1) * 0.2,
      };
    });
};

const UnderwaterDrones: React.FC = () => {
  const { toast } = useToast();
  const [selectedDrone, setSelectedDrone] = useState<string>("drone-001");
  const [drones, setDrones] = useState<DroneStatus[]>(mockDrones);
  const [sensorData, setSensorData] =
    useState<SensorReading[]>(generateSensorData());
  const [autoDeployment, setAutoDeployment] = useState<boolean>(false);
  const [missionPlanning, setMissionPlanning] = useState<boolean>(false);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: "mission-001",
      name: "Water Quality Survey - Klang River",
      description: "Comprehensive water quality monitoring along Klang River",
      waypoints: [
        {
          id: "wp-001",
          lat: 3.139,
          lng: 101.6869,
          depth: 3,
          duration: 300,
          action: "sample",
          notes: "Initial sampling point near bridge",
        },
        {
          id: "wp-002",
          lat: 3.1395,
          lng: 101.6875,
          depth: 5,
          duration: 600,
          action: "monitor",
          notes: "Deep monitoring for pollutant detection",
        },
        {
          id: "wp-003",
          lat: 3.14,
          lng: 101.688,
          depth: 4,
          duration: 400,
          action: "record",
          notes: "Video recording of riverbed conditions",
        },
      ],
      status: "pending",
      progress: 0,
      estimatedTime: 1300,
      createdAt: new Date().toISOString(),
      priority: "medium",
    },
  ]);

  // Mission planning states
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [newMission, setNewMission] = useState<Partial<Mission>>({
    name: "",
    description: "",
    waypoints: [],
    priority: "medium",
  });
  const [newWaypoint, setNewWaypoint] = useState<Partial<Waypoint>>({
    lat: 3.139,
    lng: 101.6869,
    depth: 3,
    duration: 300,
    action: "sample",
    notes: "",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Update sensor data
      setSensorData((prev) => {
        const newReading: SensorReading = {
          timestamp: new Date().toLocaleTimeString(),
          temperature: 24 + Math.random() * 4,
          ph: 7.0 + Math.random() * 1.5,
          dissolved_oxygen: 6 + Math.random() * 2,
          turbidity: 15 + Math.random() * 10,
          depth: 5 + Math.random() * 3,
          pressure: 1.5 + Math.random() * 0.5,
        };
        return [...prev.slice(1), newReading];
      });

      // Update drone status
      setDrones((prev) =>
        prev.map((drone) => ({
          ...drone,
          battery: Math.max(0, drone.battery - Math.random() * 0.5),
          signal: 70 + Math.random() * 30,
          lastUpdate: Math.random() > 0.7 ? "Just now" : drone.lastUpdate,
        })),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleDeployDrone = (droneId: string) => {
    setDrones((prev) =>
      prev.map((drone) =>
        drone.id === droneId ? { ...drone, status: "active" as const } : drone,
      ),
    );
    toast({
      title: "Drone Deployed",
      description: `${drones.find((d) => d.id === droneId)?.name} has been deployed successfully.`,
    });
  };

  const handleRecallDrone = (droneId: string) => {
    setDrones((prev) =>
      prev.map((drone) =>
        drone.id === droneId ? { ...drone, status: "standby" as const } : drone,
      ),
    );
    toast({
      title: "Drone Recalled",
      description: `${drones.find((d) => d.id === droneId)?.name} is returning to base.`,
    });
  };

  const handleStartMission = (mission: Mission) => {
    setCurrentMission({
      ...mission,
      status: "active",
      startTime: new Date().toISOString(),
    });
    setDrones((prev) =>
      prev.map((drone) =>
        drone.id === selectedDrone
          ? { ...drone, status: "mission" as const }
          : drone,
      ),
    );
    toast({
      title: "Mission Started",
      description: `Mission "${mission.name}" has been initiated.`,
    });
  };

  const handleAutoDeploymentToggle = (enabled: boolean) => {
    setAutoDeployment(enabled);
    if (enabled) {
      toast({
        title: "Auto-Deployment Enabled",
        description:
          "Drones will automatically deploy based on water quality thresholds.",
      });
    }
  };

  // Mission planning functions
  const addWaypointToMission = () => {
    if (
      !newWaypoint.lat ||
      !newWaypoint.lng ||
      !newWaypoint.depth ||
      !newWaypoint.duration
    ) {
      toast({
        title: "Invalid Waypoint",
        description: "Please fill in all required waypoint fields.",
      });
      return;
    }

    const waypoint: Waypoint = {
      id: `wp-${Date.now()}`,
      lat: newWaypoint.lat!,
      lng: newWaypoint.lng!,
      depth: newWaypoint.depth!,
      duration: newWaypoint.duration!,
      action: newWaypoint.action || "sample",
      notes: newWaypoint.notes || "",
    };

    if (editingMission) {
      setEditingMission({
        ...editingMission,
        waypoints: [...editingMission.waypoints, waypoint],
      });
    } else {
      setNewMission({
        ...newMission,
        waypoints: [...(newMission.waypoints || []), waypoint],
      });
    }

    // Reset waypoint form
    setNewWaypoint({
      lat: 3.139,
      lng: 101.6869,
      depth: 3,
      duration: 300,
      action: "sample",
      notes: "",
    });

    toast({
      title: "Waypoint Added",
      description: `Waypoint at ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)} added successfully.`,
    });
  };

  const removeWaypoint = (waypointId: string) => {
    if (editingMission) {
      setEditingMission({
        ...editingMission,
        waypoints: editingMission.waypoints.filter(
          (wp) => wp.id !== waypointId,
        ),
      });
    } else {
      setNewMission({
        ...newMission,
        waypoints: (newMission.waypoints || []).filter(
          (wp) => wp.id !== waypointId,
        ),
      });
    }
  };

  const saveMission = () => {
    const missionToSave = editingMission || newMission;

    if (
      !missionToSave.name ||
      !missionToSave.waypoints ||
      missionToSave.waypoints.length === 0
    ) {
      toast({
        title: "Invalid Mission",
        description: "Mission must have a name and at least one waypoint.",
      });
      return;
    }

    const totalTime = missionToSave.waypoints.reduce(
      (sum, wp) => sum + wp.duration,
      0,
    );

    const mission: Mission = {
      id: editingMission ? editingMission.id : `mission-${Date.now()}`,
      name: missionToSave.name!,
      description: missionToSave.description || "",
      waypoints: missionToSave.waypoints,
      status: "pending",
      progress: 0,
      estimatedTime: totalTime,
      createdAt: editingMission
        ? editingMission.createdAt
        : new Date().toISOString(),
      priority: missionToSave.priority || "medium",
    };

    if (editingMission) {
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? mission : m)),
      );
      setEditingMission(null);
      toast({
        title: "Mission Updated",
        description: `Mission "${mission.name}" has been updated successfully.`,
      });
    } else {
      setMissions((prev) => [...prev, mission]);
      setNewMission({
        name: "",
        description: "",
        waypoints: [],
        priority: "medium",
      });
      setIsCreatingMission(false);
      toast({
        title: "Mission Created",
        description: `Mission "${mission.name}" has been created successfully.`,
      });
    }
  };

  const deleteMission = (missionId: string) => {
    setMissions((prev) => prev.filter((m) => m.id !== missionId));
    toast({
      title: "Mission Deleted",
      description: "Mission has been deleted successfully.",
    });
  };

  const duplicateMission = (mission: Mission) => {
    const duplicated: Mission = {
      ...mission,
      id: `mission-${Date.now()}`,
      name: `${mission.name} (Copy)`,
      status: "pending",
      progress: 0,
      createdAt: new Date().toISOString(),
      waypoints: mission.waypoints.map((wp) => ({
        ...wp,
        id: `wp-${Date.now()}-${Math.random()}`,
      })),
    };

    setMissions((prev) => [...prev, duplicated]);
    toast({
      title: "Mission Duplicated",
      description: `Mission "${duplicated.name}" has been created.`,
    });
  };

  const currentDrone = drones.find((d) => d.id === selectedDrone);
  const latestSensorReading = sensorData[sensorData.length - 1];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "mission":
        return "bg-blue-500";
      case "standby":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return "bg-green-500";
    if (battery > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-6 w-6 text-blue-600" />
            Underwater Drones Control Center
          </CardTitle>
          <CardDescription>
            Advanced autonomous underwater vehicles for river monitoring and
            data collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="drones" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="drones">Drones</TabsTrigger>
              <TabsTrigger value="sensors">Sensors</TabsTrigger>
              <TabsTrigger value="missions">Mission Planner</TabsTrigger>
              <TabsTrigger value="deployment">Auto Deployment</TabsTrigger>
            </TabsList>

            <TabsContent value="drones" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {drones.map((drone) => (
                  <Card
                    key={drone.id}
                    className={`cursor-pointer transition-all ${selectedDrone === drone.id ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setSelectedDrone(drone.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{drone.name}</h3>
                        <Badge
                          className={`${getStatusColor(drone.status)} text-white`}
                        >
                          {drone.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4" />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span>Battery</span>
                              <span>{drone.battery.toFixed(0)}%</span>
                            </div>
                            <Progress value={drone.battery} className="h-2" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          <span>Signal: {drone.signal.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Depth: {drone.location.depth.toFixed(1)}m</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last update: {drone.lastUpdate}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {drone.status === "standby" ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeployDrone(drone.id);
                            }}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Deploy
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecallDrone(drone.id);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Recall
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Temperature</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {latestSensorReading?.temperature.toFixed(1)}°C
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">pH Level</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {latestSensorReading?.ph.toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Fish className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Dissolved O₂</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {latestSensorReading?.dissolved_oxygen.toFixed(1)} mg/L
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Real-time Sensor Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#ef4444"
                          name="Temperature (°C)"
                        />
                        <Line
                          type="monotone"
                          dataKey="ph"
                          stroke="#3b82f6"
                          name="pH Level"
                        />
                        <Line
                          type="monotone"
                          dataKey="dissolved_oxygen"
                          stroke="#10b981"
                          name="Dissolved O₂ (mg/L)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="missions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Mission Control Center
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsCreatingMission(!isCreatingMission);
                      setEditingMission(null);
                    }}
                    variant={isCreatingMission ? "outline" : "default"}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isCreatingMission ? "Cancel" : "Create Mission"}
                  </Button>
                </div>
              </div>

              {currentMission && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Active Mission</AlertTitle>
                  <AlertDescription>
                    {currentMission.name} is currently in progress.
                    <div className="mt-2">
                      <Progress
                        value={currentMission.progress}
                        className="h-2"
                      />
                      <div className="text-sm mt-1">
                        Progress: {currentMission.progress.toFixed(0)}%
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {(isCreatingMission || editingMission) && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingMission ? "Edit Mission" : "Create New Mission"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Mission Name *</Label>
                        <Input
                          value={(editingMission || newMission).name || ""}
                          onChange={(e) => {
                            if (editingMission) {
                              setEditingMission({
                                ...editingMission,
                                name: e.target.value,
                              });
                            } else {
                              setNewMission({
                                ...newMission,
                                name: e.target.value,
                              });
                            }
                          }}
                          placeholder="Enter mission name"
                        />
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select
                          value={
                            (editingMission || newMission).priority || "medium"
                          }
                          onValueChange={(value) => {
                            if (editingMission) {
                              setEditingMission({
                                ...editingMission,
                                priority: value as any,
                              });
                            } else {
                              setNewMission({
                                ...newMission,
                                priority: value as any,
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Input
                        value={(editingMission || newMission).description || ""}
                        onChange={(e) => {
                          if (editingMission) {
                            setEditingMission({
                              ...editingMission,
                              description: e.target.value,
                            });
                          } else {
                            setNewMission({
                              ...newMission,
                              description: e.target.value,
                            });
                          }
                        }}
                        placeholder="Enter mission description"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Add Waypoint</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label>Latitude *</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={newWaypoint.lat}
                            onChange={(e) =>
                              setNewWaypoint({
                                ...newWaypoint,
                                lat: parseFloat(e.target.value),
                              })
                            }
                            placeholder="3.1390"
                          />
                        </div>
                        <div>
                          <Label>Longitude *</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={newWaypoint.lng}
                            onChange={(e) =>
                              setNewWaypoint({
                                ...newWaypoint,
                                lng: parseFloat(e.target.value),
                              })
                            }
                            placeholder="101.6869"
                          />
                        </div>
                        <div>
                          <Label>Depth (m) *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={newWaypoint.depth}
                            onChange={(e) =>
                              setNewWaypoint({
                                ...newWaypoint,
                                depth: parseFloat(e.target.value),
                              })
                            }
                            placeholder="3.0"
                          />
                        </div>
                        <div>
                          <Label>Duration (sec) *</Label>
                          <Input
                            type="number"
                            value={newWaypoint.duration}
                            onChange={(e) =>
                              setNewWaypoint({
                                ...newWaypoint,
                                duration: parseInt(e.target.value),
                              })
                            }
                            placeholder="300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <Label>Action</Label>
                          <Select
                            value={newWaypoint.action}
                            onValueChange={(value) =>
                              setNewWaypoint({
                                ...newWaypoint,
                                action: value as any,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sample">
                                Water Sampling
                              </SelectItem>
                              <SelectItem value="record">
                                Video Recording
                              </SelectItem>
                              <SelectItem value="monitor">
                                Environmental Monitoring
                              </SelectItem>
                              <SelectItem value="survey">
                                Area Survey
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            value={newWaypoint.notes}
                            onChange={(e) =>
                              setNewWaypoint({
                                ...newWaypoint,
                                notes: e.target.value,
                              })
                            }
                            placeholder="Optional notes"
                          />
                        </div>
                      </div>

                      <Button onClick={addWaypointToMission} className="mt-3">
                        <MapPin className="h-4 w-4 mr-2" />
                        Add Waypoint
                      </Button>
                    </div>

                    {((editingMission?.waypoints || newMission.waypoints)
                      ?.length || 0) > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">
                          Waypoints (
                          {(editingMission?.waypoints || newMission.waypoints)
                            ?.length || 0}
                          )
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {(
                            editingMission?.waypoints ||
                            newMission.waypoints ||
                            []
                          ).map((waypoint, index) => (
                            <div
                              key={waypoint.id}
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="font-medium">
                                    #{index + 1}
                                  </span>
                                  <span>
                                    {waypoint.lat.toFixed(4)},{" "}
                                    {waypoint.lng.toFixed(4)}
                                  </span>
                                  <span>{waypoint.depth}m</span>
                                  <span>{waypoint.duration}s</span>
                                  <Badge variant="outline">
                                    {waypoint.action}
                                  </Badge>
                                </div>
                                {waypoint.notes && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {waypoint.notes}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeWaypoint(waypoint.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreatingMission(false);
                          setEditingMission(null);
                          setNewMission({
                            name: "",
                            description: "",
                            waypoints: [],
                            priority: "medium",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveMission}>
                        {editingMission ? "Update Mission" : "Create Mission"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {missions.map((mission) => (
                  <Card key={mission.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{mission.name}</h4>
                            <Badge
                              variant={
                                mission.priority === "high"
                                  ? "destructive"
                                  : mission.priority === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {mission.priority}
                            </Badge>
                            <Badge
                              variant={
                                mission.status === "pending"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {mission.status}
                            </Badge>
                          </div>

                          {mission.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {mission.description}
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{mission.waypoints.length} waypoints</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                Est. {Math.floor(mission.estimatedTime / 60)}{" "}
                                min
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            Created:{" "}
                            {new Date(mission.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {mission.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartMission(mission)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMission(mission);
                                setIsCreatingMission(false);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => duplicateMission(mission)}
                            >
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteMission(mission.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="deployment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Automatic Deployment System</CardTitle>
                  <CardDescription>
                    Configure autonomous drone deployment based on environmental
                    triggers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">
                        Enable Auto-Deployment
                      </Label>
                      <p className="text-sm text-gray-600">
                        Automatically deploy drones when water quality
                        thresholds are exceeded
                      </p>
                    </div>
                    <Switch
                      checked={autoDeployment}
                      onCheckedChange={handleAutoDeploymentToggle}
                    />
                  </div>

                  {autoDeployment && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Deployment Triggers</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>pH Threshold</Label>
                          <Input
                            type="number"
                            placeholder="6.5 - 8.5"
                            defaultValue="6.5"
                          />
                        </div>
                        <div>
                          <Label>Turbidity Threshold (NTU)</Label>
                          <Input
                            type="number"
                            placeholder="50"
                            defaultValue="50"
                          />
                        </div>
                        <div>
                          <Label>Temperature Threshold (°C)</Label>
                          <Input
                            type="number"
                            placeholder="30"
                            defaultValue="30"
                          />
                        </div>
                        <div>
                          <Label>DO Threshold (mg/L)</Label>
                          <Input
                            type="number"
                            placeholder="4.0"
                            defaultValue="4.0"
                          />
                        </div>
                      </div>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Auto-Deployment Active</AlertTitle>
                        <AlertDescription>
                          System is monitoring water quality parameters. Drones
                          will deploy automatically when thresholds are
                          exceeded.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderwaterDrones;
