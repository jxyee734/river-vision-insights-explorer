
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UploadSectionProps {
  onVideoUploaded: (file: File) => void;
  isProcessing: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onVideoUploaded, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

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
        onVideoUploaded(file);
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
      </CardContent>
    </Card>
  );
};

export default UploadSection;
