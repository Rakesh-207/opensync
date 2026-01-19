// Auth wrapper that uses WorkOS AuthKit
// This provides a consistent interface for components while using AuthKit under the hood

import { useEffect, useRef } from "react";
import { useAuth as useAuthKit } from "@workos-inc/authkit-react";
import { useConvexAuth } from "convex/react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

// Main auth hook that wraps AuthKit
export function useAuth(): AuthState {
  const { 
    user, 
    signIn, 
    signOut, 
    isLoading: authKitLoading,
    getAccessToken 
  } = useAuthKit();
  const { isLoading: convexLoading, isAuthenticated: convexAuthenticated } = useConvexAuth();
  
  // Track if we've attempted token refresh to prevent loops
  const hasAttemptedRefresh = useRef(false);

  // Map WorkOS user to our User interface
  const mappedUser: User | null = user
    ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        profilePictureUrl: user.profilePictureUrl ?? undefined,
      }
    : null;

  // Determine loading state - loading if either provider is loading
  const isLoading = authKitLoading || convexLoading;
  
  // WorkOS has a user session
  const hasWorkosSession = !!user;

  // If WorkOS has session but Convex doesn't, try to refresh token once
  useEffect(() => {
    if (
      hasWorkosSession && 
      !convexAuthenticated && 
      !isLoading && 
      !hasAttemptedRefresh.current &&
      getAccessToken
    ) {
      hasAttemptedRefresh.current = true;
      // Trigger token refresh - this will update Convex auth state
      getAccessToken().catch(() => {
        // Token expired or invalid - user needs to sign in again
      });
    }
    
    // Reset refresh flag when user changes
    if (!hasWorkosSession) {
      hasAttemptedRefresh.current = false;
    }
  }, [hasWorkosSession, convexAuthenticated, isLoading, getAccessToken]);

  // Use Convex auth state as source of truth, but show loading while syncing
  const isAuthenticated = convexAuthenticated;

  return {
    user: mappedUser,
    // Show loading if WorkOS has user but Convex hasn't synced yet
    isLoading: isLoading || (hasWorkosSession && !convexAuthenticated && !hasAttemptedRefresh.current),
    isAuthenticated,
    signIn: () => signIn(),
    signOut: () => signOut(),
  };
}

// Compatibility export for useAuthState
export function useAuthState() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  return { isLoading, isAuthenticated };
}
