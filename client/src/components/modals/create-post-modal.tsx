import { useState, useRef } from "react";
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
});

type FormValues = z.infer<typeof formSchema>;

const CreatePostModal = ({ open, onOpenChange }: CreatePostModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("text");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: "",
      location: "",
    },
  });
  
  const createPostMutation = useMutation({
    mutationFn: async (data: FormValues & { media?: File }) => {
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append("caption", data.caption);
      
      if (data.location) {
        formData.append("location", data.location);
      }
      
      // Add type based on active tab
      formData.append("type", activeTab);
      
      // Add media file if present
      if (data.media) {
        formData.append("media", data.media);
      }
      
      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      });
      
      if (!res.ok) {
        throw new Error("Failed to create post");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your post has been created",
      });
      
      // Reset form and close modal
      form.reset();
      setMediaPreview(null);
      setMediaFile(null);
      setActiveTab("text");
      onOpenChange(false);
      
      // Invalidate posts queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setMediaFile(file);
    
    // Create and set preview URL
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    
    // Set active tab based on file type
    if (file.type.startsWith("image/")) {
      setActiveTab("image");
    } else if (file.type.startsWith("video/")) {
      setActiveTab("video");
    }
  };
  
  const clearMedia = () => {
    setMediaPreview(null);
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const onSubmit = (values: FormValues) => {
    if (activeTab !== "text" && !mediaFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    // Add media to the form data if present
    createPostMutation.mutate({
      ...values,
      media: mediaFile || undefined,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type size={16} />
              <span>Text</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon size={16} />
              <span>Image</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video size={16} />
              <span>Video</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caption</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's on your mind?"
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
                
                {(activeTab === "image" || activeTab === "video") && (
                  <div className="space-y-2">
                    <FormLabel>
                      {activeTab === "image" ? "Image" : "Video"}
                    </FormLabel>
                    
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={activeTab === "image" ? "image/*" : "video/*"}
                    />
                    
                    {!mediaPreview ? (
                      <div
                        onClick={triggerFileInput}
                        className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted"
                      >
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload a {activeTab === "image" ? "photo" : "video"}
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-md overflow-hidden border">
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="absolute right-2 top-2 bg-black/60 rounded-full p-1 text-white z-10"
                        >
                          <X size={16} />
                        </button>
                        
                        {activeTab === "image" && (
                          <img
                            src={mediaPreview}
                            alt="Preview"
                            className="w-full h-auto max-h-[300px] object-contain"
                          />
                        )}
                        
                        {activeTab === "video" && (
                          <video
                            src={mediaPreview}
                            controls
                            className="w-full h-auto max-h-[300px]"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? "Posting..." : "Post"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;