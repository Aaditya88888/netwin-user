import React from "react";
import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  getDocs,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users,
  Calendar,
  Filter
} from "lucide-react";

interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  gameId: string;
  stats: {
    totalTournaments: number;
    tournamentsWon: number;
    totalEarnings: number;
    winRate: number;
    currentStreak: number;
    points: number;
  };
  rank: number;
  lastActive: Timestamp;
}

interface TeamEntry {
  id: string;
  teamName: string;
  members: Array<{
    userId: string;
    displayName: string;
    photoURL?: string;
  }>;
  stats: {
    totalTournaments: number;
    tournamentsWon: number;
    totalEarnings: number;
    winRate: number;
    points: number;
  };
  rank: number;
}

export default function EnhancedLeaderboard() {
  const { userProfile } = useAuth();
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboards();
  }, [userProfile]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGlobalLeaderboard(),
        fetchWeeklyLeaderboard(),
        fetchTeamLeaderboard(),
        fetchFriendsLeaderboard()
      ]);
    } catch (error) {
      console.error("Error fetching leaderboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalLeaderboard = async () => {
    const leaderboardRef = collection(db, "user_stats");
    const q = query(
      leaderboardRef,
      orderBy("stats.points", "desc"),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((doc, index) => ({
      id: doc.id,
      ...doc.data(),
      rank: index + 1
    })) as LeaderboardEntry[];
    
    setGlobalLeaderboard(entries);
    
    // Find user's rank
    const userEntry = entries.find(entry => entry.userId === userProfile?.uid);
    if (userEntry) {
      setUserRank(userEntry.rank);
    }
  };

  const fetchWeeklyLeaderboard = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const leaderboardRef = collection(db, "weekly_stats");
    const q = query(
      leaderboardRef,
      where("week", "==", getWeekString(new Date())),
      orderBy("points", "desc"),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((doc, index) => ({
      id: doc.id,
      ...doc.data(),
      rank: index + 1
    })) as LeaderboardEntry[];
    
    setWeeklyLeaderboard(entries);
  };

  const fetchTeamLeaderboard = async () => {
    const teamsRef = collection(db, "team_stats");
    const q = query(
      teamsRef,
      orderBy("stats.points", "desc"),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((doc, index) => ({
      id: doc.id,
      ...doc.data(),
      rank: index + 1
    })) as TeamEntry[];
    
    setTeamLeaderboard(entries);
  };

  const fetchFriendsLeaderboard = async () => {
    if (!userProfile?.friends?.length) {
      setFriendsLeaderboard([]);
      return;
    }

    const leaderboardRef = collection(db, "user_stats");
    const q = query(
      leaderboardRef,
      where("userId", "in", userProfile.friends),
      orderBy("stats.points", "desc")
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((doc, index) => ({
      id: doc.id,
      ...doc.data(),
      rank: index + 1
    })) as LeaderboardEntry[];
    
    setFriendsLeaderboard(entries);
  };

  const getWeekString = (date: Date) => {
    const year = date.getFullYear();
    const week = Math.ceil(date.getDate() / 7);
    const month = date.getMonth() + 1;
    return `${year}-${month}-W${week}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return "bg-gradient-to-r from-yellow-400 to-orange-500";
    if (rank <= 10) return "bg-gradient-to-r from-purple-400 to-pink-500";
    if (rank <= 50) return "bg-gradient-to-r from-blue-400 to-cyan-500";
    return "bg-gradient-to-r from-gray-400 to-gray-600";
  };

  const LeaderboardTable = ({ entries }: { entries: LeaderboardEntry[] }) => (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card 
          key={entry.id} 
          className={`${entry.userId === userProfile?.uid ? 'ring-2 ring-primary' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  {entry.rank <= 10 && (
                    <Badge className={`${getRankBadgeColor(entry.rank)} text-white`}>
                      Top {entry.rank <= 3 ? '3' : '10'}
                    </Badge>
                  )}
                </div>
                
                <Avatar className="w-12 h-12">
                  <AvatarImage src={entry.photoURL} />
                  <AvatarFallback>
                    {entry.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold">{entry.displayName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{entry.gameId}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">{entry.stats.points}</div>
                    <div className="text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{entry.stats.tournamentsWon}</div>
                    <div className="text-gray-500">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{entry.stats.winRate}%</div>
                    <div className="text-gray-500">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TeamLeaderboardTable = ({ entries }: { entries: TeamEntry[] }) => (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex -space-x-2">
                  {entry.members.slice(0, 3).map((member) => (
                    <Avatar key={member.userId} className="w-8 h-8 border-2 border-white">
                      <AvatarImage src={member.photoURL} />
                      <AvatarFallback className="text-xs">
                        {member.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {entry.members.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
                      +{entry.members.length - 3}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold">{entry.teamName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.members.length} members
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">{entry.stats.points}</div>
                    <div className="text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{entry.stats.tournamentsWon}</div>
                    <div className="text-gray-500">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{entry.stats.winRate}%</div>
                    <div className="text-gray-500">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Leaderboards</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {userRank && (
            <Badge variant="outline" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Your Rank: #{userRank}
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable entries={globalLeaderboard} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>This Week&apos;s Top Players</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable entries={weeklyLeaderboard} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamLeaderboardTable entries={teamLeaderboard} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Friends Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {friendsLeaderboard.length > 0 ? (
                <LeaderboardTable entries={friendsLeaderboard} />
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No friends yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add friends to see how you rank against them!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
