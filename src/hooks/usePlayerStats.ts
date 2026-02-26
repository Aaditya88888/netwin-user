import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface PlayerStats {
  userId: string;
  totalTournaments: number;
  tournamentsWon: number;
  totalKills: number;
  averageKills: number;
  averagePosition: number;
  winRate: number;
  totalEarnings: number;
  currentStreak: number;
  bestStreak: number;
  favoriteGameMode: string;
  skillRating: number;
  rank: string;
  recentPerformance: RecentMatch[];
}

export interface RecentMatch {
  tournamentId: string;
  tournamentTitle: string;
  position: number;
  kills: number;
  earnings: number;
  date: Date;
}

export interface TournamentAnalytics {
  totalParticipants: number;
  averageSkillLevel: number;
  prizePoolDistribution: {
    position: number;
    amount: number;
    percentage: number;
  }[];
  popularGameModes: {
    mode: string;
    count: number;
    percentage: number;
  }[];
  participationTrends: {
    date: Date;
    participants: number;
    revenue: number;
  }[];
}

export const usePlayerStats = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch user matches
        const matchesQuery = query(
          collection(db, 'user_matches'),
          where('userId', '==', userProfile.uid),
          orderBy('registeredAt', 'desc')
        );        const matchesSnapshot = await getDocs(matchesQuery);
        const matches = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          registeredAt: doc.data().registeredAt?.toDate() || new Date(),
          startTime: doc.data().startTime?.toDate() || new Date(),
        })) as any[];

        // Calculate statistics
        const totalTournaments = matches.length;
        const tournamentsWon = matches.filter(m => m.position === 1).length;
        const completedMatches = matches.filter(m => m.status === 'completed');
        const totalKills = completedMatches.reduce((sum, m) => sum + (m.kills || 0), 0);
        const totalEarnings = completedMatches.reduce((sum, m) => sum + (m.earnings || 0), 0);
        
        const averageKills = completedMatches.length > 0 ? totalKills / completedMatches.length : 0;
        const averagePosition = completedMatches.length > 0 
          ? completedMatches.reduce((sum, m) => sum + (m.position || 0), 0) / completedMatches.length 
          : 0;
        
        const winRate = totalTournaments > 0 ? (tournamentsWon / totalTournaments) * 100 : 0;

        // Calculate skill rating (simplified ELO-like system)
        let skillRating = 1000; // Base rating
        completedMatches.forEach(match => {
          const positionMultiplier = Math.max(0, (101 - (match.position || 100)) / 100);
          const killMultiplier = Math.min(2, (match.kills || 0) / 10);
          skillRating += (positionMultiplier * 50) + (killMultiplier * 25);
        });

        // Determine rank based on skill rating
        const rank = skillRating >= 2000 ? 'Diamond' : 
                    skillRating >= 1600 ? 'Platinum' : 
                    skillRating >= 1200 ? 'Gold' : 
                    skillRating >= 800 ? 'Silver' : 'Bronze';

        // Get recent matches
        const recentMatches: RecentMatch[] = completedMatches.slice(0, 5).map(match => ({
          tournamentId: match.tournamentId,
          tournamentTitle: match.tournamentTitle,
          position: match.position || 0,
          kills: match.kills || 0,
          earnings: match.earnings || 0,
          date: match.startTime,
        }));

        // Calculate streaks
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        // Current streak (from most recent matches)
        for (let i = 0; i < completedMatches.length; i++) {
          if (completedMatches[i].position === 1) {
            if (i === 0) currentStreak++;
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
          } else {
            if (i === 0) currentStreak = 0;
            tempStreak = 0;
          }
        }

        // Find favorite game mode
        const gameModeCount = matches.reduce((acc, match) => {
          const mode = match.type || 'squad';
          acc[mode] = (acc[mode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
          const favoriteGameMode = Object.entries(gameModeCount)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'squad';

        const playerStats: PlayerStats = {
          userId: userProfile.uid,
          totalTournaments,
          tournamentsWon,
          totalKills,
          averageKills: Math.round(averageKills * 100) / 100,
          averagePosition: Math.round(averagePosition * 100) / 100,
          winRate: Math.round(winRate * 100) / 100,
          totalEarnings,
          currentStreak,
          bestStreak,
          favoriteGameMode,
          skillRating: Math.round(skillRating),
          rank,
          recentPerformance: recentMatches,
        };

        setStats(playerStats);
      } catch (err) {
        console.error('Error fetching player stats:', err);
        setError('Failed to load player statistics');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchStats();
    }
  }, [userProfile]);

  return { stats, loading, error, refetch: async () => {
    if (userProfile) {
      // Re-run the fetch logic
      setLoading(true);
      try {
        const matchesQuery = query(
          collection(db, 'user_matches'),
          where('userId', '==', userProfile.uid),
          orderBy('registeredAt', 'desc')
        );
        // ... rest of fetch logic would go here
      } catch (err) {
        setError('Failed to refetch player statistics');
      } finally {
        setLoading(false);
      }
    }
  }};
};

export const useTournamentAnalytics = (tournamentId?: string) => {
  const [analytics, setAnalytics] = useState<TournamentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        let query1;
        if (tournamentId) {
          // Analytics for specific tournament
          query1 = query(
            collection(db, 'user_matches'),
            where('tournamentId', '==', tournamentId)
          );
        } else {
          // Global analytics - recent tournaments
          query1 = query(
            collection(db, 'user_matches'),
            orderBy('registeredAt', 'desc'),
            limit(1000)
          );
        }        const snapshot = await getDocs(query1);
        const matches = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          registeredAt: doc.data().registeredAt?.toDate() || new Date(),
          startTime: doc.data().startTime?.toDate() || new Date(),
        })) as any[];

        // Calculate analytics
        const totalParticipants = matches.length;
        
        // Game mode popularity
        const gameModeCount = matches.reduce((acc, match) => {
          const mode = match.type || 'squad';
          acc[mode] = (acc[mode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);        const popularGameModes = Object.entries(gameModeCount)
          .map(([mode, count]) => ({
            mode,
            count: count as number,
            percentage: Math.round(((count as number) / totalParticipants) * 100),
          }))
          .sort((a, b) => b.count - a.count);

        // Participation trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentMatches = matches.filter(m => m.registeredAt >= thirtyDaysAgo);
        const participationTrends = [];

        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const dayMatches = recentMatches.filter(m => {
            const matchDate = new Date(m.registeredAt);
            matchDate.setHours(0, 0, 0, 0);
            return matchDate.getTime() === date.getTime();
          });

          const revenue = dayMatches.reduce((sum, m) => sum + (m.entryFee || 0), 0);

          participationTrends.push({
            date,
            participants: dayMatches.length,
            revenue,
          });
        }

        const analyticsData: TournamentAnalytics = {
          totalParticipants,
          averageSkillLevel: 1200, // Placeholder
          prizePoolDistribution: [
            { position: 1, amount: 0, percentage: 50 },
            { position: 2, amount: 0, percentage: 30 },
            { position: 3, amount: 0, percentage: 20 },
          ],
          popularGameModes,
          participationTrends,
        };

        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching tournament analytics:', err);
        setError('Failed to load tournament analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [tournamentId]);

  return { analytics, loading, error };
};
