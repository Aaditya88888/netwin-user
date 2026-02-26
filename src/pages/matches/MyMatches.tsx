import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { useTournaments } from "@/hooks/useTournaments";
import { useToast } from "@/hooks/use-toast";
import { Match } from "@/types";
import { UserMatchExtended } from "@/contexts/TournamentContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gamepad2, RefreshCw } from "lucide-react";
import UpcomingMatch from "@/components/match/UpcomingMatch";
import MatchResults from "@/components/match/MatchResults";

export default function MyMatches() {
  const { user } = useAuth();
  const { matches, uploadMatchResult } = useMatches();
  const { userMatches, fetchUserMatches, cleanupOrphanedUserMatches } = useTournaments();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "completed">("upcoming");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  if (!user) return null;

  // Fetch user matches when component mounts
  useEffect(() => {
    fetchUserMatches();
  }, [fetchUserMatches]);

  // Refresh matches and cleanup orphaned entries
  const handleRefreshMatches = async () => {
    setIsRefreshing(true);
    try {
      await cleanupOrphanedUserMatches();
      await fetchUserMatches();
      toast({
        title: "Matches refreshed",
        description: "Your matches have been updated and cleaned up.",
      });
    } catch (error) {
      console.error("Error refreshing matches:", error);
      toast({
        title: "Error",
        description: "Failed to refresh matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create a deduplicated list of matches using tournament ID as the key
  const createDedupedMatches = (): Match[] => {
    const matchMap = new Map<string, Match>();
    
    // Add matches from useMatches hook
    matches.forEach((match: Match) => {
      matchMap.set(match.tournamentId, match);
    });

    // Add/override with userMatches from TournamentContext (these are more complete)
    userMatches.forEach((userMatch: UserMatchExtended) => {
      // Only include if tournament exists (filter deleted tournaments)
      if (userMatch.tournamentTitle && userMatch.tournamentTitle !== "Unknown Tournament") {
        const matchFromUserMatch: Match = {
          id: userMatch.id,
          tournamentId: userMatch.tournamentId,
          tournamentTitle: userMatch.tournamentTitle,          // Required Match interface properties
          date: userMatch.startTime instanceof Date ? userMatch.startTime : new Date(userMatch.startTime),
          startTime: userMatch.startTime instanceof Date ? userMatch.startTime : new Date(userMatch.startTime),
          endTime: new Date((userMatch.startTime instanceof Date ? userMatch.startTime : new Date(userMatch.startTime)).getTime() + 2 * 60 * 60 * 1000), // 2 hours later
          status: (userMatch.status === 'scheduled' ? 'scheduled' : 
                  userMatch.status === 'ongoing' ? 'ongoing' : 
                  userMatch.status === 'completed' ? 'completed' :
                  'scheduled') as 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'registered' | 'result_submitted',
          mode: userMatch.type as 'solo' | 'duo' | 'squad',
          map: "Erangel", // Default map since userMatch doesn't have this field
          teamMembers: userMatch.teamMembers || [
            {
              id: userMatch.userId,
              username: userMatch.teamName || "Player",
              inGameId: userMatch.userId,
              isOwner: true,
              kills: userMatch.kills || 0
            }
          ],
          currency: "INR", // Default currency since userMatch doesn't have this field
          // Optional properties from userMatch
          kills: userMatch.kills || 0,
          position: userMatch.position,
          prize: userMatch.prizePool,
          participants: [], // Empty array since participants is optional array type
          roomDetails: {
            roomId: userMatch.roomId || "",
            password: userMatch.roomPassword || "",
            visibleAt: new Date((userMatch.startTime instanceof Date ? userMatch.startTime : new Date(userMatch.startTime)).getTime() - 15 * 60 * 1000) // 15 min before
          },
          resultSubmitted: userMatch.resultSubmitted || false,
          resultApproved: userMatch.resultVerified || false,
          resultScreenshot: userMatch.resultImageUrl,
          // Additional properties
          userId: userMatch.userId,
        };
        matchMap.set(userMatch.tournamentId, matchFromUserMatch);
      }
    });
    
    return Array.from(matchMap.values());
  };
  // Use deduplicated matches
  const allMatches = createDedupedMatches();

  // Filter matches by status
  const upcomingMatches = allMatches.filter(
    (match: Match) => match.status === "scheduled" || match.status === "ongoing"
  );
  const completedMatches = allMatches.filter(
    (match: Match) => match.status === "completed"
  );

  // Handle result upload
  const handleUploadResult = async (matchId: string, screenshot: string, kills?: number, placement?: number) => {
    try {
      return await uploadMatchResult(matchId, screenshot, kills, placement);
    } catch (error) {
      console.error("Error uploading result:", error);
      return false;
    }
  };

  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-responsive-lg font-bold font-poppins">
            My Matches
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            View your upcoming and completed matches
          </p>
        </div>
        <Button
          onClick={handleRefreshMatches}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="ml-4 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>
      
      <Tabs 
        defaultValue="upcoming" 
        value={selectedTab} 
        onValueChange={(value) => setSelectedTab(value as "upcoming" | "completed")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
          <TabsTrigger value="upcoming" className="py-2 sm:py-3 text-sm sm:text-base">
            <span className="hidden sm:inline">Upcoming</span>
            <span className="sm:hidden">Upcoming</span>
            {upcomingMatches.length > 0 && (
              <Badge variant="outline" className="ml-1 sm:ml-2 border-primary text-primary text-xs px-1 sm:px-2">
                {upcomingMatches.length}
              </Badge>            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="py-2 sm:py-3 text-sm sm:text-base">
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Done</span>
            {completedMatches.length > 0 && (
              <Badge variant="outline" className="ml-1 sm:ml-2 border-primary text-primary text-xs px-1 sm:px-2">
                {completedMatches.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">              {upcomingMatches.map((match: Match) => (
                <UpcomingMatch key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card className="bg-dark-card border-gray-800 p-6 sm:p-10 text-center">
              <div className="flex flex-col items-center">
                <Gamepad2 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mb-3" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No Upcoming Matches</h3>
                <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base">
                  You haven&apos;t registered for any upcoming tournaments yet. Browse tournaments to join your first match!
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedMatches.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">              
              {completedMatches.map((match: Match) => {
                return (
                  <MatchResults 
                    key={match.id} 
                    match={match} 
                    onUploadResult={(matchId, screenshot, kills, placement) => handleUploadResult(matchId, screenshot, kills, placement)}
                  />
                );
              })}
            </div>
          ) : (
            <Card className="bg-dark-card border-gray-800 p-6 sm:p-10 text-center">
              <div className="flex flex-col items-center">
                <Gamepad2 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mb-3" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No Completed Matches</h3>
                <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base">
                  You haven&apos;t played any matches yet. Join a tournament to start your gaming journey!
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}