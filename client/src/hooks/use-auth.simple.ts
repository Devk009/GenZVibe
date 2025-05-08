import { createContext, useContext } from 'react';

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

const defaultUser: User = {
  id: 1,
  username: 'user1',
  displayName: 'Your Account',
  location: 'San Francisco, CA',
  avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e'
};

// Simple mock implementation of auth context
const mockAuthContext: AuthContextType = {
  user: defaultUser,
  isLoading: false,
  isAuthenticated: true,
  login: async () => console.log('login called'),
  register: async () => console.log('register called'),
  logout: async () => console.log('logout called'),
  updateProfile: async () => console.log('updateProfile called'),
};

const AuthContext = createContext<AuthContextType>(mockAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}