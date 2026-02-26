// Complete Firebase services - replaces all backend API functionality
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { 
  Tournament, 
  Match, 
  WalletTransaction, 
  KycDocument, 
  Notification, 
  UserProfile 
} from '@/types';

// Development mode detection
const isDevelopment = import.meta.env.DEV;

// ===============================
// USERS & PROFILES
// ===============================
export class UserService {
  static async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return { id: uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  }

  static async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  static async checkUsernameExists(username: string): Promise<boolean> {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserProfile);
  }

  static subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
    return onSnapshot(doc(db, 'users', uid), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as UserProfile);
      } else {
        callback(null);
      }
    });
  }
}

// ===============================
// TOURNAMENTS
// ===============================
export class TournamentService {
  static async createTournament(data: Omit<Tournament, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async getTournament(id: string): Promise<Tournament | null> {
    const docSnap = await getDoc(doc(db, 'tournaments', id));
    if (docSnap.exists()) {
      return { id, ...docSnap.data() } as Tournament;
    }
    return null;
  }

  static async getAllTournaments(): Promise<Tournament[]> {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tournament);
  }

  static async getActiveTournaments(): Promise<Tournament[]> {
    const q = query(
      collection(db, 'tournaments'), 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tournament);
  }

  static async updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
    await updateDoc(doc(db, 'tournaments', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  static async deleteTournament(id: string): Promise<void> {
    await deleteDoc(doc(db, 'tournaments', id));
  }

  static async joinTournament(tournamentId: string, userId: string, squadData?: Record<string, unknown>): Promise<void> {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    
    await runTransaction(db, async (transaction) => {
      const tournamentDoc = await transaction.get(tournamentRef);
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament does not exist');
      }

      const tournament = tournamentDoc.data() as Tournament;
      const participants = tournament.participants || [];

      if (participants.includes(userId)) {
        throw new Error('User already joined this tournament');
      }

      transaction.update(tournamentRef, {
        participants: [...participants, userId],
        updatedAt: serverTimestamp(),
      });

      // Create tournament participation record
      const participationRef = doc(db, 'tournament_participants', `${tournamentId}_${userId}`);
      transaction.set(participationRef, {
        tournamentId,
        userId,
        squadData,
        joinedAt: serverTimestamp(),
      });
    });
  }

  static subscribeToTournaments(callback: (tournaments: Tournament[]) => void): () => void {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const tournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tournament);
      callback(tournaments);
    });
  }

  static subscribeToTournament(id: string, callback: (tournament: Tournament | null) => void): () => void {
    return onSnapshot(doc(db, 'tournaments', id), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Tournament);
      } else {
        callback(null);
      }
    });
  }
}

// ===============================
// MATCHES
// ===============================
export class MatchService {
  static async createMatch(data: Omit<Match, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'matches'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async getMatch(id: string): Promise<Match | null> {
    const docSnap = await getDoc(doc(db, 'matches', id));
    if (docSnap.exists()) {
      return { id, ...docSnap.data() } as Match;
    }
    return null;
  }

  static async getUserMatches(userId: string): Promise<Match[]> {
    const q = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Match);
  }

  static async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    const q = query(
      collection(db, 'matches'),
      where('tournamentId', '==', tournamentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Match);
  }

  static async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    await updateDoc(doc(db, 'matches', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  static async updateMatchResult(matchId: string, results: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, 'matches', matchId), {
      results,
      status: 'completed',
      updatedAt: serverTimestamp(),
    });
  }

  static subscribeToUserMatches(userId: string, callback: (matches: Match[]) => void): () => void {
    const q = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const matches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Match);
      callback(matches);
    });
  }
}

// ===============================
// WALLET & TRANSACTIONS
// ===============================
export class WalletService {
  static async getUserBalance(userId: string): Promise<number> {
    const docSnap = await getDoc(doc(db, 'transactions', userId));
    if (docSnap.exists()) {
      return docSnap.data().balance || 0;
    }
    return 0;
  }

