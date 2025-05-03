
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, X, ArrowRight, ArrowLeft } from 'lucide-react';

// List of tips to guide users
const TIPS = [
  {
    title: "Upload a River Video",
    content: "Start by uploading a video of a river to analyze its depth, flow speed, and detect any trash."
  },
  {
    title: "Explore Live Streams",
    content: "Check out the Live Streams tab to watch and analyze real-time footage from rivers around the world."
  },
  {
    title: "Compare Your Results",
    content: "After analyzing your video, use the Compare tab to see how your data compares with live stream data."
  },
  {
    title: "View Results on Map",
    content: "The Map View tab shows the geographical location of your analyzed videos and live streams."
  },
  {
    title: "Check Water Quality",
    content: "Look at the water quality index in the Report tab to understand pollution levels in your analyzed river."
  }
];

const TipsWidget = () => {
  const [visible, setVisible] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
  };
  
  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + TIPS.length) % TIPS.length);
  };

  if (!visible) return null;
  
  const currentTip = TIPS[currentTipIndex];
  
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium text-sm">Pro Tip</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <h4 className="font-medium mb-1">{currentTip.title}</h4>
        <p className="text-sm text-muted-foreground">{currentTip.content}</p>
        
        <div className="flex justify-between items-center mt-3">
          <Button variant="ghost" size="sm" onClick={prevTip} className="h-7 px-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            {currentTipIndex + 1} of {TIPS.length}
          </div>
          <Button variant="ghost" size="sm" onClick={nextTip} className="h-7 px-2">
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TipsWidget;
