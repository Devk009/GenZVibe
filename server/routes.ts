import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertPostSchema, insertCommentSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import multer from "multer";
import { Client } from "@replit/object-storage";

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const objectStorage = new Client();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);

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
      const user = await storage.getUser(parseInt(req.params.id));
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
      const user = await storage.getUserByUsername(req.params.username);
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

      const users = await storage.searchUsers(query);
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

      const updatedUser = await storage.updateUser(userId, req.body);
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
      const { caption, location, type } = req.body;

      let mediaUrl;
      if (req.file) {
        const filename = `${Date.now()}-${req.file.originalname}`;
        await objectStorage.upload(filename, req.file.buffer);
        mediaUrl = await objectStorage.getSignedUrl(filename);
      }

      const postData = { 
        userId: currentUser.id,
        caption,
        location,
        type,
        ...(mediaUrl && { mediaUrl })
      };

      const parsedData = insertPostSchema.parse(postData);
      const post = await storage.createPost(parsedData);
      res.status(201).json(post);
    } catch (error) {
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

      const posts = await storage.getPosts(limit, offset);
      const postsWithUserData = await Promise.all(posts.map(async (post) => {
        const user = await storage.getUser(post.userId);
        if (!user) return null;

        const { password, ...userWithoutPassword } = user;

        const likes = await storage.getLikesByPost(post.id);
        const comments = await storage.getCommentsByPost(post.id);

        let hasLiked = false;
        if (req.isAuthenticated()) {
          const currentUser = req.user as any;
          hasLiked = await storage.hasUserLikedPost(currentUser.id, post.id);
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
      const posts = await storage.getFeedPosts(currentUser.id);

      const postsWithUserData = await Promise.all(posts.map(async (post) => {
        const user = await storage.getUser(post.userId);
        if (!user) return null;

        const { password, ...userWithoutPassword } = user;

        const likes = await storage.getLikesByPost(post.id);
        const comments = await storage.getCommentsByPost(post.id);
        const hasLiked = await storage.hasUserLikedPost(currentUser.id, post.id);

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
      const post = await storage.getPost(parseInt(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const user = await storage.getUser(post.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;

      const likes = await storage.getLikesByPost(post.id);
      const comments = await storage.getCommentsByPost(post.id);

      let hasLiked = false;
      if (req.isAuthenticated()) {
        const currentUser = req.user as any;
        hasLiked = await storage.hasUserLikedPost(currentUser.id, post.id);
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
      const posts = await storage.getUserPosts(userId);

      const postsWithData = await Promise.all(posts.map(async (post) => {
        const user = await storage.getUser(userId);
        if (!user) return null;

        const { password, ...userWithoutPassword } = user;

        const likes = await storage.getLikesByPost(post.id);
        const comments = await storage.getCommentsByPost(post.id);

        let hasLiked = false;
        if (req.isAuthenticated()) {
          const currentUser = req.user as any;
          hasLiked = await storage.hasUserLikedPost(currentUser.id, post.id);
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
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const currentUser = req.user as any;
      if (post.userId !== currentUser.id) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }

      const deleted = await storage.deletePost(postId);
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

      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const like = await storage.createLike({ userId: currentUser.id, postId });
      res.status(201).json(like);
    } catch (error) {
      res.status(500).json({ message: "Error liking post" });
    }
  });

  app.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUser = req.user as any;

      const deleted = await storage.deleteLike(currentUser.id, postId);
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

      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const commentData = { 
        ...req.body, 
        userId: currentUser.id, 
        postId 
      };

      const parsedData = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(parsedData);

      const user = await storage.getUser(currentUser.id);
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

      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const comments = await storage.getCommentsByPost(postId);

      const commentsWithUserData = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
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

      const userToFollow = await storage.getUser(followingId);
      if (!userToFollow) {
        return res.status(404).json({ message: "User to follow not found" });
      }

      const follow = await storage.createFollow({ 
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

      const deleted = await storage.deleteFollow(currentUser.id, followingId);
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

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const followers = await storage.getFollowers(userId);

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

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const following = await storage.getFollowing(userId);

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

      const isFollowing = await storage.isFollowing(currentUser.id, followingId);
      res.status(200).json({ isFollowing });
    } catch (error) {
      res.status(500).json({ message: "Error checking follow status" });
    }
  });

  // Story routes
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getActiveStories();

      const storiesWithUserData = await Promise.all(stories.map(async (story) => {
        const user = await storage.getUser(story.userId);
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

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stories = await storage.getUserStories(userId);

      const { password, ...userWithoutPassword } = user;

      const storiesWithUser = stories.map(story => ({
        ...story,
        user: userWithoutPassword
      }));

      res.status(200).json(storiesWithUser);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user stories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}