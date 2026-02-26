import { useEffect, useState } from 'react';
import { Tournament } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useTournaments } from '@/hooks/useTournaments';

export interface TournamentRecommendation {
  tournament: Tournament;
  score: number;
  reasons: string[];
}

export const useTournamentRecommendations = () => {
  const { userProfile } = useAuth();
  const { stats } = usePlayerStats();
  const { tournaments } = useTournaments();
  const [recommendations, setRecommendations] = useState<TournamentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateRecommendations = () => {
      if (!userProfile || !stats || tournaments.length === 0) {
        setLoading(false);
        return;
      }

      const scored = tournaments
        .filter(t => t.status === 'upcoming')
        .map(tournament => {
          let score = 0;
          const reasons: string[] = [];

          // Skill level matching (40% weight)
          const entryFeeRange = getEntryFeeRange(stats.skillRating);
          if (tournament.entryFee >= entryFeeRange.min && tournament.entryFee <= entryFeeRange.max) {
            score += 40;
            reasons.push(`Matches your skill level (${stats.rank})`);
          } else if (tournament.entryFee < entryFeeRange.min) {
            score += 20;
            reasons.push('Good for building confidence');
          } else {
            score += 10;
            reasons.push('Challenge tournament');
          }

          // Favorite game mode (25% weight)
          if (tournament.type === stats.favoriteGameMode) {
            score += 25;
            reasons.push(`Your favorite mode (${stats.favoriteGameMode})`);
          }

          // Prize pool attractiveness (20% weight)
          const prizeToEntryRatio = tournament.prizePool / tournament.entryFee;
          if (prizeToEntryRatio >= 80) {
            score += 20;
            reasons.push('Excellent prize pool ratio');
          } else if (prizeToEntryRatio >= 60) {
            score += 15;
            reasons.push('Good prize pool ratio');
          } else if (prizeToEntryRatio >= 40) {
            score += 10;
            reasons.push('Fair prize pool');
          }

          // Participation level (10% weight)
          const fillPercentage = ((tournament.registeredTeams ?? 0) / (tournament.maxPlayers ?? 1)) * 100;
          if (fillPercentage >= 50 && fillPercentage <= 80) {
            score += 10;
            reasons.push('Good participation level');
          } else if (fillPercentage < 50) {
            score += 5;
            reasons.push('Easy to join');
          }

          // Recent performance boost (5% weight)
          if (stats.currentStreak > 0) {
            score += 5;
            reasons.push(`You're on a ${stats.currentStreak} win streak!`);
          }

          // Currency preference
          if (tournament.currency === userProfile.currency) {
            score += 5;
            reasons.push('Your preferred currency');
          }

          // Time consideration
          const timeUntilStart = new Date(tournament.startTime).getTime() - new Date().getTime();
          const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
          
          if (hoursUntilStart >= 2 && hoursUntilStart <= 24) {
            score += 5;
            reasons.push('Starting soon');
          }

          return {
            tournament,
            score,
            reasons: reasons.slice(0, 3) // Limit to top 3 reasons
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6); // Top 6 recommendations

      setRecommendations(scored);
      setLoading(false);
    };

    calculateRecommendations();
  }, [userProfile, stats, tournaments]);

  return { recommendations, loading };
};

const getEntryFeeRange = (skillRating: number) => {
  if (skillRating >= 2000) return { min: 200, max: 1000 };
  if (skillRating >= 1600) return { min: 100, max: 500 };
  if (skillRating >= 1200) return { min: 50, max: 200 };
  if (skillRating >= 800) return { min: 20, max: 100 };
  return { min: 10, max: 50 };
};
