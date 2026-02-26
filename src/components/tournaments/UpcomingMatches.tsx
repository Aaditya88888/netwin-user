import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tournament, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Trophy, Clock } from 'lucide-react';
import { formatTournamentPrice, getCurrencyByCountry } from '@/utils/currencyConverter';

const UpcomingMatches = () => {
  // Fix: Declare hooks first, in the correct order
  const { userProfile } = useAuth() as { userProfile: UserProfile | null };
  const { tournaments } = useTournaments();
  const [upcomingMatches, setUpcomingMatches] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      if (!userProfile) {
        setLoading(false);
        return;
      }

      try {
        // Helper function to get user ID regardless of user type
        const getUserId = (user: UserProfile): string | undefined => {
          return user?.uid || user?.id;
        };

        // Simplified query - just get all registrations for this user
        const userId = getUserId(userProfile);
        if (!userId) {
          setUpcomingMatches([]);
          setLoading(false);
          return;
        }

        const registrationsQuery = query(
          collection(db, 'tournament_registrations'),
          where('userId', '==', userId)
        );

        const registrationsSnapshot = await getDocs(registrationsQuery);

        const tournamentIds = registrationsSnapshot.docs.map(doc => doc.data().tournamentId);

        if (tournamentIds.length > 0) {
          const registeredTournaments = tournaments.filter(tournament => {
            return tournamentIds.includes(tournament.id);
          });

          setUpcomingMatches(registeredTournaments);
        } else {
          setUpcomingMatches([]);
        }
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
        setUpcomingMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMatches();
  }, [userProfile, tournaments]);

  if (loading) return <div>Loading upcoming matches...</div>;

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Upcoming Matches
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingMatches.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No upcoming matches. Join a tournament to see your matches here.
          </p>
        ) : (
          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="bg-dark-lighter p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{match.title}</h3>
                  <Badge variant="outline" className="text-green-400 border-green-700">
                    Registered
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(match.startTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(match.startTime).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {match.registeredTeams || 0}/{match.maxPlayers || match.participants || 0} players
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    {formatTournamentPrice(
                      match.prizePool, 
                      match.country ? getCurrencyByCountry(match.country) : (match.currency || "INR"), 
                      userProfile?.currency || "INR"
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingMatches;