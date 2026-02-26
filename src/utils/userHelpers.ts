import { User, UserProfile } from "@/types";

/**
 * Helper function to get user ID from either User or UserProfile type
 */
export function getUserId(user: any): string | undefined {
  if (!user) return undefined;
  
  // UserProfile has uid property
  if ('uid' in user && user.uid) {
    return user.uid;
  }
  
  // User has id property  
  if ('id' in user && user.id) {
    return user.id;
  }
  
  return undefined;
}

/**
 * Helper function to get user email from either User or UserProfile type
 */
export function getUserEmail(user: any): string | undefined {
  if (!user) return undefined;
  return user.email;
}

/**
 * Helper function to get user currency from either User or UserProfile type
 */
export function getUserCurrency(user: any): string | undefined {
  if (!user) return undefined;
  return user.currency;
}

/**
 * Helper function to check if user is a specific type
 */
export function isUserProfile(user: User | UserProfile): user is UserProfile {
  return 'uid' in user;
}

export function isUser(user: User | UserProfile): user is User {
  return 'id' in user && !('uid' in user);
}
