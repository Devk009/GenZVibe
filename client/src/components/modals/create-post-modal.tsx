
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
import { X, Upload, ImageIcon, Video, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  caption: z.string().min(1, "Caption is required"),
  location: z.string().optional(),
  type: z.enum(["text", "image", "video"]),
  media: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreatePostModal = ({ open, onOpenChange }: CreatePostModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: "",
      location: "",
      type: "text",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append("caption", data.caption);
      if (data.location) formData.append("location", data.location);
      formData.append("type", data.type);
      if (data.media) formData.append("media", data.media);

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to create post");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/posts`] });
      }
      
      form.reset();
      setPreview(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    form.setValue("media", file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Post</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="text" onValueChange={(value) => form.setValue("type", value as "text" | "image" | "video")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">
                  <Type className="w-4 h-4 mr-2" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="image">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video">
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="pt-4">
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What's on your mind?" 
                          className="resize-none min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="image" className="pt-4">
                <FormField
                  control={form.control}
                  name="media"
                  render={() => (
                    <FormItem>
                      <FormLabel>Upload Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {preview && (
                  <div className="relative mt-4 aspect-square rounded-md overflow-hidden">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => {
                        form.setValue("media", undefined);
                        setPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem className="mt-4">
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
              </TabsContent>

              <TabsContent value="video" className="pt-4">
                <FormField
                  control={form.control}
                  name="media"
                  render={() => (
                    <FormItem>
                      <FormLabel>Upload Video</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {preview && (
                  <div className="relative mt-4 aspect-video rounded-md overflow-hidden">
                    <video src={preview} controls className="w-full h-full" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => {
                        form.setValue("media", undefined);
                        setPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem className="mt-4">
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
              </TabsContent>
            </Tabs>

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
