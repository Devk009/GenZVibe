import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Search, 
  Compass, 
  MessageCircle, 
  Bell, 
  Settings, 
  Moon, 
  Sun,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { 
      name: "Home", 
      icon: Home, 
      path: "/" 
    },
    { 
      name: "Search", 
      icon: Search, 
      path: "/search" 
    },
    { 
      name: "Explore", 
      icon: Compass, 
      path: "/explore" 
    },
    { 
      name: "Messages", 
      icon: MessageCircle, 
      path: "/messages" 
    },
    { 
      name: "Notifications", 
      icon: Bell, 
      path: "/notifications" 
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-surface-darker border-r border-gray-200 dark:border-gray-800 hidden md:flex md:flex-col z-50">
      <div className="p-6">
        <h1 className="font-['Unbounded'] text-3xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">vibe</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full flex items-center justify-start space-x-4 p-3 rounded-xl", 
                  location === item.path && "bg-gray-100 dark:bg-surface-dark text-primary"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-6 w-6" />
                <span className="font-medium">{item.name}</span>
              </Button>
            </li>
          ))}
          
          <li>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start space-x-4 p-3 rounded-xl"
              onClick={() => navigate("/profile")}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">Profile</span>
            </Button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-3 rounded-xl"
            >
              <div className="flex items-center space-x-4">
                <Settings className="h-6 w-6" />
                <span className="font-medium">Settings</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings/privacy")}>
              Privacy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost"
          onClick={toggleTheme}
          className="w-full mt-2 flex items-center justify-between p-3 rounded-xl"
        >
          <div className="flex items-center space-x-4">
            {theme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
            <span className="font-medium">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </div>
          <div className="w-10 h-6 bg-gray-200 dark:bg-surface-dark rounded-full relative flex items-center transition-colors">
            <div 
              className={cn(
                "absolute w-4 h-4 rounded-full bg-white dark:bg-primary transition-all duration-300 ease-in-out",
                theme === "dark" ? "left-5" : "left-1"
              )}
            />
          </div>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
