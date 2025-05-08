import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Profile from "@/pages/profile";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Notifications from "@/pages/notifications";
import Messages from "@/pages/messages";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/messages" component={Messages} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
