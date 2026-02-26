export type Currency = 'INR' | 'USD' | 'NGN' | 'EUR' | 'GBP';

export type GameMode = 'Solo' | 'Duo' | 'Squad';

export type UserRole = 'player' | 'admin' | 'moderator';

// KYC status type (uppercase)
export type KYCStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_SUBMITTED' | 'APPROVED';

export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'ongoing' | 'cancelled' | 'scheduled';

export type MatchType = 'solo' | 'duo' | 'squad' | 'SOLO' | 'DUO' | 'SQUAD';

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'live';

export type TournamentType = 'match' | 'wallet' | 'system' | 'promo';

export interface UserProfile {
  id?: string; // Added id field
  uid: string; // Not 'id'
  email: string;
  displayName?: string;
  username?: string; // Added username field
  usernameNormalized?: string; // Normalized (lowercase) username for case-insensitive searches
  phoneNumber?: string; // Added phone number field
  photoURL?: string;
  profilePicture?: string;
  gameId?: string;
  gameMode?: string;  
  country: string;
  countryCode?: string;  
  currency: Currency;
  walletBalance: number;
  kycStatus: KYCStatus;
  role: 'user' | 'admin' | 'player';
  createdAt: Date;
  updatedAt: Date;
  bio?: string; // Added for profile enhancement
  favoriteGame?: string; // Added for profile enhancement
  friends?: string[]; // Added for social features
  stats?: {
    wins?: number;
    losses?: number;
    totalMatches?: number;
    winRate?: number;
    rank?: string;
    level?: number;
    experience?: number;
    totalWinnings?: number; // Added for profile stats
    matchesPlayed?: number; // Added for profile stats
  };
  achievements?: string[];
}

