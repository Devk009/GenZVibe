import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import PostCard from "./post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface PostFeedProps {
  endpoint?: string;
  userId?: number;
}

const PostFeed = ({ endpoint = "/api/posts/feed", userId }: PostFeedProps) => {
  const finalEndpoint = userId ? `/api/users/${userId}/posts` : endpoint;
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    isError 
  } = useInfiniteQuery({
    queryKey: [finalEndpoint],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`${finalEndpoint}?offset=${pageParam}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return await res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 5 ? allPages.length * 5 : undefined;
    },
    initialPageParam: 0,
  });

  const loadMoreRef = useRef(null);
  const isInView = useInView(loadMoreRef);

  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isInView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="w-full aspect-square" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-10 text-center">
        <p className="text-destructive">Failed to load posts. Please try again later.</p>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap(page => page) || [];

  if (allPosts.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500 dark:text-gray-400">No posts to show. Start following people to see their posts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {isFetchingNextPage && (
        <div className="py-4 flex justify-center">
          <Skeleton className="h-10 w-40" />
        </div>
      )}
      
      <div ref={loadMoreRef} className="h-10" />
    </div>
  );
};

export default PostFeed;
