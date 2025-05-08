import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/layout/mobile-header";
import Sidebar from "@/components/layout/sidebar";
import BottomNav from "@/components/layout/bottom-nav";
import CreatePostButton from "@/components/create-post-button";
import PostFeed from "@/components/post/post-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Grid, Bookmark, Settings } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function Profile() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("posts");
  
  // If userId is provided in the URL, use that, otherwise use the current user's id
  const profileUserId = params.userId ? parseInt(params.userId) : currentUser?.id;
  
  const { data: profileUser, isLoading: isUserLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}`],
    enabled: !!profileUserId,
  });

  const { data: followers, isLoading: isFollowersLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}/followers`],
    enabled: !!profileUserId,
  });

  const { data: following, isLoading: isFollowingLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}/following`],
    enabled: !!profileUserId,
  });

  const { data: isFollowing, isLoading: isFollowStatusLoading } = useQuery({
    queryKey: [`/api/users/${profileUserId}/is-following`],
    enabled: !!profileUserId && !!currentUser && profileUserId !== currentUser.id,
  });

  const isOwnProfile = currentUser?.id === profileUserId;

  const isLoading = isUserLoading || isFollowersLoading || isFollowingLoading || 
                   (isFollowStatusLoading && !isOwnProfile);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader />
        <Sidebar />
        <main className="flex-1 overflow-y-auto hide-scrollbar md:ml-64 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full max-w-sm" />
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader />
        <Sidebar />
        <main className="flex-1 overflow-y-auto hide-scrollbar md:ml-64 p-4">
          <div className="max-w-3xl mx-auto py-10 text-center">
            <h2 className="text-2xl font-semibold">User not found</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <Button className="mt-4" onClick={() => navigate("/")}>
              Go back home
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto hide-scrollbar md:ml-64 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={profileUser.avatarUrl?.startsWith('http') 
                  ? profileUser.avatarUrl 
                  : profileUser.avatarUrl ? `/uploads/images/${profileUser.avatarUrl.split('/').pop()}` : null} 
              />
              <AvatarFallback>{profileUser.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                <h1 className="text-xl font-semibold">{profileUser.username}</h1>
                
                {isOwnProfile ? (
                  <div className="flex mt-3 md:mt-0 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex mt-3 md:mt-0 space-x-2">
                    <Button variant={isFollowing?.isFollowing ? "outline" : "default"} size="sm">
                      {isFollowing?.isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button variant="outline" size="sm">
                      Message
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4 mt-4">
                <div>
                  <span className="font-semibold">{formatNumber(followers?.length || 0)}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">followers</span>
                </div>
                <div>
                  <span className="font-semibold">{formatNumber(following?.length || 0)}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">following</span>
                </div>
              </div>
              
              {profileUser.displayName && (
                <p className="font-medium mt-2">{profileUser.displayName}</p>
              )}
              
              {profileUser.bio && (
                <p className="mt-1 text-gray-700 dark:text-gray-300">{profileUser.bio}</p>
              )}
              
              {profileUser.location && (
                <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                  {profileUser.location}
                </p>
              )}
            </div>
          </div>
          
          {/* Profile Tabs */}
          <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts" className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center">
                <Bookmark className="h-4 w-4 mr-2" />
                Saved
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-6">
              <PostFeed userId={profileUserId} />
            </TabsContent>
            
            <TabsContent value="saved" className="mt-6">
              <div className="py-10 text-center">
                <Bookmark className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Saved items will appear here
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <CreatePostButton />
      <BottomNav />
    </div>
  );
}
