import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trophy, User, Calendar, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import { formatCurrency, formatMatchTime } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'tournament' | 'player' | 'match';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: string;
  icon: typeof Trophy | typeof User | typeof Calendar;
  link: string;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const GlobalSearch = ({ 
  placeholder = "Search tournaments, players, matches...", 
  className = "",
  compact = false 
}: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { tournaments } = useTournaments();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    // Search tournaments
    const tournamentResults = tournaments
      .filter(tournament => 
        tournament.title?.toLowerCase().includes(query) ||
        tournament.description?.toLowerCase().includes(query) ||
        tournament.gameMode?.toLowerCase().includes(query) ||
        tournament.type?.toLowerCase().includes(query) ||
        (typeof ((tournament as unknown) as { [key: string]: unknown })['map'] === 'string' &&
          (((tournament as unknown) as { [key: string]: unknown })['map'] as string).toLowerCase().includes(query))
      )
      .slice(0, 6)
      .map(tournament => ({
        id: tournament.id,
        type: 'tournament' as const,
        title: tournament.title ?? '',
        subtitle: `${tournament.gameMode ?? ''} • ${tournament.type ?? ''}`,
        description: tournament.description ?? '',
        metadata: `${formatCurrency(tournament.prizePool, tournament.currency)} • ${tournament.registeredTeams}/${tournament.maxPlayers} players`,
        icon: Trophy,
        link: `/tournaments/${tournament.id}`
      }));

    searchResults.push(...tournamentResults);    // Search players from leaderboard
    if (query.length >= 2) {
      // Player search will be implemented using leaderboard API
      const playerResults: SearchResult[] = [];

      searchResults.push(...playerResults);
    }

    // Search matches (upcoming matches for current user)
    if (userProfile) {
      const matchResults = tournaments
        .filter(tournament => 
          tournament.status === 'upcoming' &&
          (tournament.title?.toLowerCase().includes(query) ||
           tournament.gameMode?.toLowerCase().includes(query))
        )
        .slice(0, 3)
        .map(tournament => ({
          id: `match-${tournament.id}`,
          type: 'match' as const,
          title: `Match: ${tournament.title ?? ''}`,
          subtitle: formatMatchTime(new Date(tournament.startTime)),
          description: `${tournament.gameMode ?? ''} • ${tournament.type ?? ''}`,
          metadata: `Entry: ${formatCurrency(tournament.entryFee, tournament.currency)}`,
          icon: Calendar,
          link: `/tournaments/${tournament.id}`
        }));

      searchResults.push(...matchResults);
    }

    setResults(searchResults);
    setLoading(false);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, tournaments, userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return Trophy;
      case 'player':
        return User;
      case 'match':
        return Calendar;
      default:
        return Search;
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'text-yellow-400';
      case 'player':
        return 'text-blue-400';
      case 'match':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          className={`w-full bg-dark-lighter border-gray-700 pl-10 ${
            query ? 'pr-10' : 'pr-4'
          } ${compact ? 'h-8 text-sm' : 'h-10'}`}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-400 hover:text-white"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-dark-card border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-700 border-t-primary mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="p-2 border-b border-gray-700">
                <span className="text-xs text-gray-400 font-medium">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {results.map((result) => {
                  const IconComponent = getResultIcon(result.type);
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left p-3 hover:bg-dark-lighter transition-colors border-b border-gray-800 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${getResultTypeColor(result.type)}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-white truncate">
                              {result.title}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                              result.type === 'tournament' ? 'bg-yellow-900/30 text-yellow-400' :
                              result.type === 'player' ? 'bg-blue-900/30 text-blue-400' :
                              'bg-green-900/30 text-green-400'
                            }`}>
                              {result.type}
                            </span>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-gray-400 mt-1">
                              {result.subtitle}
                            </p>
                          )}
                          {result.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                          {result.metadata && (
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {result.metadata}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-gray-500 mt-1">
                Try searching for tournaments, players, or matches
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
