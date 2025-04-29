
import React from 'react';
import Navigation from './Navigation';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      <footer className="py-4 px-6 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">RIVER VISION</span>
            <span className="space-dot" />
            <span className="text-xs text-muted-foreground">2025</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2 md:mt-0">
            Advanced River Monitoring System
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageLayout;
