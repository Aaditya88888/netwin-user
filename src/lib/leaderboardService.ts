// Real-time Leaderboard Service
// Uses Firebase Firestore to provide real-time leaderboard updates
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  where,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LeaderboardEntry } from '@/types';
import { ErrorReportingService } from './errorReportingService';

/**
 * Service for managing real-time leaderboard data
 */
export class LeaderboardService {
  private static listeners = new Map<string, () => void>();
  
  /**
   * Subscribe to global leaderboard updates
   * @param callback Function that receives updated leaderboard data
   * @param limitCount Maximum number of entries to fetch
   * @returns Unsubscribe function
   */
  static subscribeToGlobalLeaderboard(
    callback: (entries: LeaderboardEntry[]) => void,
    limitCount: number = 100
  ): () => void {
    try {
      const leaderboardQuery = query(
        collection(db, 'leaderboard'),
        orderBy('totalPoints', 'desc'),
        orderBy('totalKills', 'desc'),
        limit(limitCount)
      );
      
      const unsubscribe = onSnapshot(leaderboardQuery, 
        (snapshot) => {
          const entries = this.processLeaderboardSnapshot(snapshot);
          callback(entries);
        },
        (error) => {
          ErrorReportingService.captureError(error, { 
            type: 'leaderboard_subscribe_error',
            context: 'global'
          });
          console.error('Error fetching global leaderboard:', error);
          callback([]);
        }
      );
      
      // Store the listener for management
      const listenerId = `global_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);
      
      // Return a function that both unsubscribes and removes from the map
      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error) {
      ErrorReportingService.captureError(error, { 
        type: 'leaderboard_setup_error',
        context: 'global'
      });
      console.error('Error setting up leaderboard subscription:', error);
      return () => {};
    }
  }
  
  /**
   * Subscribe to tournament-specific leaderboard
   * @param tournamentId The ID of the tournament
   * @param callback Function that receives updated leaderboard data
   * @returns Unsubscribe function
   */
  static subscribeTournamentLeaderboard(
    tournamentId: string,
    callback: (entries: LeaderboardEntry[]) => void
  ): () => void {
    try {
      const leaderboardQuery = query(
        collection(db, 'tournament_registrations'),
        where('tournamentId', '==', tournamentId),
        where('resultSubmitted', '==', true),
        orderBy('points', 'desc'),
        orderBy('kills', 'desc')
      );
      
      const unsubscribe = onSnapshot(leaderboardQuery, 
        (snapshot) => {
          const entries = this.processTournamentLeaderboardSnapshot(snapshot);
          callback(entries);
        },
        (error) => {
          ErrorReportingService.captureError(error, { 
            type: 'leaderboard_subscribe_error',
            context: 'tournament',
            tournamentId
          });
          console.error(`Error fetching tournament leaderboard for ${tournamentId}:`, error);
          callback([]);
        }
      );
      
      // Store the listener
      const listenerId = `tournament_${tournamentId}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error) {
      ErrorReportingService.captureError(error, { 
        type: 'leaderboard_setup_error',
        context: 'tournament',
        tournamentId
      });
      console.error(`Error setting up tournament leaderboard for ${tournamentId}:`, error);
      return () => {};
    }
  }
  
  /**
   * Subscribe to user's ranking updates
   * @param userId The user's ID
   * @param callback Function that receives the user's ranking data
   * @returns Unsubscribe function
   */
  static subscribeToUserRanking(
    userId: string,
    callback: (ranking: LeaderboardEntry | null) => void
  ): () => void {
    try {
      const userRankingQuery = query(
        collection(db, 'leaderboard'),
        where('userId', '==', userId)
      );
      
      const unsubscribe = onSnapshot(userRankingQuery, 
        (snapshot) => {
          if (snapshot.empty) {
            callback(null);
            return;
          }
          
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          
          callback({
            id: userDoc.id,
            userId: userData.userId,
            username: userData.username,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            profilePicture: userData.profilePicture,
            country: userData.country,
            currency: userData.currency,
            totalPoints: userData.totalPoints || 0,
            totalKills: userData.totalKills || 0,
            kills: userData.kills || 0,
            wins: userData.wins || 0,
            matches: userData.matches || 0,
            matchesPlayed: userData.matchesPlayed || 0,
            winRate: userData.winRate || 0,
            earnings: userData.earnings || 0,
            rank: userData.rank || 0
          });
        },
        (error) => {
          ErrorReportingService.captureError(error, { 
            type: 'user_ranking_error',
            userId
          });
          console.error(`Error fetching ranking for user ${userId}:`, error);
          callback(null);
        }
      );
      
      const listenerId = `user_${userId}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error) {
      ErrorReportingService.captureError(error, { 
        type: 'user_ranking_setup_error',
        userId
      });
      console.error(`Error setting up user ranking for ${userId}:`, error);
      return () => {};
    }
  }
  
  /**
   * Process leaderboard snapshot into typed entries
   */
  private static processLeaderboardSnapshot(snapshot: QuerySnapshot<DocumentData>): LeaderboardEntry[] {
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        username: data.username || 'Unknown Player',
        displayName: data.displayName || data.username || 'Unknown Player',
        photoURL: data.photoURL || data.profilePicture,
        profilePicture: data.profilePicture || data.photoURL,
        country: data.country || 'global',
        currency: data.currency || 'USD',
        totalPoints: data.totalPoints || 0,
        totalKills: data.totalKills || 0,
        kills: data.kills || 0,
        wins: data.wins || 0,
        matches: data.matches || data.matchesPlayed || 0,
        matchesPlayed: data.matchesPlayed || data.matches || 0,
        winRate: data.winRate || (data.wins && data.matches ? Math.round((data.wins / data.matches) * 100) : 0),
        earnings: data.earnings || 0,
        rank: index + 1
      };
    });
  }
  
  /**
   * Process tournament leaderboard snapshot into typed entries
   */
  private static processTournamentLeaderboardSnapshot(snapshot: QuerySnapshot<DocumentData>): LeaderboardEntry[] {
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        username: data.displayName || data.teamName || 'Unknown Player',
        displayName: data.displayName || data.teamName || 'Unknown Player',
        photoURL: data.photoURL || data.profilePicture,
        profilePicture: data.profilePicture || data.photoURL,
        country: data.country || 'global',
        currency: data.currency || 'USD',
        totalPoints: data.points || 0,
        totalKills: data.kills || 0,
        kills: data.kills || 0,
        wins: data.position === 1 ? 1 : 0,
        matches: 1,
        matchesPlayed: 1,
        winRate: data.position === 1 ? 100 : 0,
        earnings: data.totalPrizeEarned || 0,
        rank: index + 1
      };
    });
  }
  
  /**
   * Clean up all active leaderboard listeners
   */
  static cleanupAllListeners(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export default LeaderboardService;
