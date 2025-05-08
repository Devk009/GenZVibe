import React, { createContext, useContext } from 'react';

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} [displayName]
 * @property {string} [avatarUrl]
 * @property {string} [location]
 * @property {string} [bio]
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {boolean} isLoading
 * @property {boolean} isAuthenticated
 * @property {function(string, string): Promise<void>} login
 * @property {function(string, string): Promise<void>} register
 * @property {function(): Promise<void>} logout
 * @property {function(Object): Promise<void>} updateProfile
 */

// Default user for testing
const defaultUser = {
  id: 1,
  username: 'user1',
  displayName: 'Your Account',
  location: 'San Francisco, CA',
  avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e'
};

/** @type {AuthContextType} */
const defaultContext = {
  user: defaultUser,
  isLoading: false,
  isAuthenticated: true,
  login: async () => console.log('login called'),
  register: async () => console.log('register called'),
  logout: async () => console.log('logout called'),
  updateProfile: async () => console.log('updateProfile called'),
};

const AuthContext = createContext(defaultContext);

/**
 * Authentication provider component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  return React.createElement(
    AuthContext.Provider,
    { value: defaultContext },
    children
  );
}

/**
 * Hook to access authentication context
 * @returns {AuthContextType}
 */
export function useAuth() {
  return useContext(AuthContext);
}