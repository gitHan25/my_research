/**
 * Firebase Authentication Service
 * 
 * Provides authentication functions for the CDSA Labeling Platform.
 * Handles sign in, sign out, and auth state management.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole, UserStatus, LoginCredentials } from '@/types';

/**
 * Sign in with email and password
 */
export async function signIn(credentials: LoginCredentials): Promise<UserCredential> {
  const { email, password } = credentials;
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Register a new user with email and password
 * Creates Firebase Auth user and Firestore document with 'pending' status
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  // Create Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create Firestore user document with pending status
  await setDoc(doc(db, 'users', credential.user.uid), {
    email,
    displayName,
    role: 'labeler' as UserRole,
    status: 'pending' as UserStatus,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
  
  return credential;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/**
 * Get user data from Firestore
 */
export async function getUserData(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    // Default status to 'active' for existing users without status field
    status: data.status || 'active',
  } as User;
}

/**
 * Create a new user document in Firestore
 * Called after Firebase Auth user creation
 */
export async function createUserDocument(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole = 'labeler',
  status: UserStatus = 'pending'
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    email,
    displayName,
    role,
    status,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    lastLoginAt: serverTimestamp(),
  });
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role,
  });
}

/**
 * Update user status (admin only) - for approve/reject
 */
export async function updateUserStatus(uid: string, status: UserStatus): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    status,
  });
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Check if user has admin role
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const userData = await getUserData(uid);
  return userData?.role === 'admin';
}

