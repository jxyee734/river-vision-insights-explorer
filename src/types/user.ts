export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    opticalFlowMethod: "lucas-kanade" | "farneback";
    defaultRegion: string;
    notifications: boolean;
    autoSave: boolean;
  };
  analysisHistory: Array<{
    id: string;
    fileName: string;
    timestamp: number;
    location: string;
    river: string;
    results: {
      velocity: number;
      trashCount: number;
    };
  }>;
  created: number;
  lastLogin: number;
}

export interface UserContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  saveAnalysis: (analysis: any) => void;
  isLoading: boolean;
}
