'use client';
import { useFirebase } from '@/firebase/provider';

// Internal state for user authentication
export interface UserAuthState {
  user: any | null; // Use `any` for Firebase User to avoid circular deps if needed, or import User type
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency
  user: any | null;
  isUserLoading: boolean;
  userError: Error | null;
}
/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
