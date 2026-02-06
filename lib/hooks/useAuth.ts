/**
 * Authentication Hook
 * 
 * Provides authentication state and methods for the CDSA Labeling Platform.
 * Handles user login, logout, and auth state management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signIn,
  signOut,
  subscribeToAuthState,
  getUserData,
  updateLastLogin,
} from '@/lib/firebase/auth';
import { User, AuthState, LoginCredentials } from '@/types';

interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await getUserData(firebaseUser.uid);
          
          if (userData) {
            // Check user status
            if (userData.status === 'rejected') {
              // User was rejected - sign them out
              await signOut();
              setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: 'Your account has been rejected. Please contact admin.',
              });
              return;
            }

            // Update last login (only for active/pending users)
            await updateLastLogin(firebaseUser.uid);
            
            // Set authenticated state - pending users can still see pending page
            setState({
              user: userData,
              isLoading: false,
              isAuthenticated: userData.status === 'active',
              error: null,
            });
          } else {
            // User exists in Auth but not in Firestore
            setState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: 'User data not found. Please contact admin.',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: 'Failed to load user data.',
          });
        }
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await signIn(credentials);
      // Auth state change will be handled by the subscription
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: getAuthErrorMessage(errorMessage),
      }));
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await signOut();
      // Auth state change will be handled by the subscription
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid email or password.',
  };

  // Check if error message contains any known error code
  for (const [code, message] of Object.entries(errorMessages)) {
    if (errorCode.includes(code)) {
      return message;
    }
  }

  return 'An error occurred. Please try again.';
}

export default useAuth;
