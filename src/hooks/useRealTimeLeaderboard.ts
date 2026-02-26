import { useState, useEffect, useCallback } from 'react';
import { LeaderboardService } from '@/lib/leaderboardService';
import { LeaderboardEntry } from '@/types';
import { ErrorReportingService } from '@/lib/errorReportingService';
import { useAuth } from './useAuth';

/**
 * Hook for accessing real-time leaderboard data
 */
export const useLeaderboard = (tournamentId?: string) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRanking, setUserRanking] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load global or tournament leaderboard based on tournamentId
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    let unsubscribe: () => void;
    
    try {
      if (tournamentId) {
        // Tournament-specific leaderboard
        unsubscribe = LeaderboardService.subscribeTournamentLeaderboard(
          tournamentId,
          (entries) => {
            setLeaderboard(entries);
            setLoading(false);
          }
        );
      } else {
        // Global leaderboard
        unsubscribe = LeaderboardService.subscribeToGlobalLeaderboard(
          (entries) => {
            setLeaderboard(entries);
            setLoading(false);
          }
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard data');
      setLoading(false);
      ErrorReportingService.captureError(err, { 
        context: 'useLeaderboard',
        tournamentId 
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tournamentId]);
  
  // Subscribe to current user's ranking if logged in
  useEffect(() => {
    if (!user?.uid) return;
    
    let unsubscribe: () => void;
    
    try {
      unsubscribe = LeaderboardService.subscribeToUserRanking(
        user.uid,
        (ranking) => {
          setUserRanking(ranking);
        }
      );
    } catch (err: any) {
      ErrorReportingService.captureError(err, { 
        context: 'useLeaderboard',
        userId: user.uid
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Filter leaderboard by country
  const filterByCountry = useCallback((country: string) => {
    if (!country) return leaderboard;
    return leaderboard.filter(entry => entry.country === country);
  }, [leaderboard]);
  
  // Check if user is in top positions
  const isUserInTop = useCallback((topN: number = 10): boolean => {    if (!user?.uid || !userRanking || userRanking.rank === undefined) return false;
    return userRanking.rank <= topN;
  }, [user, userRanking]);

  return {
    leaderboard,
    userRanking,
    loading,
    error,
    filterByCountry,
    isUserInTop
  };
};

export default useLeaderboard;
