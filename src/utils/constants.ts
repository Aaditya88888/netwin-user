// Storage keys for local storage
export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'theme',
  AUTH_TOKEN: 'auth_token',
  COUNTRY: 'country',
  CURRENCY: 'currency'
};

// Currency conversion rates (Updated June 8, 2025 - Realistic rates)
export const CURRENCY_CONVERSION = {
  USD_TO_INR: 82.75,   // 1 USD = 82.75 INR
  USD_TO_NGN: 1480.50, // 1 USD = 1480.50 NGN  
  INR_TO_USD: 0.0121,  // 1 INR = 0.0121 USD
  INR_TO_NGN: 17.89,   // 1 INR = 17.89 NGN
  NGN_TO_USD: 0.000676, // 1 NGN = 0.000676 USD
  NGN_TO_INR: 0.0559,  // 1 NGN = 0.0559 INR
};

// Game modes
export const GAME_MODES_OBJECT = {
  PUBG: 'PUBG',
  BGMI: 'BGMI'
};

// Game modes as array for mapping
export const GAME_MODES = [
  { value: "solo", label: "Solo" },
  { value: "duo", label: "Duo" },
  { value: "squad", label: "Squad" }
];

// Tournament modes
export const TOURNAMENT_MODES = [
  { value: 'Solo', label: 'Solo' },
  { value: 'Duo', label: 'Duo' },
  { value: 'Squad', label: 'Squad' }
];

// Tournament maps
export const TOURNAMENT_MAPS = [
  { value: "Erangel", label: "Erangel" },
  { value: "Miramar", label: "Miramar" },
  { value: "Sanhok", label: "Sanhok" },
  { value: "Vikendi", label: "Vikendi" }
];

// Game maps (alias for TOURNAMENT_MAPS for backward compatibility)
export const GAME_MAPS = TOURNAMENT_MAPS;

// Tournament status
export const TOURNAMENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed'
};

// Match status
export const MATCH_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed'
};

// Transaction types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PRIZE: 'prize',
  ENTRY_FEE: 'entry_fee',
  REFUND: 'refund'
};

// Transaction status
export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed'
};

// KYC status
export const KYC_STATUS = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED', // @deprecated - use APPROVED instead, kept for legacy compatibility
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED', // Use this for approved KYC status
};

// KYC document types for different countries
export const KYC_DOCUMENT_TYPES = {
  'India': ['id-proof', 'address-proof', 'pan-card'] as const,
  'Nigeria': ['id-proof', 'address-proof'] as const,
  'USA': ['id-proof', 'address-proof'] as const,
  'default': ['id-proof', 'address-proof'] as const
};

// Minimum withdrawal amounts by currency
export const MIN_WITHDRAWAL = {
  INR: 100,
  USD: 10,
  NGN: 500,
  EUR: 10
};

// Regex patterns for validation
export const REGEX_PATTERNS = {
  PHONE: /^[+]?[1-9]\d{1,14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PUBG_ID: /^[0-9]{10}$/,
  BGMI_ID: /^[0-9]{10}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// Notification types
export const NOTIFICATION_TYPES = {
  TOURNAMENT: 'tournament',
  MATCH: 'match',
  WALLET: 'wallet',
  KYC: 'kyc',
  WELCOME: 'welcome'
};

// Countries and currencies
export const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', countryCode: '+91', country: 'India', flag: '🇮🇳', symbol: '₹' },
  { code: 'US', name: 'United States', currency: 'USD', countryCode: '+1', country: 'USA', flag: '🇺🇸', symbol: '$' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', countryCode: '+234', country: 'Nigeria', flag: '🇳🇬', symbol: '₦' },
];

// Country codes extracted for easier access
export const COUNTRY_CODES = COUNTRIES.map(country => ({
  code: country.countryCode,
  country: country.country,
  flag: country.flag
}));

// Currencies
export const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
] as const;