import React, { useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Settings, History, LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const UserProfile: React.FC = () => {
  const { user, updateProfile, logout } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  if (!user) return null;

  const handleSaveProfile = () => {
    updateProfile({
      name: profileData.name,
      email: profileData.email,
    });
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handlePreferenceChange = (key: string, value: any) => {
    updateProfile({
      preferences: {
        ...user.preferences,
        [key]: value,
      },
    });
    toast.success("Preferences updated!");
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        <Button
          variant="outline"
          onClick={logout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since {formatDate(user.created)}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>

              {isEditing && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Optical Flow Method</Label>
                  <p className="text-sm text-gray-600">
                    Choose your preferred analysis method
                  </p>
                </div>
                <Select
                  value={user.preferences.opticalFlowMethod}
                  onValueChange={(value) =>
                    handlePreferenceChange("opticalFlowMethod", value)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lucas-kanade">
                      Lucas-Kanade (Fast)
                    </SelectItem>
                    <SelectItem value="farneback">
                      Farneback (Accurate)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Default Region</Label>
                  <p className="text-sm text-gray-600">
                    Your default location for analysis
                  </p>
                </div>
                <Input
                  value={user.preferences.defaultRegion}
                  onChange={(e) =>
                    handlePreferenceChange("defaultRegion", e.target.value)
                  }
                  className="w-48"
                  placeholder="e.g., Malaysia"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Notifications</Label>
                  <p className="text-sm text-gray-600">
                    Receive analysis completion notifications
                  </p>
                </div>
                <Switch
                  checked={user.preferences.notifications}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("notifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Auto-save Results</Label>
                  <p className="text-sm text-gray-600">
                    Automatically save analysis results
                  </p>
                </div>
                <Switch
                  checked={user.preferences.autoSave}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("autoSave", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
            </CardHeader>
            <CardContent>
              {user.analysisHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis history yet</p>
                  <p className="text-sm">
                    Your completed analyses will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.analysisHistory.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{analysis.fileName}</h3>
                          <p className="text-sm text-gray-600">
                            {analysis.location} - {analysis.river}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(analysis.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <p>
                              Discharge: {analysis.results.discharge.toFixed(2)}{" "}
                              m³/s
                            </p>
                            <p>
                              Velocity: {analysis.results.velocity.toFixed(2)}{" "}
                              m/s
                            </p>
                            <p>Trash: {analysis.results.trashCount} items</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
