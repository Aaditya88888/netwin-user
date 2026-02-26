import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import { Tournament } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { formatTournamentPrice, convertTournamentPrice } from "@/utils/currencyConverter";
import { AlertTriangle, Users, Trophy, DollarSign } from 'lucide-react';
import type { Currency } from '../../types';

interface JoinTournamentModalProps {
  open: boolean;
  onClose: () => void;
  tournament: Tournament;
}

// Helper to ensure a valid Currency type
const safeCurrency = (currency: string | undefined): Currency => {
  return (currency && ['INR','USD','NGN','EUR','GBP'].includes(currency)) ? currency as Currency : 'INR';
};

export default function JoinTournamentModal({
  open,
  onClose,
  tournament,
}: JoinTournamentModalProps) {
  const navigate = useNavigate();  const { userProfile } = useAuth();
  const { joinTournament, loading } = useTournaments();
  const { toast } = useToast();
  const [teammates, setTeammates] = useState<string[]>([]);
  const [selectedSquadMembers, setSelectedSquadMembers] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [showGameIdDialog, setShowGameIdDialog] = useState(false);

  // Determine max squad size based on tournament type
  const maxSquadSize = 1; // Always single participant registration
    // Initialize teammates array based on squad size
  useEffect(() => {
    setTeammates([]);
    setSelectedSquadMembers([]);
  }, []);

  // Check if user profile has required properties
  if (!userProfile) {
    return null;
  }  // Get wallet balance safely
  const walletBalance = userProfile.walletBalance ?? 0;
  const currency = userProfile.currency ?? "INR";

  // Convert tournament entry fee to user's currency for balance comparison
  const convertedEntryFee = convertTournamentPrice(tournament.entryFee, safeCurrency(tournament.currency), safeCurrency(currency));

  // Check if user has sufficient balance
  const hasInsufficientBalance = walletBalance < convertedEntryFee;const handleJoin = async () => {
    if (!userProfile) {
      console.error("Join failed - No user profile");
      toast({
        title: "Error",
        description: "User profile not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if Game ID is provided
    if (!userProfile.gameId || userProfile.gameId.trim() === '') {
      setShowGameIdDialog(true);
      return;
    }// Check wallet balance
    if (hasInsufficientBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(convertedEntryFee - walletBalance, safeCurrency(currency))} more to join this tournament.`,
        variant: "destructive",
      });
      return;
    }    // Validate teammates for non-solo tournaments
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

      const success = await joinTournament(tournament.id);
      if (success) {
        toast({
          title: "Tournament Joined!",
          description: `You have successfully joined ${tournament.title}. Entry fee of ${formatTournamentPrice(tournament.entryFee, safeCurrency(tournament.currency), safeCurrency(userProfile?.currency || "INR"))} has been deducted from your wallet.`,
        });
        onClose();
        
        // Navigate to My Matches to see the joined tournament
        setTimeout(() => {
          navigate("/matches");
        }, 2000);
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
  };  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-dark-card border-gray-800 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold">Join Tournament</DialogTitle>
          <DialogDescription className="text-gray-400">
            {tournament.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-1">{/* Tournament Info */}
          <div className="bg-dark-lighter rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-400">Prize Pool</span>
              </div>              <span className="font-semibold text-green-400">
                {formatTournamentPrice(tournament.prizePool, safeCurrency(tournament.currency), safeCurrency(userProfile?.currency || "INR"))}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-400">Entry Fee</span>
              </div>              <span className="font-semibold">
                {formatTournamentPrice(tournament.entryFee, safeCurrency(tournament.currency), safeCurrency(userProfile?.currency || "INR"))}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-400">Mode</span>
              </div>
              <span className="font-semibold capitalize">{tournament.type}</span>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-dark-lighter rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Your Wallet Balance</span>
              <span className={`font-semibold ${hasInsufficientBalance ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(walletBalance, safeCurrency(currency))}
              </span>
            </div>          </div>

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <div className="flex items-start gap-2 bg-red-900 bg-opacity-20 text-red-400 p-3 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Insufficient Balance</p>                <p className="text-sm">
                  Add {formatCurrency(convertedEntryFee - walletBalance, safeCurrency(currency))} more to your wallet to join this tournament.
                </p>
              </div>
            </div>
          )}          {/* Team Members (for duo/squad) */}
          {/* (Removed: No team member UI for single participant registration) */}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700"
              disabled={isJoining}
            >
              Cancel
            </Button>            <Button
              onClick={() => {
                // Check if the button is truly disabled
                handleJoin();
              }}
              disabled={hasInsufficientBalance || isJoining || loading}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"            >
              {isJoining ? "Joining..." : `Join (${formatTournamentPrice(tournament.entryFee, safeCurrency(tournament.currency), safeCurrency(currency))})`}
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
