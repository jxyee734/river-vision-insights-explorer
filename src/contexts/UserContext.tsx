import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserContextType } from "../types/user";

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on app start
    const savedUser = localStorage.getItem("river-analysis-user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("river-analysis-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API call - replace with real authentication
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email && password) {
      const newUser: UserProfile = {
        id: Date.now().toString(),
        name: email.split("@")[0],
        email,
        preferences: {
          opticalFlowMethod: "lucas-kanade",
          defaultRegion: "Malaysia",
          notifications: true,
          autoSave: true,
        },
        analysisHistory: [],
        created: Date.now(),
        lastLogin: Date.now(),
      };

      setUser(newUser);
      localStorage.setItem("river-analysis-user", JSON.stringify(newUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("river-analysis-user");
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("river-analysis-user", JSON.stringify(updatedUser));
    }
  };

  const saveAnalysis = (analysis: any) => {
    if (user) {
      const newHistory = [
        ...user.analysisHistory,
        {
          id: Date.now().toString(),
          fileName: analysis.fileName || "Unknown",
          timestamp: Date.now(),
          location: analysis.riverCategory?.state || "Unknown",
          river: analysis.riverCategory?.river || "Unknown",
          results: {
            discharge: analysis.discharge || 0,
            velocity: analysis.averageVelocity || 0,
            trashCount: analysis.trashCount || 0,
          },
        },
      ];

      updateProfile({ analysisHistory: newHistory });
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        saveAnalysis,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