  static async updateWalletBalance(userId: string, amount: number, type: 'add' | 'subtract' = 'add'): Promise<void> {
    const walletRef = doc(db, 'transactions', userId);
    
    await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      const currentBalance = walletDoc.exists() ? (walletDoc.data().balance || 0) : 0;
      
      const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;
      
      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      transaction.set(walletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  }
  static async createTransaction(data: Omit<WalletTransaction, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...data,
      createdAt: serverTimestamp(),
    });

    // Update wallet balance based on transaction type
    if (data.type === 'deposit' || data.type === 'prize' || data.type === 'tournament_reward') {
      await this.updateWalletBalance(data.userId, data.amount, 'add');
    } else if (data.type === 'withdrawal' || data.type === 'tournament_fee') {
      await this.updateWalletBalance(data.userId, data.amount, 'subtract');
    }

    return docRef.id;
  }

  static async getUserTransactions(userId: string): Promise<WalletTransaction[]> {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as WalletTransaction);
  }

  static subscribeToWalletBalance(userId: string, callback: (balance: number) => void): () => void {
    return onSnapshot(doc(db, 'transactions', userId), (doc) => {
      const balance = doc.exists() ? (doc.data().balance || 0) : 0;
      callback(balance);
    });
  }

  static subscribeToUserTransactions(userId: string, callback: (transactions: WalletTransaction[]) => void): () => void {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as WalletTransaction);
      callback(transactions);
    });
  }
}

// ===============================
// NOTIFICATIONS
// ===============================
export class NotificationService {
  static async createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
  }

  static async markNotificationAsRead(id: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', id), {
      read: true,
    });
  }

  static async markAllNotificationsAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((document) => {
      batch.update(document.ref, { read: true });
    });
    
    await batch.commit();
  }

  static subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
      callback(notifications);
    });
  }
}

// ===============================
// KYC DOCUMENTS
// ===============================
export class KycService {
  static async uploadKycDocument(userId: string, file: File, documentType: string): Promise<string> {
    const fileName = `kyc/${userId}/${documentType}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress monitoring if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  static async createKycDocument(data: Omit<KycDocument, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'kyc_documents'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async getUserKycDocuments(userId: string): Promise<KycDocument[]> {
    const q = query(
      collection(db, 'kyc_documents'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as KycDocument);
  }

  static async getAllKycDocuments(): Promise<KycDocument[]> {
    const q = query(collection(db, 'kyc_documents'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as KycDocument);
  }

  static async updateKycStatus(documentId: string, status: string, reviewNotes?: string): Promise<void> {
    await updateDoc(doc(db, 'kyc_documents', documentId), {
      status,
      reviewNotes,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  static subscribeToKycDocuments(callback: (documents: KycDocument[]) => void): () => void {
    const q = query(collection(db, 'kyc_documents'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as KycDocument);
      callback(documents);
    });
  }
}

// ===============================
// FILE STORAGE
// ===============================
export class StorageService {
  static async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  static async uploadFileWithProgress(
    file: File, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  static async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }

  static async listFiles(path: string): Promise<string[]> {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    const urls = await Promise.all(
      result.items.map(itemRef => getDownloadURL(itemRef))
    );
    return urls;
  }
}

// ===============================
// ANALYTICS & REPORTING
// ===============================
export class AnalyticsService {
  static async recordUserActivity(userId: string, activity: string, metadata?: Record<string, unknown>): Promise<void> {
    await addDoc(collection(db, 'user_activities'), {
      userId,
      activity,
      metadata,
      timestamp: serverTimestamp(),
    });
  }

  static async getUserStats(userId: string): Promise<{
    totalTournaments: number;
    totalMatches: number;
    totalTransactions: number;
  }> {
    // Get user tournaments
    const tournamentsQuery = query(
      collection(db, 'tournament_participants'),
      where('userId', '==', userId)
    );
    const tournamentsSnapshot = await getDocs(tournamentsQuery);
    
    // Get user matches
    const matchesQuery = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', userId)
    );
    const matchesSnapshot = await getDocs(matchesQuery);

    // Get wallet transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);

    return {
      totalTournaments: tournamentsSnapshot.size,
      totalMatches: matchesSnapshot.size,
      totalTransactions: transactionsSnapshot.size,
      // Add more stats as needed
    };
  }
}
