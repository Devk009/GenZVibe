import { 
  users, posts, likes, comments, follows, stories,
  type User, type InsertUser, 
  type Post, type InsertPost, 
  type Like, type InsertLike, 
  type Comment, type InsertComment, 
  type Follow, type InsertFollow, 
  type Story, type InsertStory 
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, gt, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { sessionStore } from "./session-store";

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

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = sessionStore;
  }
  
  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        displayName: insertUser.displayName || null,
        bio: insertUser.bio || null,
        location: insertUser.location || null,
        avatarUrl: insertUser.avatarUrl || null,
      })
      .returning();
    return user;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        displayName: data.displayName || null,
        bio: data.bio || null,
        location: data.location || null,
        avatarUrl: data.avatarUrl || null,
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    
    // Simple case-insensitive search - can be improved with full-text search
    const lowerQuery = `%${query.toLowerCase()}%`;
    
    return await db
      .select()
      .from(users)
      .where(eq(users.username, lowerQuery)); // This is a simplified approach
  }
  
  // Post operations
  async createPost(insertPost: InsertPost): Promise<Post> {
    // Handle both old and new schema
    const postData: any = {
      ...insertPost,
      location: insertPost.location || null,
      // For backward compatibility with old schema
      image_url: insertPost.mediaPath || null
    };

    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));
    return post;
  }
  
  async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async getUserPosts(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }
  
  async getFeedPosts(userId: number): Promise<Post[]> {
    // Get all posts from users that the current user follows
    const followedUsers = await this.getFollowing(userId);
    const followedUserIds = followedUsers.map(user => user.id);
    followedUserIds.push(userId); // Include the user's own posts
    
    // This is a simplified approach - could be improved with a join
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId)) // This is temporary - needs to be expanded
      .orderBy(desc(posts.createdAt));
  }
  
  async deletePost(id: number): Promise<boolean> {
    const [deletedPost] = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning();
    return !!deletedPost;
  }
  
  // Like operations
  async createLike(insertLike: InsertLike): Promise<Like> {
    // Check if like already exists
    const exists = await this.hasUserLikedPost(insertLike.userId, insertLike.postId);
    if (exists) {
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.userId, insertLike.userId),
            eq(likes.postId, insertLike.postId)
          )
        );
      if (existingLike) {
        return existingLike;
      }
    }
    
    const [like] = await db
      .insert(likes)
      .values(insertLike)
      .returning();
    return like;
  }
  
  async deleteLike(userId: number, postId: number): Promise<boolean> {
    const [deletedLike] = await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      )
      .returning();
    return !!deletedLike;
  }
  
  async getLikesByPost(postId: number): Promise<Like[]> {
    return await db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId));
  }
  
  async getLikesByUser(userId: number): Promise<Like[]> {
    return await db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId));
  }
  
  async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    return !!like;
  }
  
  // Comment operations
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }
  
  async getCommentsByPost(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const [deletedComment] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();
    return !!deletedComment;
  }
  
  // Follow operations
  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    // Check if follow relationship already exists
    const exists = await this.isFollowing(insertFollow.followerId, insertFollow.followingId);
    if (exists) {
      const [existingFollow] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, insertFollow.followerId),
            eq(follows.followingId, insertFollow.followingId)
          )
        );
      if (existingFollow) {
        return existingFollow;
      }
    }
    
    const [follow] = await db
      .insert(follows)
      .values(insertFollow)
      .returning();
    return follow;
  }
  
  async deleteFollow(followerId: number, followingId: number): Promise<boolean> {
    const [deletedFollow] = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      )
      .returning();
    return !!deletedFollow;
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    // Get all users that follow the specified user
    const followerRecords = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));
    
    const followerIds = followerRecords.map(record => record.followerId);
    
    if (followerIds.length === 0) return [];
    
    // Get the actual user records
    return await db
      .select()
      .from(users)
      .where(eq(users.id, followerIds[0])); // This is a temporary simplification
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    // Get all users that the specified user follows
    const followingRecords = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const followingIds = followingRecords.map(record => record.followingId);
    
    if (followingIds.length === 0) return [];
    
    // Get the actual user records
    return await db
      .select()
      .from(users)
      .where(eq(users.id, followingIds[0])); // This is a temporary simplification
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return !!follow;
  }
  
  // Story operations
  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values(insertStory)
      .returning();
    return story;
  }
  
  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    return await db
      .select()
      .from(stories)
      .where(gt(stories.expiresAt, now))
      .orderBy(desc(stories.createdAt));
  }
  
  async getUserStories(userId: number): Promise<Story[]> {
    const now = new Date();
    return await db
      .select()
      .from(stories)
      .where(
        and(
          eq(stories.userId, userId),
          gt(stories.expiresAt, now)
        )
      )
      .orderBy(desc(stories.createdAt));
  }
  
  // Seed initial data
  async seedInitialData(): Promise<void> {
    // Check if we have users already
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping seed.");
      return;
    }
    
    // Create users
    const userData = [
      { username: 'user1', password: 'password123', displayName: 'Your Account', location: 'San Francisco, CA', avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e' },
      { username: 'jay.k', password: 'password123', displayName: 'Jay K', location: 'Brooklyn, NY', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6' },
      { username: 'miachill', password: 'password123', displayName: 'Mia Chill', location: 'Austin, TX', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04' },
      { username: 'alex.vibe', password: 'password123', displayName: 'Alex', location: 'Miami, FL', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce' },
      { username: 'lisa.png', password: 'password123', displayName: 'Lisa', location: 'Los Angeles, CA', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
      { username: 'ty.creative', password: 'password123', displayName: 'Tyler', location: 'Seattle, WA', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7' }
    ];
    
    // Insert all users and collect their IDs
    const createdUsers: User[] = [];
    for (const user of userData) {
      const createdUser = await this.createUser(user);
      createdUsers.push(createdUser);
    }
    
    // Create posts
    const postData = [
      { 
        userId: 5, 
        caption: 'late night vibes with the crew 🌃✨ #nofilter', 
        postType: 'image',
        mediaPath: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205', 
        mediaType: 'image/jpeg',
        location: 'Los Angeles, CA' 
      },
      { 
        userId: 2, 
        caption: 'digging through crates and found some gems 💿 vintage sounds hit different #vinylcollection', 
        postType: 'image',
        mediaPath: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba', 
        mediaType: 'image/jpeg',
        location: 'Brooklyn, NY' 
      },
      { 
        userId: 3, 
        caption: 'finally finished my room makeover ✨🌿 feeling so much better in this space #aestheticvibes #plantmom', 
        postType: 'image',
        mediaPath: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45', 
        mediaType: 'image/jpeg',
        location: 'Austin, TX' 
      },
      { 
        userId: 4, 
        caption: 'sunset skating session with friends 🛹 best way to end the day', 
        postType: 'image',
        mediaPath: 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3', 
        mediaType: 'image/jpeg',
        location: 'Miami, FL' 
      },
      { 
        userId: 6, 
        caption: 'morning coffee and creativity ☕️ working on something big!', 
        postType: 'image',
        mediaPath: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15', 
        mediaType: 'image/jpeg',
        location: 'Seattle, WA' 
      },
      { 
        userId: 1, 
        caption: 'exploring the city today, found this amazing spot 🏙️', 
        postType: 'image',
        mediaPath: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b', 
        mediaType: 'image/jpeg',
        location: 'San Francisco, CA' 
      },
      {
        userId: 2,
        caption: 'Just sharing my thoughts for today. What do you all think?',
        postType: 'text',
        location: 'Brooklyn, NY'
      }
    ];
    
    for (const post of postData) {
      await this.createPost(post);
    }
    
    // Create more relationships (comments, likes, follows) as needed
    // This is just a starter to get the database populated
  }
}

export const storage = new DatabaseStorage();