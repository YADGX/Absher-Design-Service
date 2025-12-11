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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/setup" component={Setup} />
      <Route path="/splash" component={Splash} />
      <Route path="/service-main" component={ServiceMain} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
