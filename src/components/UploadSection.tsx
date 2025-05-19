import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Define river data
const riverData = {
  "Johor": ["Sungai Johor", "Sungai Endau", "Sungai Muar", "Sungai Batu Pahat"],
  "Kedah": ["Sungai Muda", "Sungai Kedah", "Sungai Merbok", "Sungai Pedu"],
  "Kelantan": ["Sungai Kelantan", "Sungai Galas", "Sungai Lebir", "Sungai Pergau"],
  "Malacca": ["Sungai Malacca", "Sungai Kesang", "Sungai Duyong"],
  "Negeri Sembilan": ["Sungai Linggi", "Sungai Muar", "Sungai Rembau"],
  "Pahang": ["Sungai Pahang", "Sungai Kuantan", "Sungai Tembeling", "Sungai Jelai"],
  "Penang": ["Sungai Pinang", "Sungai Perai", "Sungai Juru"],
  "Perak": ["Sungai Perak", "Sungai Kinta", "Sungai Bernam", "Sungai Batang Padang"],
  "Perlis": ["Sungai Perlis", "Sungai Chuchuh", "Sungai Arau"],
  "Sabah": ["Sungai Kinabatangan", "Sungai Padas", "Sungai Segama", "Sungai Papar"],
  "Sarawak": ["Sungai Rajang", "Sungai Baram", "Sungai Sarawak", "Sungai Lupar"],
  "Selangor": ["Sungai Selangor", "Sungai Klang", "Sungai Langat", "Sungai Bernam"],
  "Terengganu": ["Sungai Terengganu", "Sungai Dungun", "Sungai Kemaman", "Sungai Besut"],
};

interface UploadSectionProps {
  onVideoUploaded: (file: File, location: string, river: string) => void;
  isProcessing: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onVideoUploaded, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<string>('');
  const [selectedRiver, setSelectedRiver] = useState<string>('');
  const [rivers, setRivers] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const { toast } = useToast();

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = e.target.value;
    setLocation(state);
    setRivers(riverData[state] || []);
    setSelectedRiver('');
  };

  useEffect(() => {
    // Fetch user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // Mock function to get state from coordinates
        const state = getStateFromCoordinates(latitude, longitude);
        setLocation(state);
        setRivers(riverData[state] || []);
        setCoordinates({latitude, longitude});
      });
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (.mp4, .mov, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        onVideoUploaded(file, location, selectedRiver);
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload River Video</CardTitle>
        <CardDescription>
          Upload a video of a river to analyze its depth, flow, and detect trash.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Drag and drop video here</h3>
              <p className="text-sm text-gray-500">Supported formats: MP4, MOV, AVI (max 100MB)</p>
            </div>
            <span className="relative mt-4 rounded-md shadow-sm">
              <Button variant="outline" className="relative" onClick={() => document.getElementById('file-upload')?.click()}>
                Browse Files
              </Button>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </span>
          </div>
        </div>
        {selectedFile && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">{selectedFile.name}</span>
              <span>{Math.round(selectedFile.size / 1024 / 1024 * 10) / 10} MB</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        {isProcessing && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
            <p className="text-sm text-yellow-700">
              Processing video... This may take a moment as we analyze depth and flow patterns.
            </p>
          </div>
        )}

        {/* Current location coordinates */}
        {coordinates && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{coordinates.latitude.toFixed(4)}°N, {coordinates.longitude.toFixed(4)}°E</span>
          </div>
        )}

        {/* State selection dropdown */}
        <div className="mt-4">
          <label htmlFor="state-select" className="block text-sm font-medium text-gray-700">
            Select a state
          </label>
          <select
            id="state-select"
            name="state"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            value={location}
            onChange={handleStateChange}
          >
            <option value="">Choose a state</option>
            {Object.keys(riverData).map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* River selection dropdown */}
        {location && rivers.length > 0 && (
          <div className="mt-4">
            <label htmlFor="river-select" className="block text-sm font-medium text-gray-700">
              Select a river in {location}
            </label>
            <select
              id="river-select"
              name="river"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={selectedRiver}
              onChange={(e) => setSelectedRiver(e.target.value)}
            >
              <option value="">Choose a river</option>
              {rivers.map((river) => (
                <option key={river} value={river}>{river}</option>
              ))}
            </select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mock function to get state from coordinates
function getStateFromCoordinates(latitude: number, longitude: number): string {
  // This function should be replaced with actual logic to determine the state
  // based on latitude and longitude
  return "Selangor"; // Example return value
}

export default UploadSection;