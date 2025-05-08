import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import MobileHeader from "@/components/layout/mobile-header";
import Sidebar from "@/components/layout/sidebar";
import BottomNav from "@/components/layout/bottom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type UserMessage = {
  id: number;
  userId: number;
  username: string;
  avatarUrl?: string;
  lastMessage: string;
  time: string;
  unread: boolean;
};

export default function Messages() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const messages: UserMessage[] = [
    {
      id: 1,
      userId: 2,
      username: "jay.k",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
      lastMessage: "Did you see the new vinyl shop downtown?",
      time: "12:45 PM",
      unread: true
    },
    {
      id: 2,
      userId: 5,
      username: "lisa.png",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      lastMessage: "Let's meet up for coffee this weekend!",
      time: "Yesterday",
      unread: false
    },
    {
      id: 3,
      userId: 3,
      username: "miachill",
      avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04",
      lastMessage: "Can you send me those concert tickets?",
      time: "Monday",
      unread: false
    },
    {
      id: 4,
      userId: 4,
      username: "alex.vibe",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce",
      lastMessage: "Thanks for the music recommendations!",
      time: "Apr 15",
      unread: false
    }
  ];

  const handleMessageClick = (userId: number) => {
    toast({
      title: "Coming Soon",
      description: "Direct messaging will be available soon!",
    });
  };

  if (isLoading || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <MobileHeader />
      <Sidebar />
      
      <main className="flex-1 overflow-hidden md:ml-64">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Message List (sidebar) */}
          <div className="border-r border-gray-200 dark:border-gray-800 md:block">
            <div className="p-4">
              <h1 className="text-xl font-bold mb-4">Messages</h1>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search messages"
                  className="pl-9"
                />
              </div>
              
              <Tabs defaultValue="primary">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="primary">Primary</TabsTrigger>
                  <TabsTrigger value="requests">Requests</TabsTrigger>
                </TabsList>
                
                <TabsContent value="primary" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-240px)]">
                    <div className="space-y-2">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={`p-3 rounded-lg flex items-center space-x-3 cursor-pointer ${
                            message.unread 
                              ? 'bg-gray-100 dark:bg-gray-800' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleMessageClick(message.userId)}
                        >
                          <Avatar>
                            <AvatarImage src={message.avatarUrl} />
                            <AvatarFallback>{message.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium truncate">{message.username}</h3>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {message.time}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${
                              message.unread 
                                ? 'font-medium text-gray-900 dark:text-gray-100' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {message.lastMessage}
                            </p>
                          </div>
                          {message.unread && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="requests">
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-240px)]">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      No message requests at this time
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Message Content (right side) */}
          <div className="hidden md:flex md:col-span-2 flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-80 border-none shadow-none bg-transparent">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Send className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
                  Send private messages to your friends and connections
                </p>
                <Button 
                  className="bg-gradient-to-r from-primary to-secondary text-white"
                  onClick={() => toast({
                    title: "Coming Soon",
                    description: "New message composition will be available soon!",
                  })}
                >
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
