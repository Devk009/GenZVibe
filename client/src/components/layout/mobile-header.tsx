import { useLocation } from "wouter";
import { Bell, Search, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MobileHeader = () => {
  const [location, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="font-['Unbounded'] text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">vibe</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark"
          onClick={() => navigate("/search")}
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark relative"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute top-0 right-0 w-2 h-2 p-0 bg-secondary" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-gray-100 dark:hover:bg-surface-dark"
          onClick={() => navigate("/messages")}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default MobileHeader;
