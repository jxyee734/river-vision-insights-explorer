
import React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Rocket, Satellite, Earth, Database, BarChart, Layers, Search, Monitor, Waves } from 'lucide-react';

export function Navigation() {
  return (
    <div className="w-full py-4 px-6 bg-card/30 backdrop-blur-lg border-b border-border/30 shadow-md sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="orbit">
            <Rocket className="h-6 w-6 text-primary float hover:text-blue-400 transition-colors duration-300" />
          </div>
          <span className="text-lg font-bold tracking-wider uppercase text-foreground glow-text">RIVER VISION</span>
          <div className="hidden md:flex space-x-1 items-center">
            <span className="space-dot pulse-slow" />
            <span className="text-xs text-muted-foreground tracking-widest uppercase slide-in-right">EXPLORER</span>
          </div>
        </div>
        
        <NavigationMenu className="mx-auto hidden md:block">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <Link to="/" className="group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1">
                <Monitor className="h-4 w-4 text-primary group-hover:text-blue-400 transition-colors duration-300" />
                Dashboard
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 focus:bg-muted/80 data-[state=open]:bg-muted/80 transition-all duration-300 hover:-translate-y-1">
                <Database className="h-4 w-4 mr-2 text-primary" />
                Analysis Tools
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-card/95 backdrop-blur-lg rounded-xl border border-border/30 shadow-xl fade-in">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-lg bg-gradient-to-b from-blue-900/30 to-blue-950/10 p-6 no-underline outline-none focus:shadow-md border border-border/30 tech-scanline card-hover"
                        to="/"
                      >
                        <Satellite className="h-6 w-6 text-primary float" />
                        <div className="mb-2 mt-4 text-lg font-medium">
                          River Vision Explorer
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Advanced river analysis and monitoring with AI
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/" title="Analysis Report" icon={<BarChart className="h-4 w-4 mr-2 text-primary" />}>
                    Comprehensive river analysis with depth, flow, and pollution data
                  </ListItem>
                  <ListItem href="/?tab=map" title="Map View" icon={<Earth className="h-4 w-4 mr-2 text-primary" />}>
                    Interactive map showing cleanup locations and pollution levels
                  </ListItem>
                  <ListItem href="/?tab=depth" title="Water Analysis" icon={<Layers className="h-4 w-4 mr-2 text-primary" />}>
                    Detailed water quality metrics and environmental impact assessment
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/?tab=flow" className="group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1">
                <BarChart className="h-4 w-4 text-primary group-hover:text-blue-400 transition-colors duration-300" />
                Flow Analytics
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/?tab=trash" className="group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1">
                <Search className="h-4 w-4 text-primary group-hover:text-blue-400 transition-colors duration-300" />
                Pollution Detection
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/?tab=streams" className="group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1">
                <Waves className="h-4 w-4 text-primary group-hover:text-blue-400 transition-colors duration-300" />
                Live Streams
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center">
          <div className="nasa-badge pulse-slow button-pulse">LIVE DATA</div>
        </div>
      </div>
      <div className="data-bar mt-1"></div>
    </div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { 
    icon?: React.ReactNode;
    href: string;
  }
>(({ className, title, children, icon, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-muted/50 card-hover",
            className
          )}
          {...props}
        >
          <div className="flex items-center text-sm font-medium leading-none">
            {icon}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default Navigation;
