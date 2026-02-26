import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tournament } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatMatchTime } from "@/lib/utils";
import { formatTournamentPrice } from "@/utils/currencyConverter";
import { Calendar, MapPin, Users, Trophy, Target, Clock, Star, TrendingUp, Shield } from 'lucide-react';
import SimpleJoinModal from "./SimpleJoinModal";

interface EnhancedTournamentCardProps {
  tournament: Tournament;
  showStats?: boolean;
  featured?: boolean;
}

const EnhancedTournamentCard = ({ 
  tournament, 
  /* showStats = false, */ // Removed unused prop
  featured = false 
}: EnhancedTournamentCardProps) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate("/login");
      return;
    }
    
    setJoinModalOpen(true);
  };

  const handleViewDetails = () => {
    navigate(`/tournaments/${tournament.id}`);
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const startTime = new Date(tournament.startTime);
    const diffTime = startTime.getTime() - now.getTime();
    
    if (diffTime <= 0) return "Started";
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${diffMinutes}m`;
  };

  // Get tournament difficulty based on entry fee
  const getDifficulty = () => {
    if (tournament.entryFee >= 500) return { level: "Expert", color: "text-red-400", icon: Shield };
    if (tournament.entryFee >= 100) return { level: "Intermediate", color: "text-yellow-400", icon: Star };
    return { level: "Beginner", color: "text-green-400", icon: Target };
  };

  // Defensive: treat undefined as 0 for fill calculation
  const registeredTeams = tournament.registeredTeams ?? 0;
  const maxPlayers = tournament.maxPlayers ?? 1;
  const fillPercentage = Math.round((registeredTeams / maxPlayers) * 100);
  
  const difficulty = getDifficulty();
  const DifficultyIcon = difficulty.icon;

  // Defensive: always pass a valid currency string
  const tournamentCurrency = tournament.currency ?? "INR";
  const userCurrency = userProfile?.currency ?? "INR";

  return (
    <>
      <Card className={`
        tournament-card bg-dark-card border-gray-800 cursor-pointer 
        transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10
        ${featured ? 'ring-2 ring-primary/30' : ''}
      `} onClick={handleViewDetails}>
        
        {/* Tournament Image with Overlays */}
        <div className="relative h-48 overflow-hidden">
          <img 
          src={tournament.image || "/netwin-logo.png"} 
            alt={tournament.title} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* Top Overlay */}
          <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <Badge 
                className={`bg-dark/80 text-white border-0 ${difficulty.color}`}
              >
                <DifficultyIcon className="h-3 w-3 mr-1" />
                {difficulty.level}
              </Badge>
              
              {featured && (
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0">
                  Featured
                </Badge>
              )}
            </div>
            
            <Badge className="bg-success/90 text-white border-0 font-medium backdrop-blur-sm">
              {formatTournamentPrice(tournament.entryFee, tournamentCurrency, userCurrency)}
            </Badge>
          </div>

          {/* Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{getTimeRemaining()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{registeredTeams}/{maxPlayers}</span>
                <div className="ml-2 w-16 h-1 bg-dark-lighter rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold font-poppins text-lg leading-tight">
                {tournament.title}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatMatchTime(new Date(tournament.startTime))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{tournament.map}</span>
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="ml-2 capitalize">
              {tournament.mode}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="py-3">
          {/* Prize Information Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-dark-lighter/50 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-4 w-4 text-green-400 mr-1" />
                <p className="text-xs text-gray-400">Prize Pool</p>
              </div>
              <p className="font-rajdhani font-bold text-green-400 text-sm">
                {formatTournamentPrice(tournament.prizePool, tournamentCurrency, userCurrency)}
              </p>
            </div>
            
            <div className="text-center bg-dark-lighter/50 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center justify-center mb-1">
                <Target className="h-4 w-4 text-red-400 mr-1" />
                <p className="text-xs text-gray-400">Per Kill</p>
              </div>
              <p className="font-rajdhani font-bold text-red-400 text-sm">
                {tournament.killReward ? 
                  formatTournamentPrice(tournament.killReward, tournamentCurrency, userCurrency) : 
                  "₹0"
                }
              </p>
            </div>
            
            <div className="text-center bg-dark-lighter/50 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-blue-400 mr-1" />
                <p className="text-xs text-gray-400">Filled</p>
              </div>
              <p className="font-rajdhani font-bold text-blue-400 text-sm">
                {fillPercentage}%
              </p>
            </div>
          </div>

          {/* Tournament Status Indicator */}
          {fillPercentage >= 90 && (
            <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center justify-center text-orange-400 text-xs font-medium">
                <Clock className="h-3 w-3 mr-1" />
                Filling Fast - Only {maxPlayers - registeredTeams} spots left!
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3">
          <Button 
            className="w-full bg-gradient-to-r from-primary to-secondary text-white 
                     font-medium transition-all duration-300 hover:opacity-90 
                     hover:shadow-lg hover:shadow-primary/20"
            onClick={handleJoinClick}
            disabled={tournament.status === "completed" || tournament.status === "cancelled"}
          >
            {tournament.status === "completed" ? "Tournament Ended" : 
             tournament.status === "cancelled" ? "Tournament Cancelled" : 
             tournament.status === "ongoing" ? "Join Live Tournament" : 
             fillPercentage >= 100 ? "Tournament Full" :
             "Join Tournament"}
          </Button>
        </CardFooter>
      </Card>
      {joinModalOpen && (
        <SimpleJoinModal
          tournament={tournament}
          open={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
        />
      )}
    </>
  );
};

export default EnhancedTournamentCard;
