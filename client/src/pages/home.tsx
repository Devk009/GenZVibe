import { useAuth } from "@/hooks/use-auth";
import MobileHeader from "@/components/layout/mobile-header";
import Sidebar from "@/components/layout/sidebar";
import BottomNav from "@/components/layout/bottom-nav";
import StoryBar from "@/components/story/story-bar";
import PostFeed from "@/components/post/post-feed";
import CreatePostButton from "@/components/create-post-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-24 mt-4" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile Header - only shown on mobile */}
      <MobileHeader />
      
      {/* Desktop Sidebar - only shown on desktop */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar md:ml-64">
        {/* Stories */}
        <StoryBar />
        
        {/* Post Feed */}
        <div className="px-4">
          <PostFeed />
        </div>
      </main>
      
      {/* Create Post Button - only shown on mobile */}
      <CreatePostButton />
      
      {/* Mobile Bottom Navigation - only shown on mobile */}
      <BottomNav />
    </div>
  );
}
