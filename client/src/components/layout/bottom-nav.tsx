import { useLocation } from "wouter";
import { 
  Home as HomeIcon, 
  Compass, 
  Bell, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BottomNav = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      name: "Home",
      icon: HomeIcon,
      path: "/",
      active: location === "/"
    },
    {
      name: "Explore",
      icon: Compass,
      path: "/explore",
      active: location === "/explore"
    },
    {
      name: "Activity",
      icon: Bell,
      path: "/notifications",
      active: location === "/notifications"
    },
    {
      name: "Profile",
      icon: User,
      path: "/profile",
      active: location === "/profile"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-darker/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 py-3 px-6 z-50 md:hidden">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={cn(
              "flex flex-col items-center justify-center space-y-1",
              item.active ? "text-primary" : "text-gray-500 dark:text-gray-400"
            )}
            onClick={() => navigate(item.path)}
          >
            {item.name === "Profile" ? (
              <div className="relative">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user?.avatarUrl?.startsWith('http') ? user.avatarUrl : user?.avatarUrl ? `/media/${user.avatarUrl.split('/').pop()}` : null} />
                  <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <item.icon className="h-6 w-6" />
            )}
            <span className="text-xs font-medium">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
