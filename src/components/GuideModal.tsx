import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { School, List, HelpCircle, BookOpen, ArrowRight, FileVideo, BarChart2, Waves } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const GuideModal = () => {
  const [open, setOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  const [hasSeenGuide, setHasSeenGuide] = useLocalStorage('hasSeenGuide', false);

  useEffect(() => {
    // Show guide automatically on first visit
    if (!hasSeenGuide) {
      const timer = setTimeout(() => {
        setOpen(true);
        setHasSeenGuide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenGuide, setHasSeenGuide]);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        Guide
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <School className="h-6 w-6" />
              River Vision Explorer Guide
            </DialogTitle>
            <DialogDescription>
              Learn how to use our river analysis and monitoring tools
            </DialogDescription>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-4">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="video-analysis">Video Analysis</TabsTrigger>
              <TabsTrigger value="live-streams">Live Streams</TabsTrigger>
              <TabsTrigger value="comparison">Data Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Welcome to River Vision Insights Explorer</h3>
                      <p className="text-muted-foreground">
                        This application helps you analyze river videos to detect water depth, flow velocity, 
                        and trash pollution. You can also monitor live streams of rivers and compare data 
                        between different sources.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <h3 className="font-medium text-lg mt-6 mb-2">Main Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeatureCard 
                  icon={<FileVideo className="h-5 w-5 text-blue-500" />}
                  title="Video Analysis"
                  description="Upload river videos for AI analysis of depth, flow, and pollution."
                />
                <FeatureCard 
                  icon={<Waves className="h-5 w-5 text-green-500" />}
                  title="Live Streams"
                  description="Access real-time river monitoring from multiple locations."
                />
                <FeatureCard 
                  icon={<BarChart2 className="h-5 w-5 text-violet-500" />}
                  title="Data Comparison"
                  description="Compare user videos with live stream data for comprehensive insights."
                />
              </div>
              
              <Button 
                className="mt-4" 
                onClick={() => setCurrentTab('video-analysis')}
              >
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </TabsContent>
            
            <TabsContent value="video-analysis" className="space-y-4">
              <div className="space-y-6">
                <TutorialStep
                  number={1}
                  title="Upload Your River Video"
                  description="Click the 'Upload Video' button and select a video file from your device. Supported formats include MP4, MOV, and AVI."
                />
                <TutorialStep
                  number={2}
                  title="Wait For Analysis"
                  description="Our AI will process your video, analyzing water depth, flow velocity, and detecting trash. This may take a minute or two depending on the file size."
                />
                <TutorialStep
                  number={3}
                  title="Explore Analysis Results"
                  description="Once processed, you can view detailed analysis results in different tabs: Depth Analysis, Flow Analysis, and Trash Detection."
                />
                <TutorialStep
                  number={4}
                  title="Generate Reports"
                  description="The Report tab combines all data into a comprehensive analysis with water quality assessment and pollution predictions."
                />
              </div>
              
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setCurrentTab('overview')}>
                  Back
                </Button>
                <Button onClick={() => setCurrentTab('live-streams')}>
                  Next: Live Streams <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="live-streams" className="space-y-4">
              <div className="space-y-6">
                <TutorialStep
                  number={1}
                  title="Select a Stream"
                  description="Choose from available river streams in the dropdown menu to view real-time footage of different rivers."
                />
                <TutorialStep
                  number={2}
                  title="Analyze Stream"
                  description="Click the 'Analyze Stream' button beneath the video to begin real-time analysis of the water flow and trash detection."
                />
                <TutorialStep
                  number={3}
                  title="Monitor Real-time Data"
                  description="Watch as the system provides live measurements of flow velocity, detected trash, and estimated water quality."
                />
                <TutorialStep
                  number={4}
                  title="View on Map"
                  description="When you select a stream, its location will be highlighted on the Map View tab, allowing you to see geographical context."
                />
              </div>
              
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setCurrentTab('video-analysis')}>
                  Back
                </Button>
                <Button onClick={() => setCurrentTab('comparison')}>
                  Next: Data Comparison <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="space-y-4">
              <div className="space-y-6">
                <TutorialStep
                  number={1}
                  title="Access Comparison Tab"
                  description="After analyzing your own video, visit the Compare tab to see how your data compares with live stream data."
                />
                <TutorialStep
                  number={2}
                  title="Review Side-by-Side Data"
                  description="The comparison view shows your video analysis and live stream analysis data side by side, highlighting differences in water flow, depth, and pollution levels."
                />
                <TutorialStep
                  number={3}
                  title="Understanding Analysis Methods"
                  description="Learn about how both video sources are analyzed using the same techniques for consistent comparison."
                />
                <TutorialStep
                  number={4}
                  title="Export and Share Reports"
                  description="Generate comparison reports that can be saved or shared with others for research or educational purposes."
                />
              </div>
              
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setCurrentTab('live-streams')}>
                  Back
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close Guide
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Extracted components for cleaner code
const TutorialStep = ({ 
  number, 
  title, 
  description 
}: { 
  number: number; 
  title: string; 
  description: string;
}) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
      {number}
    </div>
    <div>
      <h4 className="font-medium text-base">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3">{icon}</div>
        <h4 className="font-medium mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default GuideModal;
