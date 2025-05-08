import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likePost, unlikePost, formatTimestamp, formatNumber } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface PostComment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface PostCardProps {
  post: {
    id: number;
    caption: string;
    imageUrl: string;
    location?: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
      displayName?: string;
      location?: string;
      avatarUrl?: string;
    };
    likes: number;
    comments: number;
    hasLiked: boolean;
  };
  onCommentAdded?: () => void;
}

const PostCard = ({ post, onCommentAdded }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await unlikePost(post.id);
        return false;
      } else {
        await likePost(post.id);
        return true;
      }
    },
    onMutate: (variables) => {
      // Optimistic update
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: (error) => {
      // Revert on error
      setIsLiked(post.hasLiked);
      setLikeCount(post.likes);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
    onSuccess: (liked) => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/posts/${post.id}/comments`, { content });
      return response.json();
    },
    onSuccess: (data) => {
      setNewComment("");
      if (comments.length > 0) {
        setComments([...comments, data]);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      if (onCommentAdded) onCommentAdded();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  });

  const handleLikeClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }
    if (newComment.trim()) {
      commentMutation.mutate(newComment);
    }
  };

  const loadComments = async () => {
    if (!showComments && comments.length === 0) {
      setIsCommentsLoading(true);
      try {
        const response = await fetch(`/api/posts/${post.id}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        });
      } finally {
        setIsCommentsLoading(false);
      }
    }
    setShowComments(!showComments);
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm mb-6 transition-all hover:shadow-md">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={post.user.avatarUrl} />
            <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-sm">{post.user.username}</h3>
            {post.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{post.location}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user && user.id === post.user.id && (
              <DropdownMenuItem>Delete Post</DropdownMenuItem>
            )}
            <DropdownMenuItem>Report</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="relative bg-gray-100 dark:bg-gray-800">
        {post.type === 'text' ? (
          <div className="p-6 min-h-[200px] flex items-center justify-center">
            <p className="text-lg">{post.caption}</p>
          </div>
        ) : post.type === 'image' ? (
          <div className="aspect-square">
            <img 
              src={post.mediaUrl} 
              alt={`Post by ${post.user.username}`} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : post.type === 'video' ? (
          <div className="aspect-video">
            <video 
              src={post.mediaUrl} 
              controls 
              className="w-full h-full"
              preload="metadata"
            />
          </div>
        ) : null}
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              className={`flex items-center justify-center transition-transform hover:scale-110 ${isLiked ? 'text-secondary' : ''}`}
              onClick={handleLikeClick}
              whileTap={{ scale: 0.9 }}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              className="flex items-center justify-center transition-transform hover:scale-110"
              onClick={loadComments}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.button>
            <motion.button
              className="flex items-center justify-center transition-transform hover:scale-110"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Sharing feature will be available soon!",
                });
              }}
            >
              <Share2 className="h-6 w-6" />
            </motion.button>
          </div>
          <motion.button
            className="flex items-center justify-center transition-transform hover:scale-110"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Bookmark feature will be available soon!",
              });
            }}
          >
            <Bookmark className="h-6 w-6" />
          </motion.button>
        </div>
        
        <div>
          <p className="text-sm font-medium">{formatNumber(likeCount)} likes</p>
          <div className="mt-1">
            <p className="text-sm">
              <span className="font-semibold">{post.user.username}</span>{" "}
              <span>{post.caption}</span>
            </p>
          </div>
          
          {post.comments > 0 && (
            <button 
              className="text-gray-500 dark:text-gray-400 text-sm mt-1"
              onClick={loadComments}
            >
              View all {post.comments} comments
            </button>
          )}
          
          {showComments && (
            <div className="mt-2 space-y-2">
              {isCommentsLoading ? (
                <p className="text-sm text-gray-500">Loading comments...</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <p className="text-sm">
                      <span className="font-semibold">{comment.user.username}</span>{" "}
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {formatTimestamp(post.createdAt)}
          </p>
        </div>
        
        <form 
          className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center"
          onSubmit={handleCommentSubmit}
        >
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "G"}</AvatarFallback>
          </Avatar>
          <Input
            type="text"
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="ghost" 
            className="text-primary font-medium text-sm"
            disabled={!newComment.trim() || commentMutation.isPending}
          >
            Post
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PostCard;
