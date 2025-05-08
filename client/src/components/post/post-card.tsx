import { useState } from "react";
import { formatTimestamp } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, MoreHorizontal, MapPin, Bookmark } from "lucide-react";

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
    postType: string; // 'text', 'image', or 'video'
    mediaPath?: string; // Path to the media file
    mediaType?: string; // MIME type of the media
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
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLiked, setIsLiked] = useState(post.hasLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getPostComments = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    }
  };
  
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to like posts");
      
      const url = `/api/posts/${post.id}/like`;
      const method = isLiked ? "DELETE" : "POST";
      
      const response = await apiRequest(method, url);
      return await response.json();
    },
    onMutate: () => {
      // Optimistically update UI
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    },
    onError: (error) => {
      // Revert changes on error
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update like status",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
  });
  
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to comment");
      if (!commentText.trim()) throw new Error("Comment cannot be empty");
      
      const response = await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content: commentText,
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      setComments([...comments, data]);
      setCommentText("");
      
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });
  
  const handleToggleComments = () => {
    if (!showComments) {
      getPostComments();
    }
    setShowComments(!showComments);
  };
  
  const handleToggleLike = () => {
    toggleLikeMutation.mutate();
  };
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    addCommentMutation.mutate();
  };
  
  // Helper to render the media content based on post type
  const renderMediaContent = () => {
    const mediaUrl = post.mediaPath?.startsWith('http') 
      ? post.mediaPath 
      : post.mediaPath ? `/uploads/images/${post.mediaPath.split('/').pop()}` : null;
    
    switch (post.postType) {
      case 'image':
        return (
          <img
            src={mediaUrl}
            alt={post.caption}
            className="w-full h-auto rounded-sm"
          />
        );
      case 'video':
        return (
          <video
            src={mediaUrl}
            controls
            className="w-full h-auto rounded-sm"
          />
        );
      case 'text':
      default:
        return (
          <div className="bg-muted p-6 text-lg font-medium">
            {post.caption}
          </div>
        );
    }
  };
  
  return (
    <div className="border rounded-md bg-background overflow-hidden mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.user.avatarUrl} alt={post.user.username} />
            <AvatarFallback>
              {post.user.displayName?.[0] || post.user.username[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">
              {post.user.displayName || post.user.username}
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              {post.location && (
                <>
                  <MapPin size={12} className="mr-1" />
                  {post.location}
                </>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Post Content - conditionally render based on type */}
      {post.postType !== 'text' && renderMediaContent()}
      
      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 ${isLiked ? "text-red-500" : ""}`}
              onClick={handleToggleLike}
              disabled={toggleLikeMutation.isPending}
            >
              <Heart
                className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleToggleComments}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bookmark className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Likes count */}
        <div className="font-semibold text-sm mb-1">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </div>
        
        {/* Only show caption separately for non-text posts */}
        {post.postType !== 'text' && (
          <div className="mb-1">
            <span className="font-semibold text-sm mr-2">
              {post.user.username}
            </span>
            <span className="text-sm">{post.caption}</span>
          </div>
        )}
        
        {/* Post date */}
        <div className="text-xs text-muted-foreground mt-1">
          {formatTimestamp(new Date(post.createdAt))}
        </div>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-2">
          <Separator className="my-2" />
          
          {comments.length > 0 ? (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={comment.user.avatarUrl}
                      alt={comment.user.username}
                    />
                    <AvatarFallback>
                      {comment.user.displayName?.[0] || comment.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold mr-2">
                        {comment.user.username}
                      </span>
                      {comment.content}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(new Date(comment.createdAt))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground my-2">
              No comments yet. Be the first to comment!
            </div>
          )}
          
          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="flex items-center">
            <Textarea
              placeholder="Add a comment..."
              className="min-h-0 resize-none text-sm py-2"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={1}
            />
            <Button
              type="submit"
              variant="ghost"
              className="text-primary font-semibold ml-2"
              disabled={
                !commentText.trim() || addCommentMutation.isPending
              }
            >
              Post
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;