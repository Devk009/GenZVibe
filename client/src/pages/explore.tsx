import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/layout/mobile-header";
import Sidebar from "@/components/layout/sidebar";
import BottomNav from "@/components/layout/bottom-nav";
import CreatePostButton from "@/components/create-post-button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts'],
    enabled: activeTab === "posts",
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!searchQuery.trim(),
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile Header - only shown on mobile */}
      <MobileHeader />
      
      {/* Desktop Sidebar - only shown on desktop */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar md:ml-64 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users, hashtags, or locations..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          {searchQuery ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Search Results</h2>
              
              {searchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults?.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((user: any) => (
                    <motion.div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => handleUserClick(user.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        {user.displayName && (
                          <p className="text-sm text-gray-500">{user.displayName}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">No users found matching "{searchQuery}"</p>
              )}
            </div>
          ) : (
            <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="posts">Popular Posts</TabsTrigger>
                <TabsTrigger value="hashtags">Trending Hashtags</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="mt-0">
                {postsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="aspect-square rounded-md" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {posts?.map((post: any) => (
                      <motion.div 
                        key={post.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative aspect-square rounded-md overflow-hidden cursor-pointer"
                        onClick={() => {
                          toast({
                            title: "Coming Soon",
                            description: "Post detail view will be available soon!",
                          });
                        }}
                      >
                        <img 
                          src={post.imageUrl} 
                          alt={`Post by ${post.user.username}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="hashtags">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {['#genz', '#vibecheck', '#aesthetic', '#foryou', '#trendsetter'].map((tag) => (
                        <motion.div 
                          key={tag}
                          className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Hashtag search will be available soon!",
                            });
                          }}
                        >
                          <p className="font-semibold text-primary">{tag}</p>
                          <p className="text-sm text-gray-500">Trending with Gen Z</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      {/* Create Post Button - only shown on mobile */}
      <CreatePostButton />
      
      {/* Mobile Bottom Navigation - only shown on mobile */}
      <BottomNav />
    </div>
  );
}
