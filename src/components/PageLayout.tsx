
import React, { useEffect, useRef } from 'react';
import Navigation from './Navigation';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Add scroll reveal animation effect with improved timing
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add staggered animation delay based on element index
          setTimeout(() => {
            entry.target.classList.add('fade-in');
          }, index * 100); // Staggered delay
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Start animation a bit earlier
    });
    
    if (mainRef.current) {
      const elements = mainRef.current.querySelectorAll('.nasa-card, .fade-in-section');
      elements.forEach(el => {
        observer.observe(el);
      });
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen space-particles">
      <Navigation />
      <main 
        ref={mainRef} 
        className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-8 space-y-6 animate-gradient"
      >
        <div className="fade-in-section">{children}</div>
      </main>
      <footer className="py-5 px-6 border-t border-border/50 bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-primary glow-text">RIVER VISION</span>
            <span className="space-dot pulse-slow" />
            <span className="text-xs text-muted-foreground">2025</span>
          </div>
          <div className="text-xs text-muted-foreground mt-3 md:mt-0 slide-in-right">
            Advanced River Monitoring System
          </div>
        </div>
        <div className="data-bar mt-3 max-w-7xl mx-auto"></div>
      </footer>
    </div>
  );
};

export default PageLayout;
