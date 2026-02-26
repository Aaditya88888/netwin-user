import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTournaments } from "@/hooks/useTournaments";
import { Match } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock, AlertTriangle, ChevronLeft, Share2 } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMatch } = useTournaments();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadMatch = async () => {
      if (id) {
        setLoading(true);
        
        // Try to get match data
        const data = getMatch(id);
        
        if (data) {
          setMatch(data);
          setLoading(false);
        } else {
          console.error('No match found for ID:', id);
          // Give it a moment for data to load if not found initially
          setTimeout(() => {
            const retryData = getMatch(id);
            if (retryData) {
              setMatch(retryData);
            } else {
              console.error('Match still not found after retry');
            }
            setLoading(false);
          }, 1000);
        }
      } else {
        setLoading(false);
      }
    };
    loadMatch();
  }, [id, getMatch]);

  if (loading || (!match && id)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match && !loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Match Not Found</h2>
          <p className="text-gray-400 mb-4">
            The match you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => navigate("/matches")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Matches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10">
      {/* Back Button */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button 
          variant="ghost" 
          className="gap-2 touch-target" 
          onClick={() => navigate("/matches")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Matches</span>
          <span className="sm:hidden">Back</span>
        </Button>
        <Button variant="outline" size="sm" className="touch-target">
          <Share2 className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* Match Details */}
      <Card className="bg-dark-card border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-responsive-lg font-bold font-poppins truncate">
              Match #{match?.id || "Unknown"}
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base truncate">
              Tournament: {match?.tournamentId || "Unknown"}
            </p>
          </div>
          <Badge variant={match?.status === "scheduled" ? "default" : "secondary"} className="self-start md:self-auto">
            {match?.status?.toUpperCase() || "UNKNOWN"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Match Details</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm text-gray-400">Start Time</div>
                  <div className="font-semibold text-sm sm:text-base truncate">
                    {match?.startTime ? new Date(match.startTime).toLocaleString() : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm text-gray-400">End Time</div>
                  <div className="font-semibold text-sm sm:text-base truncate">
                    {match?.endTime ? new Date(match.endTime).toLocaleString() : "N/A"}
                  </div>
                </div>
              </div>

              {match?.status === "scheduled" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm text-gray-400">Room ID</div>
                      <div className="font-semibold text-sm sm:text-base font-mono">{match?.roomId || "N/A"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm text-gray-400">Room Password</div>
                      <div className="font-semibold text-sm sm:text-base font-mono">{match?.roomPassword || "N/A"}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {match?.status === "completed" && match?.results && (
            <div className="mt-6 md:mt-0">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Match Results</h2>
              <div className="space-y-3 sm:space-y-4">
                {match.results.map((result) => (
                  <div key={result.userId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 bg-dark-lighter rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base">Player {result.userId}</div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        Kills: {result.kills} | Placement: #{result.placement}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-medium text-primary text-sm sm:text-base">
                        {formatCurrency(result.earnings ?? 0, "USD")}
                      </div>
                      <div className="text-xs text-gray-400">
                        {result.verified ? "Verified" : "Pending Verification"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MatchDetail;