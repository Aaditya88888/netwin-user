import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Search,
  Filter,
} from "lucide-react";
import { TOURNAMENT_MAPS, GAME_MODES } from "@/utils/constants";

export default function Tournaments() {
  const { user, userProfile } = useAuth();
  const { tournaments, loading } = useTournaments();
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>("");
  
  if (!user) return null;

  // Filter tournaments based on status, search query, and filters
  const getFilteredTournaments = () => {
    // Filter by tab (status) - map tab names to status values
    let filtered = tournaments.filter(t => {
      if (activeTab === "upcoming") {
        return t.status === "upcoming";
      } else if (activeTab === "ongoing") {
        return t.status === "live";
      } else if (activeTab === "completed") {
        return t.status === "completed";
      }
      return false;    });

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.title?.toLowerCase() || '').includes(query) ||
        (t.description?.toLowerCase() || '').includes(query)
      );
    }

    // Filter by game mode (use t.matchType)
    if (selectedMode && selectedMode !== "all") {
      filtered = filtered.filter(t => t.matchType === selectedMode);
    }

    // Filter by map (if map exists)
    if (selectedMap && selectedMap !== "all") {
      filtered = filtered.filter(t => (t as { map?: string }).map === selectedMap);
    }

    return filtered;
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedMode("");
  setSelectedMap("");
  };  // Get filtered tournaments
  const filteredTournaments = getFilteredTournaments();

  // Filter tournaments by user's country with fallback for country name variations
  const userCountry = userProfile?.country;
  
  // Helper function to normalize country names for comparison
  const normalizeCountry = (country: string): string => {
    const countryMap: { [key: string]: string } = {
      'USA': 'United States',
      'US': 'United States',
      'United States': 'United States',
      'India': 'India',
      'Nigeria': 'Nigeria'
    };
    return countryMap[country] || country;
  };
  
  const tournamentsByCountry = userCountry
    ? filteredTournaments.filter(t => {
        const normalizedTournamentCountry = normalizeCountry(t.country || '');
        const normalizedUserCountry = normalizeCountry(userCountry);
        return normalizedTournamentCountry === normalizedUserCountry;
      })
    : filteredTournaments;
  
  return (
    <div className="container py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto px-3 sm:px-4">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-poppins">
            Tournaments
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Join competitive tournaments and win prizes
          </p>
        </div>
      </div>
        <Card className="bg-dark-card border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tournaments..."
              className="pl-10 bg-dark-lighter border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedMode}
              onValueChange={setSelectedMode}
            >
              <SelectTrigger className="bg-dark-lighter border-gray-700">
                <SelectValue placeholder="Game mode" />
              </SelectTrigger>
              <SelectContent className="bg-dark-card border-gray-700">
                <SelectItem value="all">All modes</SelectItem>
                {GAME_MODES.map(mode => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedMap}
              onValueChange={setSelectedMap}
            >
              <SelectTrigger className="bg-dark-lighter border-gray-700">
                <SelectValue placeholder="Map" />
              </SelectTrigger>
              <SelectContent className="bg-dark-card border-gray-700">
                <SelectItem value="all">All maps</SelectItem>
                {TOURNAMENT_MAPS.map(map => (
                  <SelectItem key={map.value} value={map.value}>
                    {map.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              className="border border-gray-700"
              onClick={resetFilters}
            >
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </Card>
      
      <Tabs
        defaultValue="upcoming"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >        <TabsList className="mb-4 sm:mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing" className="text-xs sm:text-sm">Live</TabsTrigger>  
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
        </TabsList>
          <TabsContent value="upcoming" className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400">Loading tournaments...</p>
              </div>          ) : tournamentsByCountry.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {tournamentsByCountry.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Tournaments Found</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  {searchQuery || selectedMode || selectedMap
                    ? "No tournaments match your search criteria. Try adjusting your filters."
                    : "There are no upcoming tournaments available right now. Check back later for new tournaments."}
                </p>
                {(searchQuery || selectedMode || selectedMap) && (
                  <Button onClick={resetFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="ongoing" className="mt-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">Loading tournaments...</p>
            </div>
          ) : tournamentsByCountry.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tournamentsByCountry.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Live Tournaments</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                {searchQuery || selectedMode || selectedMap
                  ? "No live tournaments match your search criteria. Try adjusting your filters."
                  : "There are no tournaments currently live. Check the upcoming tournaments tab to join the next one."}
              </p>
              {(searchQuery || selectedMode || selectedMap) ? (
                <Button onClick={resetFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveTab("upcoming")}
                  className="bg-primary hover:bg-primary/90"
                >
                  View Upcoming Tournaments
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">Loading tournaments...</p>
            </div>
          ) : tournamentsByCountry.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tournamentsByCountry.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Completed Tournaments</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                {searchQuery || selectedMode || selectedMap
                  ? "No completed tournaments match your search criteria. Try adjusting your filters."
                  : "There are no completed tournaments yet. Join an upcoming tournament to see results here."}
              </p>
              {(searchQuery || selectedMode || selectedMap) ? (
                <Button onClick={resetFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveTab("upcoming")}
                  className="bg-primary hover:bg-primary/90"
                >
                  View Upcoming Tournaments
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}