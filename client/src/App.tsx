import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Setup from "@/pages/Setup";
import Splash from "@/pages/Splash";
import ServiceMain from "@/pages/ServiceMain";
import TripTracking from "@/pages/TripTracking";
import LocationDenied from "@/pages/LocationDenied";
import { useAppStore } from "./lib/store";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/setup" component={Setup} />
      <Route path="/splash" component={Splash} />
      <Route path="/service-main" component={ServiceMain} />
      <Route path="/trip-tracking/:tripId" component={TripTracking} />
      <Route path="/location-denied" component={LocationDenied} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { theme } = useAppStore();
  
  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
