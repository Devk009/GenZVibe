import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import MobileHeader from "@/components/layout/mobile-header";
import Sidebar from "@/components/layout/sidebar";
import BottomNav from "@/components/layout/bottom-nav";
import CreatePostButton from "@/components/create-post-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartIcon, UserPlusIcon, MessageSquareIcon, AtSignIcon } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Notification = {
  id: number;
  type: "like" | "follow" | "comment" | "mention";
  userId: number;
  username: string;
  avatarUrl?: string;
  content: string;
  time: string;
};

export default function Notifications() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Mock notifications data - this would normally come from the API
  const notifications: Notification[] = [
    {
      id: 1,
      type: "like",
      userId: 2,
      username: "jay.k",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
      content: "liked your post",
      time: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
    },
    {
      id: 2,
      type: "follow",
      userId: 5,
      username: "lisa.png",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      content: "started following you",
      time: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutes ago
    },
    {
      id: 3,
      type: "comment",
      userId: 3,
      username: "miachill",
      avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04",
      content: "commented on your post: \"love this vibe!\"",
      time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 4,
      type: "mention",
      userId: 4,
      username: "alex.vibe",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce",
      content: "mentioned you in a comment: \"@user1 check this out!\"",
      time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
      id: 5,
      type: "like",
      userId: 6,
      username: "ty.creative",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
      content: "liked your comment",
      time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <HeartIcon className="h-4 w-4 text-secondary" />;
      case "follow":
        return <UserPlusIcon className="h-4 w-4 text-primary" />;
      case "comment":
        return <MessageSquareIcon className="h-4 w-4 text-accent" />;
      case "mention":
        return <AtSignIcon className="h-4 w-4 text-primary" />;
      default:
        return <HeartIcon className="h-4 w-4 text-secondary" />;
    }
  };

  if (isLoading || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <MobileHeader />
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto hide-scrollbar md:ml-64 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Notifications</h1>
          
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="follows">Follows</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {notifications.map(notification => (
                <motion.div
                  key={notification.id}
                  className="bg-white dark:bg-surface-dark rounded-lg p-4 flex items-start space-x-3 shadow-sm hover:shadow-md transition-all"
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => navigate(`/profile/${notification.userId}`)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.avatarUrl} />
                      <AvatarFallback>{notification.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{notification.username}</span>{" "}
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(notification.time)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </TabsContent>
            
            <TabsContent value="mentions" className="space-y-4">
              {notifications
                .filter(n => n.type === "mention")
                .map(notification => (
                  <motion.div
                    key={notification.id}
                    className="bg-white dark:bg-surface-dark rounded-lg p-4 flex items-start space-x-3 shadow-sm hover:shadow-md transition-all"
                    whileHover={{ scale: 1.01 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => navigate(`/profile/${notification.userId}`)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.avatarUrl} />
                        <AvatarFallback>{notification.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{notification.username}</span>{" "}
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTimestamp(notification.time)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {notifications.filter(n => n.type === "mention").length === 0 && (
                  <div className="text-center py-10">
                    <AtSignIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No mentions yet</p>
                  </div>
                )}
            </TabsContent>
            
            <TabsContent value="follows" className="space-y-4">
              {notifications
                .filter(n => n.type === "follow")
                .map(notification => (
                  <motion.div
                    key={notification.id}
                    className="bg-white dark:bg-surface-dark rounded-lg p-4 flex items-start space-x-3 shadow-sm hover:shadow-md transition-all"
                    whileHover={{ scale: 1.01 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => navigate(`/profile/${notification.userId}`)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.avatarUrl} />
                        <AvatarFallback>{notification.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{notification.username}</span>{" "}
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTimestamp(notification.time)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {notifications.filter(n => n.type === "follow").length === 0 && (
                  <div className="text-center py-10">
                    <UserPlusIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No new followers yet</p>
                  </div>
                )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <CreatePostButton />
      <BottomNav />
    </div>
  );
}
