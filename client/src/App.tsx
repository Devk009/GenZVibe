import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import Notifications from "@/pages/notifications";
import Messages from "@/pages/messages";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/explore" component={Explore} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/profile/:userId" component={Profile} />
      <ProtectedRoute path="/notifications" component={Notifications} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash-screen";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vibe-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          {showSplash ? <SplashScreen /> : <Router />}
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
