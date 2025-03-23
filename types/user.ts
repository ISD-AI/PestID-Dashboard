// types/user.ts

// Interface for a user document in the Users collection
export interface User {
    accountStatus: string;
    avatar?: string; // Optional, can be null
    avatarCategory?: string;
    createdAt: string; // ISO string or timestamp (e.g., "2025-02-11T10:42:09Z")
    email?: string; // Optional, can be null
    lastSignIn: string; // ISO string or timestamp (e.g., "2025-02-11T10:42:09Z")
    name: string; // Username to be used in other interfaces
    photoURL?: string; // Optional, can be null
    signUpMethod: 'guest' | 'email' | 'google'; // Enum-like type for sign-up methods
    userId: string;
  }