export interface KYC {
  userId: string;
  documentType: string;
  documentNumber: string;
  documentUrl: string;
  status: KYCStatus;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: Currency;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'tournament_entry' | 'tournament_reward' | 'kill_reward';
  amount: number;
  currency: 'INR' | 'USD' | 'NGN';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  tournamentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tournament {
  id: string;
  name: string;
  title?: string;
  description?: string;
  gameType?: string;
  matchType?: string;
  map?: string;
  startTime: string | Date;
  endTime?: string | Date;
  entryFee: number;
  prizePool: number;
  maxTeams?: number;
  registeredTeams?: number;
  status: TournamentStatus;
  rules?: string;
  bannerImage?: string;
  roomId?: string;
  roomPassword?: string;
  rewardsDistribution?: RewardDistribution[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  killReward?: number;
  teamSize?: number;
  killRewardMethod?: string;
  perKillReward?: number;
  perKillRewardPercentage?: number;
  companyCommissionPercentage?: number;
  firstPrizePercentage?: number;
  calculatedPrizePool?: number;
  calculatedFirstPrize?: number;
  calculatedPerKillReward?: number;
  country?: string; // <-- Add country for filtering
  targetCountry?: string; // Target country for filtering tournaments
  currency?: 'INR' | 'USD' | 'NGN' | 'GBP' | 'EUR'; // Use union type for currency
  participants?: string[]; // Add participants field
  maxPlayers?: number; // Added for compatibility
  perKill?: number; // Added for compatibility
  type?: 'solo' | 'duo' | 'squad'; // Add missing Tournament fields for type safety
  registeredPlayers?: number;
  currentParticipants?: number;
  totalPlayers?: number; // Added for prize calculation compatibility
  firstPrize?: number; // Add firstPrize as an optional field
  // Add missing fields for Home.tsx compatibility
  image?: string;
  gameMode?: string;
  startDate?: string | Date;
  mode?: string;
}

// Add this new interface for match results
export interface MatchResult {
  id: string;
  userId: string;
  tournamentId: string;
  kills: number;
  position: number;
  prize?: number;
  screenshot?: string;
  createdAt: string;
  placement?: number;
  earnings?: number;
  verified?: boolean;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournamentTitle?: string;
  userId?: string; // Add userId property
  playerName?: string; // Add playerName property
  date: Date;
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'registered' | 'result_submitted'; // Add missing statuses
  mode: 'solo' | 'duo' | 'squad';
  map: string;
  teamMembers: TeamMember[];
  roomDetails?: {
    roomId: string;
    password: string;
    visibleAt?: Date;
  };
  roomId?: string;
  roomPassword?: string;
  participants?: string[];
  results?: MatchResult[];
  resultSubmitted?: boolean;
  resultApproved?: boolean;
  resultScreenshot?: string;
  resultImageUrl?: string | null; // Field for storing result image URL
  screenshot?: string; // Add screenshot property
  position?: number;
  kills?: number;
  placement?: number; // Placement in the match (for UI)
  earnings?: number;  // Earnings for the match (for UI)
  verified?: boolean; // Verification status (for UI)
  resultVerified?: boolean; // Admin verified results
  resultVerifiedAt?: Date; // When results were verified
  reward?: number; // Tournament reward amount
  rejectionReason?: string; // Add rejectionReason property
  joinedAt?: Date; // Add joinedAt property
  updatedAt?: Date;
  prize?: number;
  killReward?: number;
  currency?: string;
}

export interface TeamMember {
  id: string;
  username: string;
  inGameId: string;
  profilePicture?: string;
  isOwner?: boolean;
  kills?: number;
}

// Add SquadMember type for squad features
export interface SquadMember {
  id: number;
  username: string;
  gameId: string;
  profilePicture?: string;
  isOwner: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'wallet' | 'system' | 'promo';
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export interface User {
  id: string;
  uid: string; // Add uid to match UserProfile
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  profilePicture?: string;
  phoneNumber?: string;
  gameId?: string;
  gameMode?: string;
  country: string;
  countryCode?: string;
  currency: Currency;
  walletBalance: number;
  kycStatus: KYCStatus;
  role: 'user' | 'admin' | 'player';
  createdAt: Date;
  updatedAt: Date;
  bio?: string; // Added for profile enhancement
  favoriteGame?: string; // Added for profile enhancement
  friends?: string[]; // Added for social features
  stats?: {
    wins?: number;
    losses?: number;
    totalMatches?: number;
    winRate?: number;
    rank?: string;
    level?: number;
    experience?: number;
  };
  achievements?: string[];
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'tournament_fee' | 'tournament_reward' | 'prize' | 'prize_money' | 'entry_fee' | 'wallet_credit' | 'currency_conversion';
  amount: number;
  currency: Currency; // Accept all Currency types including EUR and GBP
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'completed' | 'failed';
  paymentMethod: string;
  description: string;
  details?: string; // Added details field
  createdAt: Date;
  updatedAt?: Date;
  tournamentId?: string;
  metadata?: {
    paymentMethod?: string;
    simulatedGateway?: string;
    gatewayReference?: string;
    gatewayResponse?: {
      code: string;
      message: string;
      status: string;
    };
    bankDetails?: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      ifscCode?: string;
    };
    tournamentId?: string;
    tournamentTitle?: string;
    transactionId?: string;
    // Currency conversion specific metadata
    originalCurrency?: Currency;
    originalAmount?: number;
    newCurrency?: Currency;
    newAmount?: number;
    conversionRate?: number;
    originalFormatted?: string;
    newFormatted?: string;
  };
  processed?: boolean; // Indicates if the transaction has been processed for wallet update
}

export interface KycDocument {
  id: string;
  userId: string;
  type: 'id-proof' | 'address-proof' | 'pan-card';
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl?: string;
  selfieUrl?: string;
  status: KYCStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalRequest {
  amount: number;
  accountNumber: string;
  accountType: string;
  accountName: string;
  ifscCode?: string;
  bankName?: string;
  bankDetails?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    ifscCode?: string;
  };
}

export interface LoginCredentials {
  email?: string;
  password?: string;
  phoneNumber?: string;
  countryCode?: string;
}

export interface SignupData {
  email?: string;
  password?: string;
  phoneNumber?: string;
  countryCode?: string;
  username?: string;
}

export interface TournamentFilters {
  gameMode?: string;
  mode?: string; // Add mode property
  entryFee?: {
    min?: number;
    max?: number;
  };
  minEntryFee?: number; // Add minEntryFee property
  maxEntryFee?: number; // Add maxEntryFee property
  map?: string;
  date?: {
    from?: Date;
    to?: Date;
  };
  status?: string;
  currency?: Currency;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL?: string;
  profilePicture?: string;
  country: string;
  currency: string;
  totalPoints: number;
  totalKills: number;
  kills: number;
  wins: number;
  matches: number;
  matchesPlayed: number;
  winRate: number;
  earnings: number;
  rank?: number;
}

export interface RewardDistribution {
  position: number;
  percentage: number;
  amount?: number;
}

// Prize distribution logic helper type
export interface PrizeDistributionRule {
  firstPlacePercent: number; // e.g. 40
  squadSplit: boolean; // true if squad prize is split
  adminOverride?: boolean;
  overrideDistribution?: RewardDistribution[];
}

// Add interface for user tournament registrations
export interface UserMatch {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentTitle: string;
  gameMode: string;
  type: 'solo' | 'duo' | 'squad';
  entryFee: number;
  prizePool: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'registered' | 'result_submitted'; // Add missing statuses
  startTime: Date;
  registeredAt: Date;
  kills?: number;
  position?: number;
  result?: string;
  resultSubmitted?: boolean;
  resultSubmittedAt?: Date;
  resultScreenshot?: string;
  resultImageUrl?: string | null; // Field for storing result image URL
  resultVerified?: boolean;
  resultVerifiedAt?: Date;
  reward?: number;
}

// Tournament Registration interface (replaces tournament_results collection)
export interface TournamentRegistration {
  id: string;
  registrationId: string;
  userId: string;
  tournamentId: string;
  teamName: string;
  displayName: string;
  gameId: string;
  teammates?: string[];
  teamMembers?: TeamMember[];
  registeredAt: Date;
  status: 'registered' | 'confirmed' | 'cancelled' | 'disqualified';
  // Result fields (previously in tournament_results collection)
  kills: number;
  position: number | null;
  points?: number;
  totalPrizeEarned: number;
  resultImageUrl: string | null; // Field for storing result image URL
  resultSubmitted?: boolean;
  resultSubmittedAt?: Date;
  resultVerified?: boolean;
  resultVerifiedAt?: Date;
  // Additional metadata
  updatedAt?: Date;
}

export type PaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'PayPal' | 'CryptoCurrency';

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  timestamp: Date;
  gatewayReference?: string;
  gatewayResponse?: {
    code: string;
    message: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PaymentGatewayConfig {
  gateway: string;
  apiKey: string;
  merchantId: string;
  isLive: boolean;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: Currency[];
}

export interface Registration {
  id: number;
  userId: number;
  tournamentId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  registeredAt: string;
  // Screenshot of end game result
  screenshot?: string;
  // Result image URL for tournament results
  resultImageUrl?: string | null;
  // Additional fields for tournament results
  kills?: number;
  position?: number;
  points?: number;
  resultSubmitted?: boolean;
  resultSubmittedAt?: Date;
  resultVerified?: boolean;
  resultVerifiedAt?: Date;
  reward?: number;
}

export const DEFAULT_TOURNAMENT_RULES = [
  "A number of rooms will be created to accommodate all players. Room joining will be first come first serve. Netwin is not responsible if the room is full and the user does not get a chance to play.",
  "Tournament qualifications and winning declarations are based on point calculations. See the details below on how the points are calculated.",
  "The room ID and password for the game will be provided 15 minutes before the start time of the contest through notifications, email, or SMS. However, we recommend users to check the Netwin app tournament section for the ID/Password. Netwin is not responsible for the delay or failure of delivery of the ID/Password.",
  "If you are unable to join the custom tournament created on the game app by the start time, the joining fee will not be refunded and you will be disqualified.",
  "If the in-game username is different from the one entered in Netwin, the user may be removed from the tournament and no refunds will be given.",
  "If you share a Room ID & Password with non-registered users, your account may be banned and your winnings frozen.",
  "If you miss your time slot and play in another time slot, you will be disqualified from the tournament.",
  "Finals and next rounds will be scheduled as per the tournament details. Qualified users will be notified via app notification, email, or SMS. Also, check the Tournament Details Page in the Netwin app.",
  "Teaming and/or griefing can get you disqualified from the tournament.",
  "Any teaming up or hacking found during the tournament will result in disqualification and the account being banned. No refunds or winnings will be given in this case. Admin’s decision will be final in such cases.",
  "Time change requests will not be entertained.",
  "In case of a tie, rank distribution will be based on the judgment of the management team and no queries will be entertained regarding this."
];