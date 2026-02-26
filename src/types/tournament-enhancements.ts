import { RewardDistribution, MatchResult } from './index';

export type TournamentFormat = 'battle_royale' | 'knockout' | 'round_robin' | 'swiss' | 'ladder';

export interface TournamentBracket {
  id: string;
  tournamentId: string;
  format: TournamentFormat;
  rounds: BracketRound[];
  currentRound: number;
  maxRounds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BracketRound {
  roundNumber: number;
  matches: BracketMatch[];
  status: 'pending' | 'ongoing' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

export interface BracketMatch {
  id: string;
  roundNumber: number;
  matchNumber: number;
  participants: BracketParticipant[];
  winner?: string; // userId of winner
  status: 'pending' | 'ongoing' | 'completed';
  startTime?: Date;
  endTime?: Date;
  results?: MatchResult[];
}

export interface BracketParticipant {
  userId: string;
  username: string;
  seed?: number; // seeding position
  advancement?: 'winner' | 'loser' | 'bye';
  eliminated?: boolean;
  eliminatedInRound?: number;
}

export interface TournamentSeries {
  id: string;
  name: string;
  description: string;
  tournaments: string[]; // tournament IDs
  overallLeaderboard: SeriesLeaderboardEntry[];
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface SeriesLeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  tournamentsParticipated: number;
  wins: number;
  averagePosition: number;
  rank: number;
}

export interface RecurringTournament {
  id: string;
  templateId: string;
  name: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    timeSlots: string[]; // Time slots in UTC
    daysOfWeek?: number[]; // For weekly tournaments (0 = Sunday)
    dayOfMonth?: number; // For monthly tournaments
  };
  nextScheduledDate: Date;
  lastScheduledDate?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  gameMode: string;
  type: 'solo' | 'duo' | 'squad';
  format: TournamentFormat;
  map: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  killReward?: number;
  rules: string[];
  rewardsDistribution: RewardDistribution[];
  settings: {
    autoStart: boolean;
    autoEnd: boolean;
    resultSubmissionDeadline: number; // minutes
    minimumParticipants: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// All registration and result logic is now per-user. No team/squad fields.
