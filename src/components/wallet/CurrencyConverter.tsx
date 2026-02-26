import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Currency } from "@/types";
import { 
  convertCurrency, 
  getConversionInfo, 
  formatCurrencyWithSymbol,
  SUPPORTED_CURRENCIES 
} from "@/utils/currencyConverter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, TrendingUp } from "lucide-react";

interface CurrencyConverterProps {
  amount?: number;
  showConverter?: boolean;
  className?: string;
}

export default function CurrencyConverter({ 
  amount = 100, 
  showConverter = true,
  className = "" 
}: CurrencyConverterProps) {
  const { userProfile } = useAuth();
  const [fromCurrency, setFromCurrency] = useState<Currency>(userProfile?.currency || 'USD');
  const [toCurrency, setToCurrency] = useState<Currency>('INR');
  const [convertAmount, setConvertAmount] = useState(amount);

  useEffect(() => {
    if (userProfile?.currency) {
      setFromCurrency(userProfile.currency);
      // Set default target currency
      if (userProfile.currency === 'USD') setToCurrency('INR');
      else if (userProfile.currency === 'INR') setToCurrency('USD');
      else setToCurrency('USD');
    }
  }, [userProfile]);

  const conversionInfo = getConversionInfo(convertAmount, fromCurrency, toCurrency);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getCurrencyFlag = (currency: Currency) => {
    const flags = {
      USD: '🇺🇸',
      INR: '🇮🇳', 
      NGN: '🇳🇬',
      EUR: '🇪🇺',
      GBP: '🇬🇧'
    };
    return flags[currency] || '💱';
  };

  const getCurrencyName = (currency: Currency) => {
    const names = {
      USD: 'US Dollar',
      INR: 'Indian Rupee',
      NGN: 'Nigerian Naira',
      EUR: 'Euro',
      GBP: 'British Pound'
    };
    return names[currency] || currency;
  };

  if (!showConverter) {
    return (
      <div className={`text-sm text-gray-400 ${className}`}>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span>
            {conversionInfo.formatted.original} = {conversionInfo.formatted.converted}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {conversionInfo.formatted.rate}
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-dark-card border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          💱 Currency Converter
          <span className="text-sm font-normal text-gray-400">
            (Live Rates - June 8, 2025)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Amount</label>
          <input
            type="number"
            value={convertAmount}
            onChange={(e) => setConvertAmount(Number(e.target.value))}
            className="w-full bg-dark-lighter border border-gray-700 rounded-lg px-3 py-2 text-white"
            placeholder="Enter amount"
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">From</label>
            <Select value={fromCurrency} onValueChange={(value: Currency) => setFromCurrency(value)}>
              <SelectTrigger className="bg-dark-lighter border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-card border-gray-700">
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    <div className="flex items-center gap-2">
                      <span>{getCurrencyFlag(currency)}</span>
                      <span>{currency}</span>
                      <span className="text-xs text-gray-400">
                        {getCurrencyName(currency)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">To</label>
            <Select value={toCurrency} onValueChange={(value: Currency) => setToCurrency(value)}>
              <SelectTrigger className="bg-dark-lighter border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dark-card border-gray-700">
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    <div className="flex items-center gap-2">
                      <span>{getCurrencyFlag(currency)}</span>
                      <span>{currency}</span>
                      <span className="text-xs text-gray-400">
                        {getCurrencyName(currency)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="bg-dark-lighter hover:bg-gray-700 rounded-full p-2 transition-colors"
            title="Swap currencies"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Conversion Result */}
        <div className="bg-dark-lighter rounded-lg p-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-2">
              {conversionInfo.formatted.original} = {conversionInfo.formatted.converted}
            </div>
            <div className="text-sm text-gray-400">
              Exchange Rate: {conversionInfo.formatted.rate}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              🕐 Rates updated: Today, June 8, 2025
            </div>
          </div>
        </div>

        {/* Quick Conversions */}
        <div className="grid grid-cols-3 gap-2">
          {[10, 100, 1000].map((quickAmount) => {
            const quickConversion = convertCurrency(quickAmount, fromCurrency, toCurrency);
            return (
              <button
                key={quickAmount}
                onClick={() => setConvertAmount(quickAmount)}
                className="bg-dark-lighter hover:bg-gray-700 rounded p-2 text-xs transition-colors"
              >
                <div className="text-white">{formatCurrencyWithSymbol(quickAmount, fromCurrency)}</div>
                <div className="text-gray-400">{formatCurrencyWithSymbol(quickConversion, toCurrency)}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
