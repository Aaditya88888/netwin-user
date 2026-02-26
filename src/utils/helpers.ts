import { 
  STORAGE_KEYS,
  COUNTRIES,
  TRANSACTION_TYPES,
  KYC_STATUS
} from "./constants";
import { convertCurrency as convertCurrencyNew } from "./currencyConverter";
import { Currency } from "@/lib/utils";
import { 
  Tournament, 
  Match, 
  WalletTransaction, 
  KycDocument, 
  LeaderboardEntry,
  User
} from "@/types";

// Get user from local storage
export function getLocalUser(): User | null {
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }
  return null;
}

// Save user to local storage
export function saveLocalUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

// Remove user from local storage
export function removeLocalUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  const country = COUNTRIES.find(c => c.currency === currencyCode);
  return country ? country.symbol : '$'; // Default to $ if not found
}

// Convert between currencies using the new currency converter
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  return convertCurrencyNew(amount, fromCurrency, toCurrency);
}

// Format tournament prize breakdown
export function formatPrizeBreakdown(tournament: Tournament): string {
  const currency = tournament.currency || 'INR';
  return `1st: ${getCurrencySymbol(currency)}${tournament.firstPrize || 0}, Per Kill: ${getCurrencySymbol(currency)}${tournament.perKillReward || 0}`;
}

// Get position suffix (1st, 2nd, 3rd, etc.)
export function getPositionSuffix(position: number): string {
  if (position === 1) return "st";
  if (position === 2) return "nd";
  if (position === 3) return "rd";
  return "th";
}

// Sort tournaments by date (newest first)
export function sortTournamentsByDate(tournaments: Tournament[]): Tournament[] {
  return [...tournaments].sort((a, b) => {
    const aTime = typeof a.startTime === 'string' ? new Date(a.startTime).getTime() : a.startTime.getTime();
    const bTime = typeof b.startTime === 'string' ? new Date(b.startTime).getTime() : b.startTime.getTime();
    return bTime - aTime;
  });
}

// Sort matches by date (newest first)
export function sortMatchesByDate(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const aTime = typeof a.startTime === 'string' ? new Date(a.startTime).getTime() : a.startTime.getTime();
    const bTime = typeof b.startTime === 'string' ? new Date(b.startTime).getTime() : b.startTime.getTime();
    return bTime - aTime;
  });
}

// Filter upcoming tournaments
export function getUpcomingTournaments(tournaments: Tournament[]): Tournament[] {
  const now = new Date();
  return tournaments.filter(t => t.startTime > now && t.status === 'upcoming');
}

// Filter ongoing tournaments
export function getOngoingTournaments(tournaments: Tournament[]): Tournament[] {
  return tournaments.filter(t => t.status === 'ongoing');
}

// Filter completed tournaments
export function getCompletedTournaments(tournaments: Tournament[]): Tournament[] {
  return tournaments.filter(t => t.status === 'completed');
}

// Get user matches
export function getUserMatches(matches: Match[], userId: string): Match[] {
  return matches.filter(m => m.participants?.includes(userId));
}

// Sort transactions by date (newest first)
export function sortTransactionsByDate(transactions: WalletTransaction[]): WalletTransaction[] {
  return [...transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Get transaction type display text
export function getTransactionTypeText(type: string): string {
  switch (type) {
    case TRANSACTION_TYPES.DEPOSIT:
      return 'Deposit';
    case TRANSACTION_TYPES.WITHDRAWAL:
      return 'Withdrawal';
    case TRANSACTION_TYPES.PRIZE:
      return 'Tournament Prize';
    case TRANSACTION_TYPES.ENTRY_FEE:
      return 'Tournament Entry Fee';
    case TRANSACTION_TYPES.REFUND:
      return 'Refund';
    default:
      return type;
  }
}

// Calculate earnings from transactions
export function calculateEarnings(transactions: WalletTransaction[]): number {
  return transactions.reduce((total, tx) => {
    if (tx.type === TRANSACTION_TYPES.PRIZE) {
      return total + tx.amount;
    }
    return total;
  }, 0);
}

// Calculate expenses from transactions
export function calculateExpenses(transactions: WalletTransaction[]): number {
  return transactions.reduce((total, tx) => {
    if (tx.type === TRANSACTION_TYPES.ENTRY_FEE) {
      return total + Math.abs(tx.amount);
    }
    return total;
  }, 0);
}

// Get KYC status display text
export function getKYCStatusText(status: string): string {
  switch (status) {
    case KYC_STATUS.NOT_SUBMITTED:
      return 'Not Submitted';
    case KYC_STATUS.PENDING:
      return 'Pending Verification';
    case KYC_STATUS.VERIFIED:
      return 'Verified';
    case KYC_STATUS.REJECTED:
      return 'Rejected';
    default:
      return status;
  }
}

// Sort leaderboard entries by points (highest first)
export function sortLeaderboardByPoints(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.totalPoints - a.totalPoints);
}

// Format tournament currency for display
export function formatTournamentCurrency(tournament: Tournament): string {
  const currency = tournament.currency || 'INR';
  return `${getCurrencySymbol(currency)}${tournament.entryFee}`;
}

// Get country code from country name
export function getCountryCodeFromName(countryName: string): string {
  const country = COUNTRIES.find(c => c.country.toLowerCase() === countryName.toLowerCase());
  return country ? country.code : 'IN'; // Default to India if not found
}

// Get country name from country code
export function getCountryNameFromCode(countryCode: string): string {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country ? country.country : 'India'; // Default to India if not found
}

// Get currency from country name
export function getCurrencyFromCountry(countryName: string): string {
  const country = COUNTRIES.find(c => c.country.toLowerCase() === countryName.toLowerCase());
  return country ? country.currency : 'INR'; // Default to INR if not found
}

// Calculate total prize from tournament position
export function calculatePrize(tournament: Tournament, position: number): number {
  if (position === 1) return tournament.firstPrize || 0;
  // Only 1st prize supported, others return 0
  return 0;
}

// Get the required KYC documents based on user's country
export function getRequiredKycDocuments(country: string): Array<{ type: string, name: string, required: boolean }> {
  switch(country) {
    case 'India':
      return [
        { type: 'aadhaar', name: 'Aadhaar Card', required: true },
        { type: 'pan', name: 'PAN Card', required: true },
        { type: 'selfie', name: 'Selfie with ID', required: true }
      ];
    case 'Nigeria':
      return [
        { type: 'nin', name: 'National Identification Number (NIN)', required: true },
        { type: 'bvn', name: 'Bank Verification Number (BVN)', required: true },
        { type: 'selfie', name: 'Selfie with ID', required: true }
      ];
    default:
      return [
        { type: 'passport', name: 'Passport', required: true },
        { type: 'nationalid', name: 'National ID', required: false },
        { type: 'driverslicense', name: 'Driver\'s License', required: false },
        { type: 'selfie', name: 'Selfie with ID', required: true }
      ];
  }
}