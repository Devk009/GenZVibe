import * as React from 'react';

// Types
type User = {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  location?: string;
  bio?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

// Default user for testing
const defaultUser: User = {
  id: 1,
  username: 'user1',
  displayName: 'Your Account',
  location: 'San Francisco, CA',
  avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e'
};

// Default mock implementation
const defaultContext: AuthContextType = {
  user: defaultUser,
  isLoading: false,
  isAuthenticated: true,
  login: async () => console.log('login called'),
  register: async () => console.log('register called'),
  logout: async () => console.log('logout called'),
  updateProfile: async () => console.log('updateProfile called'),
};

// Create context
const AuthContext = React.createContext<AuthContextType>(defaultContext);

// Authentication provider component
export const AuthProvider = (props: { children: React.ReactNode }) => {
  return React.createElement(
    AuthContext.Provider,
    { value: defaultContext },
    props.children
  );
};

// Auth hook
export const useAuth = (): AuthContextType => {
  return React.useContext(AuthContext);
};