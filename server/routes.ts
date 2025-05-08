import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertPostSchema, insertCommentSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import path from "path";
import multer from "multer";
import fs from "fs";

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['uploads', 'uploads/images', 'uploads/videos'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Configure storage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    createUploadDirs();
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/images');
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, 'uploads/videos');
    } else {
      cb(null, 'uploads'); // Default location
    }
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp and original extension
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniquePrefix + ext);
  }
});

// File filter to restrict file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images and videos only
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Helper function to determine post type from mimetype
const getPostTypeFromMimetype = (mimetype: string | undefined): string => {
  if (!mimetype) return 'text';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'text';
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);

  // Setup media routes
  app.use('/media', (req, res, next) => {
    const filePath = path.join(process.cwd(), req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    
    next();
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes are handled by setupAuth(app)

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await dbStorage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.get("/api/users/:username/exists", async (req, res) => {
    try {
      const user = await dbStorage.getUserByUsername(req.params.username);
      res.status(200).json({ exists: !!user });
    } catch (error) {
      res.status(500).json({ message: "Error checking username" });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const users = await dbStorage.searchUsers(query);
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error searching users" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      if (currentUser.id !== userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const updatedUser = await dbStorage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Post routes
  app.post("/api/posts", isAuthenticated, upload.single("media"), async (req, res) => {
    try {
      const currentUser = req.user as any;
      const { caption, location } = req.body;
      
      // Determine post type and media info
      const postType = req.file ? getPostTypeFromMimetype(req.file.mimetype) : 'text';
      const mediaPath = req.file ? req.file.path : null;
      const mediaType = req.file ? req.file.mimetype : null;
      
      const postData = { 
        userId: currentUser.id,
        caption,
        location,
        postType,
        mediaPath,
        mediaType
      };
      
      const parsedData = insertPostSchema.parse(postData);
      const post = await dbStorage.createPost(parsedData);
      
      // Get user data to return with post
      const user = await dbStorage.getUser(currentUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        ...post,
        user: userWithoutPassword,
        likes: 0,
        comments: 0,
        hasLiked: false
      });
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating post" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const posts = await dbStorage.getPosts(limit, offset);
      const postsWithUserData = await Promise.all(posts.map(async (post) => {
        const user = await dbStorage.getUser(post.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        
        const likes = await dbStorage.getLikesByPost(post.id);
        const comments = await dbStorage.getCommentsByPost(post.id);
        
        let hasLiked = false;
        if (req.isAuthenticated()) {
          const currentUser = req.user as any;
          hasLiked = await dbStorage.hasUserLikedPost(currentUser.id, post.id);
        }
        
        return {
          ...post,
          user: userWithoutPassword,
          likes: likes.length,
          comments: comments.length,
          hasLiked
        };
      }));
      
      const filteredPosts = postsWithUserData.filter(post => post !== null);
      res.status(200).json(filteredPosts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts" });
    }
  });

  app.get("/api/posts/feed", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const posts = await dbStorage.getFeedPosts(currentUser.id);
      
      const postsWithUserData = await Promise.all(posts.map(async (post) => {
        const user = await dbStorage.getUser(post.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        
        const likes = await dbStorage.getLikesByPost(post.id);
        const comments = await dbStorage.getCommentsByPost(post.id);
        const hasLiked = await dbStorage.hasUserLikedPost(currentUser.id, post.id);
        
        return {
          ...post,
          user: userWithoutPassword,
          likes: likes.length,
          comments: comments.length,
          hasLiked
        };
      }));
      
      const filteredPosts = postsWithUserData.filter(post => post !== null);
      res.status(200).json(filteredPosts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching feed" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await dbStorage.getPost(parseInt(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const user = await dbStorage.getUser(post.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      const likes = await dbStorage.getLikesByPost(post.id);
      const comments = await dbStorage.getCommentsByPost(post.id);
      
      let hasLiked = false;
      if (req.isAuthenticated()) {
        const currentUser = req.user as any;
        hasLiked = await dbStorage.hasUserLikedPost(currentUser.id, post.id);
      }
      
      res.status(200).json({
        ...post,
        user: userWithoutPassword,
        likes: likes.length,
        comments: comments.length,
        hasLiked
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching post" });
    }
  });

  app.get("/api/users/:id/posts", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const posts = await dbStorage.getUserPosts(userId);
      
      const postsWithData = await Promise.all(posts.map(async (post) => {
        const user = await dbStorage.getUser(userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        
        const likes = await dbStorage.getLikesByPost(post.id);
        const comments = await dbStorage.getCommentsByPost(post.id);
        
        let hasLiked = false;
        if (req.isAuthenticated()) {
          const currentUser = req.user as any;
          hasLiked = await dbStorage.hasUserLikedPost(currentUser.id, post.id);
        }
        
        return {
          ...post,
          user: userWithoutPassword,
          likes: likes.length,
          comments: comments.length,
          hasLiked
        };
      }));
      
      const filteredPosts = postsWithData.filter(post => post !== null);
      res.status(200).json(filteredPosts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user posts" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await dbStorage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const currentUser = req.user as any;
      if (post.userId !== currentUser.id) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      // Delete the media file if it exists
      if (post.mediaPath && fs.existsSync(post.mediaPath)) {
        fs.unlinkSync(post.mediaPath);
      }
      
      const deleted = await dbStorage.deletePost(postId);
      if (!deleted) {
        return res.status(404).json({ message: "Post not found or already deleted" });
      }
      
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting post" });
    }
  });

  // Like routes
  app.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      const post = await dbStorage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const like = await dbStorage.createLike({ userId: currentUser.id, postId });
      res.status(201).json(like);
    } catch (error) {
      res.status(500).json({ message: "Error liking post" });
    }
  });

  app.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      const deleted = await dbStorage.deleteLike(currentUser.id, postId);
      if (!deleted) {
        return res.status(404).json({ message: "Like not found or already deleted" });
      }
      
      res.status(200).json({ message: "Like removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error unliking post" });
    }
  });

  // Comment routes
  app.post("/api/posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      const post = await dbStorage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const commentData = { 
        ...req.body, 
        userId: currentUser.id, 
        postId 
      };
      
      const parsedData = insertCommentSchema.parse(commentData);
      const comment = await dbStorage.createComment(parsedData);
      
      const user = await dbStorage.getUser(currentUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        ...comment,
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating comment" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      const post = await dbStorage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await dbStorage.getCommentsByPost(postId);
      
      const commentsWithUserData = await Promise.all(comments.map(async (comment) => {
        const user = await dbStorage.getUser(comment.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        
        return {
          ...comment,
          user: userWithoutPassword
        };
      }));
      
      const filteredComments = commentsWithUserData.filter(comment => comment !== null);
      res.status(200).json(filteredComments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  // Follow routes
  app.post("/api/users/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      if (followingId === currentUser.id) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
      
      const userToFollow = await dbStorage.getUser(followingId);
      if (!userToFollow) {
        return res.status(404).json({ message: "User to follow not found" });
      }
      
      const follow = await dbStorage.createFollow({ 
        followerId: currentUser.id, 
        followingId 
      });
      
      res.status(201).json(follow);
    } catch (error) {
      res.status(500).json({ message: "Error following user" });
    }
  });

  app.delete("/api/users/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      const deleted = await dbStorage.deleteFollow(currentUser.id, followingId);
      if (!deleted) {
        return res.status(404).json({ message: "Follow relationship not found or already deleted" });
      }
      
      res.status(200).json({ message: "Unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error unfollowing user" });
    }
  });

  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const followers = await dbStorage.getFollowers(userId);
      
      const followersWithoutPasswords = followers.map(follower => {
        const { password, ...followerWithoutPassword } = follower;
        return followerWithoutPassword;
      });
      
      res.status(200).json(followersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching followers" });
    }
  });

  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const following = await dbStorage.getFollowing(userId);
      
      const followingWithoutPasswords = following.map(followedUser => {
        const { password, ...followedUserWithoutPassword } = followedUser;
        return followedUserWithoutPassword;
      });
      
      res.status(200).json(followingWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching following" });
    }
  });

  app.get("/api/users/:id/is-following", isAuthenticated, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      const isFollowing = await dbStorage.isFollowing(currentUser.id, followingId);
      res.status(200).json({ isFollowing });
    } catch (error) {
      res.status(500).json({ message: "Error checking follow status" });
    }
  });

  // Story routes
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await dbStorage.getActiveStories();
      
      const storiesWithUserData = await Promise.all(stories.map(async (story) => {
        const user = await dbStorage.getUser(story.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        
        return {
          ...story,
          user: userWithoutPassword
        };
      }));
      
      const filteredStories = storiesWithUserData.filter(story => story !== null);
      res.status(200).json(filteredStories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stories" });
    }
  });

  app.get("/api/users/:id/stories", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stories = await dbStorage.getUserStories(userId);
      
      const storiesWithUserData = stories.map(story => {
        const { password, ...userWithoutPassword } = user;
        
        return {
          ...story,
          user: userWithoutPassword
        };
      });
      
      res.status(200).json(storiesWithUserData);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user stories" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}