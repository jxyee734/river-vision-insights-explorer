
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
}

export const NasaCard = ({
  title,
  description,
  footer,
  gradient = false,
  glassmorphism = false,
  children,
  className,
  ...props
}: NasaCardProps) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden border border-border", 
        gradient && "bg-gradient-to-b from-card to-card/80",
        glassmorphism && "glass-card",
        className
      )} 
      {...props}
    >
      {(title || description) && (
        <CardHeader className="tech-border">
          {title && <CardTitle className="text-lg text-primary-foreground">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn("p-4", !title && !description && "pt-6")}>
        {children}
      </CardContent>
      {footer && <CardFooter className="border-t border-border/50 bg-muted/10">{footer}</CardFooter>}
    </Card>
  );
};

export default NasaCard;
