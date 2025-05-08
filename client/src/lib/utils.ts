import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiRequest } from "./queryClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export const isLikedByUser = (postId: number, userId: number, likes: any[]): boolean => {
  return likes.some(like => like.userId === userId && like.postId === postId);
};

export const likePost = async (postId: number): Promise<void> => {
  await apiRequest('POST', `/api/posts/${postId}/like`);
};

export const unlikePost = async (postId: number): Promise<void> => {
  await apiRequest('DELETE', `/api/posts/${postId}/like`);
};

export const addComment = async (postId: number, content: string): Promise<any> => {
  const response = await apiRequest('POST', `/api/posts/${postId}/comments`, { content });
  return response.json();
};

export const getProfileSummary = (user: any) => {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatarUrl: user.avatarUrl,
    location: user.location,
  };
};
