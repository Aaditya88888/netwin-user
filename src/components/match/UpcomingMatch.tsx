import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatMatchTime, getTimeRemainingInSeconds } from "@/lib/utils";
import CountdownTimer from "@/components/common/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  MapPin, 
  Users,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";

interface UpcomingMatchProps {
  match: Match;
}

const UpcomingMatch = ({ match }: UpcomingMatchProps) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  const handleViewDetails = () => {
    navigate(`/matches/${match.id}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };
    // Calculate time remaining until match starts
  const matchDate = new Date(match.date);
  const now = new Date();
  // Match is started if it's manually set to "ongoing" OR if it's past the scheduled time
  const isMatchStarted = match.status === "ongoing" || now >= matchDate;
  const secondsRemaining = getTimeRemainingInSeconds(matchDate);
  
  const roomId = match.roomId || match.roomDetails?.roomId || "";
  const password = match.roomPassword || match.roomDetails?.password || "";

  return (
    <div className="bg-dark-card rounded-xl overflow-hidden border border-gray-800 p-4 sm:p-6">
      <div className="sm:flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {/* Fix: Use correct status enums */}
            {match.status === "ongoing" && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">LIVE</span>
            )}
            {match.status === "scheduled" && (
              <span className="bg-warning text-dark text-xs font-medium px-2 py-0.5 rounded">UPCOMING</span>
            )}
            <span className="bg-dark bg-opacity-70 text-xs font-medium px-2 py-0.5 rounded text-white">
              {match.mode}
            </span>
          </div>
          <h3 className="text-lg font-bold font-poppins">{match.tournamentTitle}</h3>
          
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center text-sm text-gray-300">
              <Calendar className="h-4 w-4 mr-1" /> 
              {formatMatchTime(new Date(match.date))}
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <MapPin className="h-4 w-4 mr-1" /> 
              {match.map}
            </div>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <div className="gradient-border inline-block">
            <div className="bg-dark-card px-4 py-3 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">
                  {isMatchStarted ? "Match started" : "Match starts in"}
                </div>
                <div className="font-rajdhani font-bold text-xl text-white">
                  {isMatchStarted ? (
                    <span className="text-red-400">LIVE NOW</span>
                  ) : (
                    <CountdownTimer initialSeconds={secondsRemaining} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Squad Members */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Your Squad</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Get user information */}
          <div className="bg-dark-lighter rounded-lg p-3 flex items-center gap-3 border-2 border-primary">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.profilePicture || undefined} alt={userProfile?.username || "User"} />
              <AvatarFallback className="bg-primary/20">
                {userProfile?.username 
                  ? userProfile.username.substring(0, 2).toUpperCase() 
                  : userProfile?.displayName 
                    ? userProfile.displayName.substring(0, 2).toUpperCase()
                    : "ME"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{userProfile?.username || "You"}</div>
              <div className="text-xs text-gray-400">You</div>
            </div>
          </div>
          
          {/* Show teammates (excluding the current user) */}
          {match.teamMembers
            .filter(member => member.id !== userProfile?.uid)
            .map((member, index) => (
              <div 
                key={`member-${member.id}-${index}`} 
                className="bg-dark-lighter rounded-lg p-3 flex items-center gap-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/20">
                    TM
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.username}</div>
                  <div className="text-xs text-gray-400">Friend</div>
                </div>
              </div>
            ))
          }
          
          {/* Fill empty slots based on match mode */}
          {match.mode === "squad" && match.teamMembers.length < 4 && (
            Array(4 - match.teamMembers.length).fill(0).map((_, index) => (
              <div key={`empty-${index}`} className="bg-dark-lighter rounded-lg p-3 border border-dashed border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-5 w-5 text-gray-600 mx-auto" />
                  <div className="text-xs text-gray-600 mt-1">Empty Slot</div>
                </div>
              </div>
            ))
          )}
          
          {match.mode === "duo" && match.teamMembers.length < 2 && (
            <div className="bg-dark-lighter rounded-lg p-3 border border-dashed border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-5 w-5 text-gray-600 mx-auto" />
                <div className="text-xs text-gray-600 mt-1">Empty Slot</div>
              </div>
            </div>
          )}
        </div>
      </div>
        {/* Match Room Details */}
      <div className="mt-6 p-4 bg-dark-lighter rounded-lg border border-gray-800">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Room Details</h4>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-dark-card rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-400">Room ID</div>
              {roomId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-gray-400 hover:text-white"
                  onClick={() => copyToClipboard(roomId, "Room ID")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="font-mono font-medium">{roomId || <span className="text-gray-500">Not assigned</span>}</div>
          </div>
          <div className="p-3 bg-dark-card rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-400">Room Password</div>
              {password && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(password, "Room Password")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="font-mono font-medium">{password ? (showPassword ? password : "••••••") : <span className="text-gray-500">Not assigned</span>}</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={handleViewDetails}
        >
          View Match Details
        </Button>
      </div>
    </div>
  );
};

export default UpcomingMatch;
