import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle, Info, Check, Filter, ImageDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface TrashCategory {
  name: string;
  count: number;
  impact: string;
  icon: React.ReactNode;
}

interface TrashDetectionProps {
  trashCount: number;
  trashCategories?: string[];
  environmentalImpact?: string;
  trashImages?: string[];
}

const TrashDetection: React.FC<TrashDetectionProps> = ({ 
  trashCount, 
  trashCategories = [], 
  environmentalImpact,
  trashImages = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const generateTrashCategories = (total: number, categories: string[]): TrashCategory[] => {
    if (total === 0) return [];
    
    if (categories && categories.length > 0) {
      const totalItems = categories.length > 0 ? total : 0;
      const itemsPerCategory = Math.max(1, Math.floor(total / categories.length));
      
      return categories.map((category) => {
        let impact = 'Medium';
        if (category.toLowerCase().includes('plastic')) impact = 'Very High';
        else if (category.toLowerCase().includes('metal')) impact = 'High';
        else if (category.toLowerCase().includes('organic')) impact = 'Low';
        
        return {
          name: category.charAt(0).toUpperCase() + category.slice(1),
          count: itemsPerCategory,
          impact,
          icon: <Trash2 className="h-5 w-5" />
        };
      });
    } else {
      const plasticCount = Math.max(1, Math.floor(total * 0.6));
      const metalCount = Math.floor(total * 0.2);
      const otherCount = total - plasticCount - metalCount;
      
      return [
        {
          name: 'Plastic',
          count: plasticCount,
          impact: 'Very High',
          icon: <Trash2 className="h-5 w-5" />
        },
        {
          name: 'Metal',
          count: metalCount,
          impact: 'High', 
          icon: <Trash2 className="h-5 w-5" />
        },
        {
          name: 'Other',
          count: otherCount,
          impact: 'Medium',
          icon: <Trash2 className="h-5 w-5" />
        }
      ].filter(category => category.count > 0);
    }
  };

  const categoryItems = generateTrashCategories(trashCount, trashCategories);

  const getPollutionLevel = (count: number) => {
    if (count === 0) return { level: 'Minimal', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (count <= 2) return { level: 'Low', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (count <= 5) return { level: 'Moderate', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const pollutionInfo = getPollutionLevel(trashCount);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Trash Detection & Classification</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="impact">Environmental Impact</TabsTrigger>
            <TabsTrigger value="images">Detected Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <div className="flex items-center">
                  <Trash2 className="h-8 w-8 text-gray-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Detected Items</h3>
                    <span className="text-3xl font-bold text-gray-700">{trashCount}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full ${pollutionInfo.bgColor} ${pollutionInfo.color}`}>
                  {pollutionInfo.level} Pollution
                </div>
              </div>
              
              {trashCount > 0 && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Pollution Alert</h4>
                    <p className="text-xs text-yellow-700 mt-1">
                      {trashCount} pieces of trash detected in this river by Gemini AI. Consider organizing a cleanup 
                      effort to prevent further environmental damage and protect aquatic life.
                    </p>
                  </div>
                </div>
              )}
              
              {trashCount === 0 && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Clean River</h4>
                    <p className="text-xs text-green-700 mt-1">
                      No visible trash detected by Gemini AI in this river. Well-maintained waterways support healthier
                      ecosystems and provide safer recreational opportunities.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <div className="space-y-4">
              {trashCount === 0 ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                  <p className="text-sm text-green-700">No trash items detected to categorize</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryItems.map((category) => (
                    <div key={category.name} className="p-3 rounded-lg border flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-full mr-3">
                          {category.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{category.name}</h4>
                          <p className="text-xs text-gray-500">Impact: {category.impact}</p>
                        </div>
                      </div>
                      <div className="text-lg font-bold">{category.count}</div>
                    </div>
                  ))}
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center">
                      <Info className="h-5 w-5 text-blue-500 mr-2" />
                      <h4 className="text-sm font-medium text-blue-700">Gemini AI Classification</h4>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Google's Gemini Pro Vision AI classifies trash items based on material type, size, and visual characteristics.
                      Classification accuracy improves with more data from user submissions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="impact">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                <h4 className="text-sm font-medium text-orange-800 mb-2">Environmental Impact Assessment</h4>
                {environmentalImpact ? (
                  <p className="text-sm text-orange-700">{environmentalImpact}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700">Current Pollution Level:</span>
                      <span className={`text-sm font-medium ${pollutionInfo.color}`}>{pollutionInfo.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700">Estimated Recovery Time:</span>
                      <span className="text-sm font-medium">
                        {trashCount === 0 ? 'N/A' : 
                        trashCount < 3 ? '1-3 months' : 
                        trashCount < 6 ? '6-12 months' : 
                        '1-2 years'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700">Wildlife Impact:</span>
                      <span className="text-sm font-medium">
                        {trashCount === 0 ? 'Minimal' : 
                        trashCount < 3 ? 'Low' : 
                        trashCount < 6 ? 'Moderate' : 
                        'Severe'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <h4 className="text-sm font-medium text-blue-800 mb-2">For NGOs and Government Agencies</h4>
                <p className="text-xs text-blue-700 mb-3">
                  This data can be used to prioritize cleanup efforts, allocate resources, and monitor progress
                  over time. Regular monitoring helps identify pollution sources and measure intervention effectiveness.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" /> Generate Detailed Report
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="images">
            <div className="space-y-4">
              {trashImages && trashImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trashImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Detected trash item ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = image;
                            link.download = `trash-detection-${index + 1}.jpg`;
                            link.click();
                          }}
                        >
                          <ImageDown className="h-4 w-4 mr-2" />
                          Save Image
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-gray-500">No trash detection images available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrashDetection;
