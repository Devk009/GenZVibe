import * as React from 'react';
import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  location?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/auth/current'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const user = userData as User | null;
  
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/current'], data);
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/register', { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/current'], data);
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/current'], null);
      queryClient.invalidateQueries();
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user) throw new Error('Not authenticated');
      const response = await apiRequest('PATCH', `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/current'], data);
    },
  });
  
  async function login(username: string, password: string) {
    await loginMutation.mutateAsync({ username, password });
  }
  
  async function register(username: string, password: string) {
    await registerMutation.mutateAsync({ username, password });
  }
  
  async function logout() {
    await logoutMutation.mutateAsync();
  }
  
  async function updateProfile(data: Partial<User>) {
    await updateProfileMutation.mutateAsync(data);
  }
  
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}