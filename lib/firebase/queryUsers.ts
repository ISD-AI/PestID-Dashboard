import { db } from './config';
import { collection, Timestamp, getDoc, doc, getDocs } from 'firebase/firestore';
import { User } from '@/types/user';

// Fetch user by userID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const userData = userSnap.data();
    return {
      accountStatus: userData.accountStatus || 'active',
      avatar: userData.avatar || null,
      avatarCategory: userData.avatarCategory || null,
      createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
      email: userData.email || null,
      lastSignIn: userData.lastSignIn instanceof Timestamp ? userData.lastSignIn.toDate().toISOString() : new Date().toISOString(),
      name: userData.name || 'Deleted User',
      photoURL: userData.photoURL || null,
      signUpMethod: userData.signUpMethod || 'guest',
      userId: userId,
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Fetch all users (optional, for future analytics)
export async function getAllUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const users: User[] = [];

    usersSnap.forEach((doc) => {
      const userData = doc.data();
      users.push({
        accountStatus: userData.accountStatus || 'active',
        avatar: userData.avatar || null,
        avatarCategory: userData.avatarCategory || null,
        createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
        email: userData.email || null,
        lastSignIn: userData.lastSignIn instanceof Timestamp ? userData.lastSignIn.toDate().toISOString() : new Date().toISOString(),
        name: userData.name || 'Deleted User',
        photoURL: userData.photoURL || null,
        signUpMethod: userData.signUpMethod || 'guest',
        userId: doc.id,
      });
    });

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}