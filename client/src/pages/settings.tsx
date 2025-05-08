import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MobileHeader from "@/components/layout/mobile-header";
import Sidebar from "@/components/layout/sidebar";
import BottomNav from "@/components/layout/bottom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, LogOut } from "lucide-react";

const profileFormSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  location: z.string().optional(),
  avatarUrl: z.string().url("Please enter a valid URL").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Settings() {
  const { user, isLoading, isAuthenticated, updateProfile, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      location: user?.location || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        bio: user.bio || "",
        location: user.location || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await updateProfile(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <MobileHeader />
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto hide-scrollbar md:ml-64 p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile details and how you appear to others.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={form.watch("avatarUrl") || user.avatarUrl} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Update your photo using the Avatar URL field below
                          </p>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your display name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is the name displayed on your profile.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Write a short bio about yourself"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Brief description for your profile. Maximum 160 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Your location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="avatarUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Avatar URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/avatar.jpg" {...field} />
                            </FormControl>
                            <FormDescription>
                              Paste a URL to your profile picture
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-primary to-secondary text-white"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account preferences and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Private Account</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Only approved followers can see your content
                        </p>
                      </div>
                      <Switch 
                        onCheckedChange={() => {
                          toast({
                            title: "Coming Soon",
                            description: "This feature will be available soon!",
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Activity Status</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Show when you're active on Vibe
                        </p>
                      </div>
                      <Switch 
                        defaultChecked
                        onCheckedChange={() => {
                          toast({
                            title: "Coming Soon",
                            description: "This feature will be available soon!",
                          });
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Management</h3>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how Vibe looks for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Card 
                        className={`flex-1 cursor-pointer hover:border-primary ${
                          theme === "light" ? "border-primary" : ""
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <CardContent className="p-6 flex flex-col items-center">
                          <Sun className="h-12 w-12 mb-2 text-amber-500" />
                          <h3 className="font-medium">Light</h3>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`flex-1 cursor-pointer hover:border-primary ${
                          theme === "dark" ? "border-primary" : ""
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <CardContent className="p-6 flex flex-col items-center">
                          <Moon className="h-12 w-12 mb-2 text-blue-500" />
                          <h3 className="font-medium">Dark</h3>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`flex-1 cursor-pointer hover:border-primary ${
                          theme === "system" ? "border-primary" : ""
                        }`}
                        onClick={() => setTheme("system")}
                      >
                        <CardContent className="p-6 flex flex-col items-center">
                          <div className="h-12 w-12 mb-2 relative">
                            <Sun className="absolute h-8 w-8 top-0 left-0 text-amber-500" />
                            <Moon className="absolute h-8 w-8 bottom-0 right-0 text-blue-500" />
                          </div>
                          <h3 className="font-medium">System</h3>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
