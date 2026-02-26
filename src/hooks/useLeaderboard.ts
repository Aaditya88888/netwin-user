import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LeaderboardEntry } from '@/types';

export interface LeaderboardOptions {
  timeFrame?: 'all-time' | 'this-month' | 'this-week';
  region?: 'global' | 'regional';
  userCountry?: string;
  limit?: number;
}

export function useLeaderboard(options: LeaderboardOptions = {}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { timeFrame = 'all-time', region = 'global', userCountry, limit = 50 } = options;

  useEffect(() => {
    loadLeaderboard();
  }, [timeFrame, region, userCountry, limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get all users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users = new Map();
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        users.set(doc.id, {
          id: doc.id,
          username: userData.displayName || userData.email?.split('@')[0] || 'Unknown',
          displayName: userData.displayName || userData.email?.split('@')[0] || 'Unknown',
          photoURL: userData.photoURL,
          profilePicture: userData.photoURL,
          country: userData.country || 'Unknown',
          currency: userData.currency || 'USD',
        });
      });

      // Step 2: Get match results and aggregate statistics
      let resultsQuery = query(collection(db, 'match_results'));
      
      // Apply time filter
      if (timeFrame !== 'all-time') {
        const now = new Date();
        let startDate: Date;
        
        if (timeFrame === 'this-week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeFrame === 'this-month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          startDate = new Date(0); // fallback to all time
        }
        
        resultsQuery = query(resultsQuery, where('submittedAt', '>=', startDate));
      }

      const resultsSnapshot = await getDocs(resultsQuery);
      
      // Step 3: Aggregate user statistics
      const userStats = new Map<string, {
        totalKills: number;
        totalWins: number;
        totalMatches: number;
        totalEarnings: number;
        bestPlacement: number;
      }>();

      resultsSnapshot.docs.forEach(doc => {
        const result = doc.data();
        const userId = result.userId;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            totalKills: 0,
            totalWins: 0,
            totalMatches: 0,
            totalEarnings: 0,
            bestPlacement: 999,
          });
        }
        
        const stats = userStats.get(userId)!;
        stats.totalKills += result.kills || 0;
        stats.totalMatches += 1;
        stats.totalEarnings += result.totalReward || 0;
        
        if (result.placement === 1) {
          stats.totalWins += 1;
        }
        
        if (result.placement < stats.bestPlacement) {
          stats.bestPlacement = result.placement;
        }
      });

      // Step 4: Get tournament registrations to calculate total matches played
      const registrationsQuery = query(collection(db, 'tournament_registrations'));
      const registrationsSnapshot = await getDocs(registrationsQuery);
      
      const userTournaments = new Map<string, number>();
      registrationsSnapshot.docs.forEach(doc => {
        const reg = doc.data();
        const userId = reg.userId;
        userTournaments.set(userId, (userTournaments.get(userId) || 0) + 1);
      });

      // Step 5: Combine data and create leaderboard entries
      const leaderboardEntries: LeaderboardEntry[] = [];
      
      userStats.forEach((stats, userId) => {
        const user = users.get(userId);
        if (!user) return;
        
        // Apply region filter
        if (region === 'regional' && userCountry && user.country !== userCountry) {
          return;
        }
        
        const winRate = stats.totalMatches > 0 ? (stats.totalWins / stats.totalMatches) * 100 : 0;
        const totalPoints = (stats.totalKills * 2) + (stats.totalWins * 10) + (stats.totalEarnings / 100);
        
        leaderboardEntries.push({
          id: userId,
          userId,
          username: user.username,
          displayName: user.displayName,
          photoURL: user.photoURL,
          profilePicture: user.profilePicture,
          country: user.country,
          currency: user.currency,
          totalPoints,
          totalKills: stats.totalKills,
          kills: stats.totalKills, // Same as totalKills for compatibility
          wins: stats.totalWins,
          matches: userTournaments.get(userId) || 0,
          matchesPlayed: userTournaments.get(userId) || 0,
          winRate,
          earnings: stats.totalEarnings,
        });
      });

      // Step 6: Sort by earnings (primary) and total points (secondary)
      leaderboardEntries.sort((a, b) => {
        if (b.earnings !== a.earnings) {
          return b.earnings - a.earnings;
        }
        return b.totalPoints - a.totalPoints;
      });

      // Step 7: Add ranks and apply limit
      const limitedEntries = leaderboardEntries.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(limitedEntries);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  // Function to get user's stats from the leaderboard
  const getUserStats = (userId: string) => {
    return leaderboard.find(entry => entry.userId === userId);
  };

  // Function to get user's rank
  const getUserRank = (userId: string) => {
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    return userEntry?.rank || '-';
  };

  return {
    leaderboard,
    loading,
    error,
    getUserStats,
    getUserRank,
    refreshLeaderboard: loadLeaderboard,
  };
}
