import React from "react";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  BarChart3,
  Calendar,
  Users
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function PlayerStatsDashboard() {
  const { userProfile } = useAuth();
  const { stats, loading, error } = usePlayerStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-dark-card border-gray-800">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">{error || "No statistics available"}</p>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'diamond': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'platinum': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'gold': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'silver': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    }
  };

  const getWinRateColor = (rate: number) => {
    if (rate >= 20) return 'text-green-400';
    if (rate >= 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-poppins">Player Statistics</h2>
          <p className="text-gray-400 mt-1">Your tournament performance overview</p>
        </div>
        <Badge className={`${getRankColor(stats.rank)} border font-medium`}>
          {stats.rank} • {stats.skillRating} SR
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tournaments Played */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
              Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTournaments}</div>
            <p className="text-sm text-gray-400 mt-1">
              {stats.tournamentsWon} wins • {stats.winRate}% win rate
            </p>
          </CardContent>
        </Card>

        {/* Total Kills */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Total Kills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.totalKills}</div>
            <p className="text-sm text-gray-400 mt-1">
              {stats.averageKills} avg per match
            </p>
          </CardContent>
        </Card>

        {/* Average Position */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Avg Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">#{Math.round(stats.averagePosition)}</div>
            <p className="text-sm text-gray-400 mt-1">
              Position in tournaments
            </p>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(stats.totalEarnings, userProfile?.currency || 'INR')}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Total prize money
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Win Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-dark-lighter rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getWinRateColor(stats.winRate)} bg-current transition-all duration-500`}
                    style={{ width: `${Math.min(stats.winRate * 5, 100)}%` }}
                  />
                </div>
                <span className={`font-medium ${getWinRateColor(stats.winRate)}`}>
                  {stats.winRate}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Current Streak</span>
              <Badge variant={stats.currentStreak > 0 ? "default" : "secondary"}>
                {stats.currentStreak > 0 ? `${stats.currentStreak} wins` : 'No streak'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Best Streak</span>
              <span className="font-medium text-yellow-400">{stats.bestStreak} wins</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Favorite Mode</span>
              <Badge variant="outline" className="capitalize">
                {stats.favoriteGameMode}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Performance */}
        <Card className="bg-dark-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPerformance.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPerformance.map((match, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-dark-lighter/50 rounded-lg border border-gray-800"
                  >
                    <div>
                      <p className="font-medium text-sm truncate max-w-32">
                        {match.tournamentTitle}
                      </p>
                      <p className="text-xs text-gray-400">
                        {match.date.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-yellow-400" />
                        <span>#{match.position}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-red-400" />
                        <span>{match.kills}</span>
                      </div>
                      {match.earnings > 0 && (
                        <div className="flex items-center gap-1 text-green-400">
                          <Award className="h-3 w-3" />
                          <span>+{formatCurrency(match.earnings, userProfile?.currency || 'INR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent matches</p>
                <p className="text-sm text-gray-500">Join a tournament to see your performance here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
