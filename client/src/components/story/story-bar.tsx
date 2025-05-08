import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StoryUser {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface Story {
  id: number;
  userId: number;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
  user: StoryUser;
}

const StoryBar = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stories, isLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
  });

  const handleAddStory = () => {
    toast({
      title: "Coming Soon",
      description: "Story creation will be available soon!",
    });
  };

  const handleStoryClick = (story: Story) => {
    toast({
      title: "Coming Soon",
      description: "Story viewing will be available soon!",
    });
  };

  if (isLoading) {
    return (
      <div className="py-4 px-2 overflow-x-auto hide-scrollbar">
        <div className="flex space-x-4 px-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="mt-1 w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-2 overflow-x-auto hide-scrollbar" ref={scrollRef}>
      <div className="flex space-x-4 px-2">
        {/* User's own story/add story button */}
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary via-secondary to-accent">
              <div className="w-full h-full rounded-full border-2 border-white dark:border-background overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="default"
              className="absolute bottom-0 right-0 bg-accent text-surface-darker rounded-full p-1 shadow-lg transform transition-transform group-hover:scale-110 h-6 w-6"
              onClick={handleAddStory}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-xs mt-1">Your story</span>
        </div>
        
        {/* Other users' stories */}
        {stories?.map((story) => (
          <motion.div 
            key={story.id} 
            className="flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStoryClick(story)}
          >
            <div className={cn(
              "w-16 h-16 rounded-full p-[2px] cursor-pointer",
              "bg-gradient-45 from-[#8A2BE2] via-[#FF3366] to-[#00FFCC] bg-size-200 animate-gradient"
            )}>
              <div className="w-full h-full rounded-full border-2 border-white dark:border-background overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarImage src={story.user.avatarUrl} />
                  <AvatarFallback>{story.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs mt-1">{story.user.username}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StoryBar;
