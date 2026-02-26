import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import { Tournament } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { formatTournamentPrice, convertTournamentPrice, getCurrencyByCountry } from "@/utils/currencyConverter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Users, Trophy, DollarSign, Edit, Check, X } from 'lucide-react';
import type { Currency } from '../../types';

interface SimpleJoinModalProps {
  open: boolean;
  onClose: () => void;
  tournament: Tournament;
}

export default function SimpleJoinModal({
  open,
  onClose,
  tournament,
}: SimpleJoinModalProps) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { joinTournament } = useTournaments();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [teammates, setTeammates] = useState<string[]>([]);
  const [selectedSquadMembers, setSelectedSquadMembers] = useState<string[]>([]);
  const [showGameIdDialog, setShowGameIdDialog] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string>("");
  const [isEditingGameId, setIsEditingGameId] = useState(false);
  
  // Force single participant registration for all tournaments
  const maxSquadSize = 1;
  
  // Initialize teammates array based on squad size
  useEffect(() => {
    setTeammates([]);
    setSelectedSquadMembers([]);
    setCurrentGameId(userProfile?.gameId || "");
    setIsEditingGameId(!userProfile?.gameId); // Auto-edit if no game ID
  }, [open, tournament, userProfile?.gameId]);
  
  // Get wallet balance
  const walletBalance = userProfile?.walletBalance ?? 0;
  // Defensive: always use a valid currency string
  const currency: Currency = (userProfile?.currency || tournament.currency || 'INR') as Currency;
  // Derive the correct currency for the tournament based on its country
  const tournamentCurrency: Currency = tournament.country 
    ? getCurrencyByCountry(tournament.country)
    : (tournament.currency || 'INR') as Currency;
  const userCurrency: Currency = (userProfile?.currency || 'INR') as Currency;
  
  // Convert tournament entry fee to user's currency for balance comparison
  const convertedEntryFee = convertTournamentPrice(tournament.entryFee, tournamentCurrency, currency);
  
  // Check if user has sufficient balance
  const hasInsufficientBalance = walletBalance < convertedEntryFee;
  const handleJoin = async () => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if Game ID is provided (use current or saved)
    const gameIdToUse = currentGameId.trim() || userProfile.gameId?.trim();
    if (!gameIdToUse) {
      setShowGameIdDialog(true);
      return;
    }

    // Update user's game ID if it's different
    if (currentGameId.trim() && currentGameId.trim() !== userProfile.gameId) {
      try {
        // Update the user's profile with new game ID
        // This would require a user update function - for now, we'll proceed with the current game ID
        } catch (error) {
        console.error("Error updating game ID:", error);
      }
    }
    
    // Check wallet balance
    if (hasInsufficientBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(convertedEntryFee - walletBalance, currency)} more to join this tournament.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate teammates for non-solo tournaments
    if (maxSquadSize > 1) {
      const validTeammates = selectedSquadMembers.filter(member => member !== "" && member !== "__none__");
      const manualTeammates = teammates.filter(teammate => teammate.trim() !== "");
      
      const totalTeammates = validTeammates.length + manualTeammates.length;
      
      if (totalTeammates !== maxSquadSize - 1) {
        toast({
          title: "Incomplete Team",
          description: `Please select or add ${maxSquadSize - 1} teammate${maxSquadSize - 1 > 1 ? 's' : ''} for ${tournament.type} mode.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsJoining(true);
        // Prepare teammate data
      let teammatesToSend: string[] = [];
      
      if (maxSquadSize > 1) {
        // Collect valid squad members
        const validSquadMembers = selectedSquadMembers
          .filter(member => member !== "" && member !== "__none__");
          
        // Collect manual entries
        const manualEntries = teammates
          .filter(teammate => teammate.trim() !== "")
          .map(teammate => teammate.trim());
        
        // Combine both
        teammatesToSend = [...validSquadMembers, ...manualEntries];
        
        }
        // Call joinTournament with the tournament ID, teammates, and game ID
      const success = await joinTournament(tournament.id, teammatesToSend, gameIdToUse);
      if (success) {
        toast({
          title: "Tournament Joined!",
          description: `You have successfully joined ${tournament.title}. Entry fee of ${formatTournamentPrice(tournament.entryFee, tournamentCurrency, userCurrency)} has been deducted from your wallet.`,
        });
        onClose();
        
        // Navigate to My Matches
        setTimeout(() => {
          navigate("/matches");
        }, 1000);
      } else {
        toast({
          title: "Failed to Join",
          description: "Unable to join tournament. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining tournament:", error);
      toast({
        title: "Error",
        description: "An error occurred while joining the tournament.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-dark-card border-gray-800 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold">Join Tournament</DialogTitle>
          <DialogDescription className="text-gray-400">
            {tournament.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-1">
          {/* Tournament Info */}
          <div className="bg-dark-lighter rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-400">Prize Pool</span>
              </div>
              <span className="font-semibold text-green-400">
                {formatTournamentPrice(tournament.prizePool, tournamentCurrency, userCurrency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-400">Entry Fee</span>
              </div>
              <span className="font-semibold">
                {formatTournamentPrice(tournament.entryFee, tournamentCurrency, userCurrency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-400">Mode</span>
              </div>
              {/* Defensive: always use a valid matchType string */}
              <span className="font-semibold capitalize">{(tournament.matchType || 'solo').toLowerCase()}</span>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-dark-lighter rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Your Wallet Balance</span>
              <span className={`font-semibold ${hasInsufficientBalance ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(walletBalance, currency)}
              </span>
            </div>
          </div>

          {/* Game ID Section */}
          <div className="bg-dark-lighter rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Game ID</span>
              {userProfile?.gameId && !isEditingGameId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingGameId(true)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            
            {isEditingGameId ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="gameId" className="text-sm text-gray-300">Enter your Game ID</Label>
                  <Input
                    id="gameId"
                    type="text"
                    value={currentGameId}
                    onChange={(e) => setCurrentGameId(e.target.value)}
                    placeholder="Enter your in-game ID"
                    className="mt-1 bg-dark border-gray-700 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (currentGameId.trim()) {
                        setIsEditingGameId(false);
                      }
                    }}
                    disabled={!currentGameId.trim()}
                    className="flex-1 bg-green-700 hover:bg-green-800"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  {userProfile?.gameId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCurrentGameId(userProfile.gameId || "");
                        setIsEditingGameId(false);
                      }}
                      className="flex-1 border-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-mono text-green-400">
                  {currentGameId || userProfile?.gameId || "Not set"}
                </span>
                {userProfile?.gameId && currentGameId === userProfile.gameId && (
                  <span className="text-xs text-blue-400 bg-blue-900 bg-opacity-30 px-2 py-1 rounded">
                    Saved ID
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <div className="flex items-start gap-2 bg-red-900 bg-opacity-20 text-red-400 p-3 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Insufficient Balance</p>
                <p className="text-sm">
                  Add {formatCurrency(convertedEntryFee - walletBalance, currency)} more to your wallet to join this tournament.
                </p>
                <button
                  className="mt-2 px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-sm font-semibold"
                  onClick={() => {
                    window.location.href = '/wallet?addMoney=1';
                  }}
                >
                  Add Money
                </button>
              </div>
            </div>
          )}

          {/* Team Members (for duo/squad) */}
          {/* (Removed: No team member UI for single participant registration) */}
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700"
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={hasInsufficientBalance || isJoining || (!currentGameId.trim() && !userProfile?.gameId)}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
            >
              {isJoining ? "Joining..." : `Join (${formatTournamentPrice(tournament.entryFee, tournamentCurrency, currency)})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Game ID Required Dialog */}
    <Dialog open={showGameIdDialog} onOpenChange={setShowGameIdDialog}>
      <DialogContent className="bg-dark border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Game ID Required
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            You need to set your Game ID in your profile before joining tournaments.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowGameIdDialog(false)}
            className="flex-1 border-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowGameIdDialog(false);
              onClose();
              navigate('/profile');
            }}
            className="flex-1 bg-gradient-to-r from-primary to-secondary"
          >
            Go to Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
