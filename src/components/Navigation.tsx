
import React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { FileChartColumn, Map, Droplet, TestTubes, CloudLightning, Waves, BarChart } from 'lucide-react';

export function Navigation() {
  return (
    <NavigationMenu className="mx-auto">
      <NavigationMenuList className="gap-2">
        <NavigationMenuItem>
          <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-accent">
            <CloudLightning className="h-5 w-5 text-blue-600" />
            Dashboard
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-background hover:bg-accent/50 focus:bg-accent">
            <Waves className="h-5 w-5 mr-2 text-blue-600" />
            Analysis Tools
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-50 to-blue-100 p-6 no-underline outline-none focus:shadow-md"
                    to="/"
                  >
                    <CloudLightning className="h-6 w-6 text-blue-600" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      River Vision Explorer
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Advanced river analysis and monitoring with AI
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/" title="Analysis Report" icon={<FileChartColumn className="h-4 w-4 mr-2 text-blue-600" />}>
                Comprehensive river analysis with depth, flow, and pollution data
              </ListItem>
              <ListItem href="/?tab=map" title="Map View" icon={<Map className="h-4 w-4 mr-2 text-green-600" />}>
                Interactive map showing cleanup locations and pollution levels
              </ListItem>
              <ListItem href="/?tab=depth" title="Water Analysis" icon={<Droplet className="h-4 w-4 mr-2 text-cyan-600" />}>
                Detailed water quality metrics and environmental impact assessment
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link to="/?tab=flow" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-accent">
            <BarChart className="h-5 w-5 text-blue-600" />
            Flow Analytics
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link to="/?tab=trash" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-accent">
            <TestTubes className="h-5 w-5 text-blue-600" />
            Pollution Detection
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
