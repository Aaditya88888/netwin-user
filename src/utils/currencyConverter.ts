import { Currency } from "@/types";

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, Currency> = {
  'India': 'INR',
  'United States': 'USD',
  'Nigeria': 'NGN',
  'Germany': 'EUR',
  'France': 'EUR',
  'Spain': 'EUR',
  'Italy': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Austria': 'EUR',
  'United Kingdom': 'GBP',
  'Canada': 'USD',
  'Australia': 'USD',
  'Pakistan': 'INR', // Using INR as closest supported currency
  'Bangladesh': 'INR', // Using INR as closest supported currency
  'Sri Lanka': 'INR', // Using INR as closest supported currency
  'Brazil': 'USD', // Using USD as closest supported currency
  'Mexico': 'USD', // Using USD as closest supported currency
  'Japan': 'USD', // Using USD as closest supported currency
  'China': 'USD', // Using USD as closest supported currency
  'Singapore': 'USD', // Using USD as closest supported currency
  'Malaysia': 'USD', // Using USD as closest supported currency
  'Thailand': 'USD', // Using USD as closest supported currency
  'South Africa': 'USD', // Using USD as closest supported currency
  'Kenya': 'USD', // Using USD as closest supported currency
  'Ghana': 'USD', // Using USD as closest supported currency
  'Egypt': 'USD', // Using USD as closest supported currency
};

// Get suggested currency based on country
export function getCurrencyByCountry(country: string): Currency {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
}

// Check if country change should trigger currency change
export function shouldAutoConvertCurrency(country: string, currentCurrency: Currency): {
  shouldConvert: boolean;
  suggestedCurrency: Currency;
} {
  const suggestedCurrency = getCurrencyByCountry(country);
  return {
    shouldConvert: suggestedCurrency !== currentCurrency,
    suggestedCurrency
  };
}

// Initial exchange rates (will be updated from API)
let LIVE_EXCHANGE_RATES = {
  USD: 1.0,
  INR: 83.12,   // Updated with approximate rates
  NGN: 1505.50, // Updated with approximate rates
  EUR: 0.92,    // Updated with approximate rates
  GBP: 0.79     // Updated with approximate rates
};

// Calculate cross rates dynamically
export function getCrossRate(fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) return 1.0;
  
  const fromUsdRate = LIVE_EXCHANGE_RATES[fromCurrency];
  const toUsdRate = LIVE_EXCHANGE_RATES[toCurrency];
  
  // Convert: From Currency -> USD -> To Currency
  return toUsdRate / fromUsdRate;
}

// Convert amount between currencies
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = getCrossRate(fromCurrency, toCurrency);
  return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
}

// Get formatted conversion info
export function getConversionInfo(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): {
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  formatted: {
    original: string;
    converted: string;
    rate: string;
  };
} {
  const rate = getCrossRate(fromCurrency, toCurrency);
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  
  return {
    originalAmount: amount,
    convertedAmount,
    exchangeRate: rate,
    formatted: {
      original: formatCurrencyWithSymbol(amount, fromCurrency),
      converted: formatCurrencyWithSymbol(convertedAmount, toCurrency),
      rate: `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`
    }
  };
}

// Format currency with proper symbol
export function formatCurrencyWithSymbol(amount: number, currency: Currency): string {
  const symbols = {
    USD: "$",
    INR: "₹",
    NGN: "₦",
    EUR: "€",
    GBP: "£"
  };
  
  const symbol = symbols[currency] || "$";
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return `${symbol}${formattedAmount}`;
}

// Convert tournament prices to user's currency
export function convertTournamentPrice(
  amount: number,
  tournamentCurrency: Currency,
  userCurrency: Currency
): number {
  if (tournamentCurrency === userCurrency) return amount;
  
  const convertedAmount = convertCurrency(amount, tournamentCurrency, userCurrency);
  
  // Round to reasonable currency units
  if (userCurrency === 'INR') {
    // Round to nearest 10 for INR (e.g., 150, 160, 170)
    return Math.round(convertedAmount / 10) * 10;
  } else if (userCurrency === 'NGN') {
    // Round to nearest 100 for NGN (e.g., 1500, 1600, 1700)
    return Math.round(convertedAmount / 100) * 100;
  } else {
    // Round to nearest 5 for USD/EUR (e.g., 15, 20, 25)
    return Math.round(convertedAmount / 5) * 5;
  }
}

// Format tournament price with conversion info
export function formatTournamentPrice(
  amount: number,
  tournamentCurrency: Currency,
  userCurrency: Currency,
  showOriginal = false
): string {
  // Handle invalid inputs
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    console.warn('Invalid amount passed to formatTournamentPrice:', amount);
    return formatCurrencyWithSymbol(0, userCurrency);
  }
  
  if (!tournamentCurrency || !userCurrency) {
    console.warn('Invalid currency passed to formatTournamentPrice:', { tournamentCurrency, userCurrency });
    return formatCurrencyWithSymbol(amount, userCurrency || 'INR');
  }
  
  const convertedAmount = convertTournamentPrice(amount, tournamentCurrency, userCurrency);
  const formattedConverted = formatCurrencyWithSymbol(convertedAmount, userCurrency);
  
  if (showOriginal && tournamentCurrency !== userCurrency) {
    const originalFormatted = formatCurrencyWithSymbol(amount, tournamentCurrency);
    return `${formattedConverted} (${originalFormatted})`;
  }
  
  return formattedConverted;
}

// Update exchange rates from API
export async function updateExchangeRates(): Promise<boolean> {
  try {
    // Using exchangerate-api.com (replace with your API key)
    const response = await fetch('https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD');
    const data = await response.json();
    
    if (data.result === 'success') {
      LIVE_EXCHANGE_RATES = {
        USD: 1.0,
        INR: data.conversion_rates.INR,
        NGN: data.conversion_rates.NGN,
        EUR: data.conversion_rates.EUR,
        GBP: data.conversion_rates.GBP,
      };
      return true;
    }
    throw new Error('Failed to fetch exchange rates');
  } catch (error) {
    console.error("❌ Failed to update exchange rates:", error);
    return false;
  }
}

// Get supported currencies
export const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'INR', 'NGN', 'EUR', 'GBP'];

// Default currency by country
export const DEFAULT_CURRENCY_BY_COUNTRY = {
  'India': 'INR' as Currency,
  'Nigeria': 'NGN' as Currency,
  'USA': 'USD' as Currency,
  'United States': 'USD' as Currency,
  'default': 'USD' as Currency,
};
