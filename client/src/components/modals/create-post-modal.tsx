import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, ImageIcon } from "lucide-react";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  caption: z.string().min(1, "Caption is required"),
  imageUrl: z.string().url("Please enter a valid image URL"),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreatePostModal = ({ open, onOpenChange }: CreatePostModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: "",
      imageUrl: "",
      location: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/posts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/posts`] });
      }
      
      form.reset();
      setPreviewUrl(null);
      onOpenChange(false);
      
      toast({
        title: "Post created",
        description: "Your post has been successfully created!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post",
        variant: "destructive",
      });
      return;
    }
    
    createPostMutation.mutate(data);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("imageUrl", url);
    
    // Update preview if it's a valid URL
    if (url.match(/^https?:\/\/.+\..+/)) {
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Post</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/image.jpg" 
                      {...field} 
                      onChange={handleImageUrlChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {previewUrl ? (
              <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => {
                    form.setValue("imageUrl", "");
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="aspect-square rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center p-6">
                  <ImageIcon className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Enter an image URL above to preview
                  </p>
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write a caption..." 
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Add location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createPostMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending}
                className="bg-gradient-to-r from-primary to-secondary text-white"
              >
                {createPostMutation.isPending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    Share Post
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
