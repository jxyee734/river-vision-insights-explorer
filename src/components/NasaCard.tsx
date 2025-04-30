
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NasaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  gradient?: boolean;
  glassmorphism?: boolean;
  children: React.ReactNode;
  animate?: 'fade' | 'slide' | 'float' | 'scan' | 'none';
}

export const NasaCard = ({
  title,
  description,
  footer,
  gradient = false,
  glassmorphism = false,
  animate = 'none',
  children,
  className,
  ...props
}: NasaCardProps) => {
  // Animation classes based on animation type
  const animationClass = React.useMemo(() => {
    switch(animate) {
      case 'fade':
        return 'fade-in-section';
      case 'slide':
        return 'slide-in-right';
      case 'float':
        return 'float';
      case 'scan':
        return 'tech-scanline';
      default:
        return '';
    }
  }, [animate]);
  
  return (
    <Card 
      className={cn(
        "overflow-hidden border border-border transition-all duration-300 hover:shadow-md hover:shadow-primary/10", 
        gradient && "bg-gradient-to-b from-card to-card/80",
        glassmorphism && "glass-card",
        animationClass,
        className
      )} 
      {...props}
    >
      {(title || description) && (
        <CardHeader className={cn("tech-border", animate === 'scan' && "tech-scanline")}>
          {title && (
            <CardTitle className="text-lg text-primary-foreground flex items-center">
              {title}
              {animate === 'float' && <span className="space-dot ml-2 float"></span>}
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn("p-4", !title && !description && "pt-6")}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="border-t border-border/50 bg-muted/10">
          {footer}
          {animate === 'scan' && <div className="data-bar w-full mt-2"></div>}
        </CardFooter>
      )}
    </Card>
  );
};

export default NasaCard;
