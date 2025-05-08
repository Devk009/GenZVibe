import { 
  users, posts, likes, comments, follows, stories,
  type User, type InsertUser, 
  type Post, type InsertPost,
  type Like, type InsertLike,
  type Comment, type InsertComment,
  type Follow, type InsertFollow, 
  type Story, type InsertStory
} from "@shared/schema";
import { subDays, addHours } from "date-fns";
import session from 'express-session';
import { sessionStore } from './session-store';

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getPosts(limit?: number, offset?: number): Promise<Post[]>;
  getUserPosts(userId: number): Promise<Post[]>;
  getFeedPosts(userId: number): Promise<Post[]>;
  deletePost(id: number): Promise<boolean>;
  
  // Like operations
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<boolean>;
  getLikesByPost(postId: number): Promise<Like[]>;
  getLikesByUser(userId: number): Promise<Like[]>;
  hasUserLikedPost(userId: number, postId: number): Promise<boolean>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPost(postId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;
  
  // Follow operations
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  
  // Story operations
  createStory(story: InsertStory): Promise<Story>;
  getActiveStories(): Promise<Story[]>;
  getUserStories(userId: number): Promise<Story[]>;
  
  // Session store
  sessionStore: session.Store;
  
  // Seed initial data
  seedInitialData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private follows: Map<number, Follow>;
  private stories: Map<number, Story>;
  
  private userIdCounter: number;
  private postIdCounter: number;
  private likeIdCounter: number;
  private commentIdCounter: number;
  private followIdCounter: number;
  private storyIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.follows = new Map();
    this.stories = new Map();
    
    this.userIdCounter = 1;
    this.postIdCounter = 1;
    this.likeIdCounter = 1;
    this.commentIdCounter = 1;
    this.followIdCounter = 1;
    this.storyIdCounter = 1;
    
    // Use the imported session store
    this.sessionStore = sessionStore;
  }
  
  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (user) => 
        user.username.toLowerCase().includes(lowerQuery) || 
        (user.displayName && user.displayName.toLowerCase().includes(lowerQuery))
    );
  }
  
  // Post operations
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      createdAt: now
    };
    this.posts.set(id, post);
    return post;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getFeedPosts(userId: number): Promise<Post[]> {
    // Get all users that the current user follows
    const following = await this.getFollowing(userId);
    const followingIds = following.map(user => user.id);
    
    // Include the user's own posts in the feed
    followingIds.push(userId);
    
    return Array.from(this.posts.values())
      .filter(post => followingIds.includes(post.userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }
  
  // Like operations
  async createLike(insertLike: InsertLike): Promise<Like> {
    // Check if like already exists
    const exists = await this.hasUserLikedPost(insertLike.userId, insertLike.postId);
    if (exists) {
      const existingLike = Array.from(this.likes.values()).find(
        like => like.userId === insertLike.userId && like.postId === insertLike.postId
      );
      if (existingLike) {
        return existingLike;
      }
    }
    
    const id = this.likeIdCounter++;
    const now = new Date();
    const like: Like = {
      ...insertLike,
      id,
      createdAt: now
    };
    this.likes.set(id, like);
    return like;
  }
  
  async deleteLike(userId: number, postId: number): Promise<boolean> {
    const like = Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
    
    if (like) {
      return this.likes.delete(like.id);
    }
    
    return false;
  }
  
  async getLikesByPost(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.postId === postId);
  }
  
  async getLikesByUser(userId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.userId === userId);
  }
  
  async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
    return Array.from(this.likes.values()).some(
      like => like.userId === userId && like.postId === postId
    );
  }
  
  // Comment operations
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: now
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  async getCommentsByPost(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Follow operations
  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    // Check if follow relationship already exists
    const exists = await this.isFollowing(insertFollow.followerId, insertFollow.followingId);
    if (exists) {
      const existingFollow = Array.from(this.follows.values()).find(
        follow => follow.followerId === insertFollow.followerId && follow.followingId === insertFollow.followingId
      );
      if (existingFollow) {
        return existingFollow;
      }
    }
    
    const id = this.followIdCounter++;
    const now = new Date();
    const follow: Follow = {
      ...insertFollow,
      id,
      createdAt: now
    };
    this.follows.set(id, follow);
    return follow;
  }
  
  async deleteFollow(followerId: number, followingId: number): Promise<boolean> {
    const follow = Array.from(this.follows.values()).find(
      follow => follow.followerId === followerId && follow.followingId === followingId
    );
    
    if (follow) {
      return this.follows.delete(follow.id);
    }
    
    return false;
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId)
      .map(follow => follow.followerId);
    
    return Array.from(this.users.values()).filter(user => followerIds.includes(user.id));
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    return Array.from(this.users.values()).filter(user => followingIds.includes(user.id));
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return Array.from(this.follows.values()).some(
      follow => follow.followerId === followerId && follow.followingId === followingId
    );
  }
  
  // Story operations
  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyIdCounter++;
    const now = new Date();
    const story: Story = {
      ...insertStory,
      id,
      createdAt: now
    };
    this.stories.set(id, story);
    return story;
  }
  
  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => story.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserStories(userId: number): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => story.userId === userId && story.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Seed initial data
  async seedInitialData(): Promise<void> {
    // Create users
    const users = [
      { username: 'user1', password: 'password123', displayName: 'Your Account', location: 'San Francisco, CA', avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e' },
      { username: 'jay.k', password: 'password123', displayName: 'Jay K', location: 'Brooklyn, NY', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6' },
      { username: 'miachill', password: 'password123', displayName: 'Mia Chill', location: 'Austin, TX', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04' },
      { username: 'alex.vibe', password: 'password123', displayName: 'Alex', location: 'Miami, FL', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce' },
      { username: 'lisa.png', password: 'password123', displayName: 'Lisa', location: 'Los Angeles, CA', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
      { username: 'ty.creative', password: 'password123', displayName: 'Tyler', location: 'Seattle, WA', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7' }
    ];
    
    for (const userData of users) {
      await this.createUser(userData);
    }
    
    // Create posts
    const posts = [
      { userId: 5, caption: 'late night vibes with the crew 🌃✨ #nofilter', imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205', location: 'Los Angeles, CA' },
      { userId: 2, caption: 'digging through crates and found some gems 💿 vintage sounds hit different #vinylcollection', imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba', location: 'Brooklyn, NY' },
      { userId: 3, caption: 'finally finished my room makeover ✨🌿 feeling so much better in this space #aestheticvibes #plantmom', imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45', location: 'Austin, TX' },
      { userId: 4, caption: 'sunset skating session with friends 🛹 best way to end the day', imageUrl: 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3', location: 'Miami, FL' },
      { userId: 6, caption: 'morning coffee and creativity ☕️ working on something big!', imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15', location: 'Seattle, WA' },
      { userId: 1, caption: 'exploring the city today, found this amazing spot 🏙️', imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b', location: 'San Francisco, CA' }
    ];
    
    for (const postData of posts) {
      await this.createPost(postData);
    }
    
    // Create comments
    const comments = [
      { userId: 2, postId: 1, content: 'looks awesome! miss you guys 💯' },
      { userId: 3, postId: 1, content: 'next time I\'m definitely joining! 🔥' },
      { userId: 4, postId: 2, content: 'that\'s a rare find! we should collab on a mix 🎧' },
      { userId: 6, postId: 2, content: 'what era is this from? looks amazing' },
      { userId: 5, postId: 3, content: 'this is giving me major inspo! 😍' },
      { userId: 2, postId: 3, content: 'what LEDs are those? need them asap' }
    ];
    
    for (const commentData of comments) {
      await this.createComment(commentData);
    }
    
    // Create likes
    const likes = [
      { userId: 2, postId: 1 },
      { userId: 3, postId: 1 },
      { userId: 4, postId: 1 },
      { userId: 5, postId: 2 },
      { userId: 6, postId: 2 },
      { userId: 1, postId: 3 },
      { userId: 2, postId: 3 },
      { userId: 4, postId: 3 }
    ];
    
    for (const likeData of likes) {
      await this.createLike(likeData);
    }
    
    // Create follows
    const follows = [
      { followerId: 1, followingId: 2 },
      { followerId: 1, followingId: 3 },
      { followerId: 1, followingId: 4 },
      { followerId: 1, followingId: 5 },
      { followerId: 1, followingId: 6 },
      { followerId: 2, followingId: 1 },
      { followerId: 3, followingId: 1 },
      { followerId: 4, followingId: 1 },
      { followerId: 5, followingId: 1 },
      { followerId: 6, followingId: 1 }
    ];
    
    for (const followData of follows) {
      await this.createFollow(followData);
    }
    
    // Create stories (that expire in 24 hours)
    const now = new Date();
    const stories = [
      { userId: 1, imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e', expiresAt: addHours(now, 24) },
      { userId: 2, imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6', expiresAt: addHours(now, 24) },
      { userId: 3, imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04', expiresAt: addHours(now, 24) },
      { userId: 4, imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce', expiresAt: addHours(now, 24) },
      { userId: 5, imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', expiresAt: addHours(now, 24) },
      { userId: 6, imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', expiresAt: addHours(now, 24) }
    ];
    
    for (const storyData of stories) {
      await this.createStory(storyData);
    }
  }
}

export const storage = new MemStorage();
// Seed initial data
storage.seedInitialData();
