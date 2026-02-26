import { Tournament, RewardDistribution } from "@/types";

// FirestoreTournament represents the exact schema in Firestore
export interface FirestoreTournament {
  bannerImage: string;
  companyCommissionPercentage: number;
  createdAt: Date | string;
  description: string;
  entryFee: number;
  firstPrizePercentage: number;
  gameMode?: string;
  gameType?: string;
  killReward: number;
  killRewardMethod?: string;
  map?: string;
  matchType?: string;
  maxTeams?: number;
  perKillRewardPercentage?: number;
  prizePool: number;
  registeredTeams?: number;
  rewardsDistribution?: {
    percentage: number;
    position: number;
    amount?: number;
  }[];
  rules?: string;
  startTime: Date | string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'live' | 'cancelled';
  teamSize?: number;
  title: string;
  currency?: string;
  image?: string;
  roomId?: string;
  roomPassword?: string;
  country?: string;
  firstPrize?: number;
  perKillReward?: number;
}

// Helper functions to convert between our app's Tournament type and Firestore format
export function toFirestoreTournament(tournament: Partial<Tournament>): Partial<FirestoreTournament> {
  return {
    bannerImage: tournament.bannerImage || '',
    companyCommissionPercentage: tournament.companyCommissionPercentage || 10,
    createdAt: tournament.createdAt || new Date(),
    description: tournament.description || '',
    entryFee: tournament.entryFee || 0,
    firstPrizePercentage: tournament.firstPrizePercentage || 50,
    gameMode: tournament.matchType || '',
    gameType: tournament.gameType || '',
    killReward: tournament.killReward || tournament.perKillReward || 0,
    killRewardMethod: tournament.killRewardMethod || '',
    map: tournament.map || '',
    matchType: tournament.matchType || '',
    maxTeams: tournament.maxTeams || 100,
    perKillRewardPercentage: tournament.perKillRewardPercentage || 0,
    prizePool: tournament.prizePool || 0,
    registeredTeams: tournament.registeredTeams || 0,
    rewardsDistribution: tournament.rewardsDistribution || [],
    rules: Array.isArray(tournament.rules) ? tournament.rules.join('\n') : (tournament.rules || ''),
    startTime: tournament.startTime || new Date(),
    status: (tournament.status as any) || 'upcoming',
    teamSize: tournament.teamSize || 1,
    title: tournament.title || tournament.name || '',
    currency: tournament.currency || 'INR',
    image: tournament.bannerImage || '',
    roomId: tournament.roomId || '',
    roomPassword: tournament.roomPassword || '',
    country: tournament.country || '',
    firstPrize: tournament.firstPrize,
    perKillReward: tournament.perKillReward,
  };
}

// Convert from Firestore format to our app's Tournament type
export function fromFirestoreTournament(firestoreTournament: FirestoreTournament, id: string): Tournament {
  const rewardsDistribution = firestoreTournament.rewardsDistribution?.map(reward => {
    if (reward.amount === undefined) {
      return {
        ...reward,
        amount: (firestoreTournament.prizePool * (reward.percentage / 100))
      };
    }
    return reward;
  }) || [];

  return {
    id,
    title: firestoreTournament.title,
    name: firestoreTournament.title, // For backward compatibility
    description: firestoreTournament.description,
    gameType: firestoreTournament.gameType || '',
    matchType: firestoreTournament.matchType || '',
    map: firestoreTournament.map || '',
    startTime: firestoreTournament.startTime,
    entryFee: firestoreTournament.entryFee,
    prizePool: firestoreTournament.prizePool,
    maxTeams: firestoreTournament.maxTeams || 100,
    registeredTeams: firestoreTournament.registeredTeams || 0,
    status: firestoreTournament.status,
    rules: typeof firestoreTournament.rules === 'string' ? firestoreTournament.rules : '',
    bannerImage: firestoreTournament.bannerImage || '',
    roomId: firestoreTournament.roomId || '',
    roomPassword: firestoreTournament.roomPassword || '',
    rewardsDistribution: rewardsDistribution,
    createdAt: firestoreTournament.createdAt,
    updatedAt: new Date(),
    killReward: firestoreTournament.killReward,
    teamSize: firestoreTournament.teamSize || 1,
    killRewardMethod: firestoreTournament.killRewardMethod || '',
    perKillRewardPercentage: firestoreTournament.perKillRewardPercentage || 0,
    companyCommissionPercentage: firestoreTournament.companyCommissionPercentage || 0,
    firstPrizePercentage: firestoreTournament.firstPrizePercentage || 0,
    country: firestoreTournament.country || '',
    currency: (firestoreTournament.currency || 'INR') as any,
    firstPrize: firestoreTournament.firstPrize ?? Math.round(firestoreTournament.prizePool * (firestoreTournament.firstPrizePercentage / 100)),
    perKillReward: firestoreTournament.perKillReward ?? firestoreTournament.killReward,
  };
}
