import React, { useState } from 'react';
import { TournamentBracket, BracketMatch, BracketParticipant } from '@/types/tournament-enhancements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock, ChevronLeft, ChevronRight, Crown, Medal, Award } from 'lucide-react';

interface TournamentBracketViewProps {
  bracket: TournamentBracket;
  onMatchClick?: (match: BracketMatch) => void;
}

export default function TournamentBracketView({ bracket, onMatchClick }: TournamentBracketViewProps) {
  const [currentRound, setCurrentRound] = useState(bracket.currentRound || 1);

  const getCurrentRound = () => {
    return bracket.rounds.find(r => r.roundNumber === currentRound);
  };

  const getParticipantColor = (participant: BracketParticipant, match: BracketMatch) => {
    if (match.winner === participant.userId) return 'text-green-400 bg-green-400/10 border-green-400/30';
    if (participant.eliminated) return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    if (match.status === 'ongoing') return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    return 'text-gray-300 bg-dark-lighter border-gray-700';
  };

  const getRoundIcon = (roundNumber: number) => {
    const totalRounds = bracket.maxRounds;
    if (roundNumber === totalRounds) return <Crown className="h-4 w-4" />;
    if (roundNumber === totalRounds - 1) return <Medal className="h-4 w-4" />;
    if (roundNumber >= totalRounds - 2) return <Award className="h-4 w-4" />;
    return <Trophy className="h-4 w-4" />;
  };

  const getRoundName = (roundNumber: number) => {
    const totalRounds = bracket.maxRounds;
    if (roundNumber === totalRounds) return 'Finals';
    if (roundNumber === totalRounds - 1) return 'Semi-Finals';
    if (roundNumber === totalRounds - 2) return 'Quarter-Finals';
    if (roundNumber === 1) return 'Round 1';
    return `Round ${roundNumber}`;
  };

  const currentRoundData = getCurrentRound();

  if (!currentRoundData) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Tournament bracket not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bracket Header */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getRoundIcon(currentRound)}
                <CardTitle className="text-xl">
                  {getRoundName(currentRound)}
                </CardTitle>
              </div>
              <Badge 
                variant={currentRoundData.status === 'completed' ? 'default' : 
                        currentRoundData.status === 'ongoing' ? 'secondary' : 'outline'}
                className="capitalize"
              >
                {currentRoundData.status}
              </Badge>
            </div>

            {/* Round Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
                disabled={currentRound === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-400 min-w-20 text-center">
                {currentRound} of {bracket.maxRounds}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentRound(Math.min(bracket.maxRounds, currentRound + 1))}
                disabled={currentRound === bracket.maxRounds}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bracket Matches */}
      <div className="grid gap-4">
        {currentRoundData.matches.map((match /*, index*/) => ( // Remove unused index
          <Card 
            key={match.id} 
            className={`
              bg-dark-card border-gray-800 transition-all duration-200
              ${onMatchClick ? 'cursor-pointer hover:border-primary/50' : ''}
              ${match.status === 'ongoing' ? 'ring-1 ring-blue-400/30' : ''}
            `}
            onClick={() => onMatchClick && onMatchClick(match)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400">
                    Match {match.matchNumber}
                  </span>
                  <Badge 
                    variant={match.status === 'completed' ? 'default' : 
                            match.status === 'ongoing' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {match.status}
                  </Badge>
                </div>
                
                {match.startTime && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {match.startTime.toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-2">
                {match.participants.map((participant, pIndex) => (
                  <div
                    key={participant.userId}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-all
                      ${getParticipantColor(participant, match)}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {participant.seed && (
                          <span className="text-xs font-medium text-gray-500">
                            #{participant.seed}
                          </span>
                        )}
                        <span className="font-medium">{participant.username}</span>
                      </div>
                      {match.winner === participant.userId && (
                        <Badge className="bg-green-400/20 text-green-400 border-green-400/30 text-xs">
                          Winner
                        </Badge>
                      )}
                      {participant.advancement === 'bye' && (
                        <Badge variant="outline" className="text-xs">
                          Bye
                        </Badge>
                      )}
                    </div>
                    {/* Results */}
                    {match.results && match.results.length > pIndex && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-yellow-400" />
                          <span>
                            {/* Defensive: check for position property */}
                            {typeof match.results[pIndex].position !== 'undefined'
                              ? `#${match.results[pIndex].position}`
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-red-400" />
                          <span>{match.results[pIndex].kills}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Format Info */}
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Format:</span>
              <Badge variant="outline" className="capitalize">
                {bracket.format}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Total Rounds:</span>
              <span className="font-medium">{bracket.maxRounds}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Current Round:</span>
              <span className="font-medium">{bracket.currentRound}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
