import React from "react";
import { useState } from 'react';
import { TournamentFilters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Filter, X, ChevronDown, Search, DollarSign, Users, Trophy, Calendar, MapPin } from 'lucide-react';
import { TOURNAMENT_MAPS, GAME_MODES } from '@/utils/constants';

interface AdvancedTournamentFiltersProps {
  filters: TournamentFilters;
  onFiltersChange: (filters: TournamentFilters) => void;
  onClearFilters: () => void;
}

export default function AdvancedTournamentFilters({
  filters,
  onFiltersChange,
  onClearFilters
}: AdvancedTournamentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entryFeeRange, setEntryFeeRange] = useState([
    filters.entryFee?.min || 0,
    filters.entryFee?.max || 1000
  ]);

  const handleFilterChange = (key: keyof TournamentFilters, value: string | number | boolean | { min: number; max: number } | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleEntryFeeChange = (values: number[]) => {
    setEntryFeeRange(values);
    handleFilterChange('entryFee', {
      min: values[0],
      max: values[1]
    });
  };
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.gameMode && filters.gameMode !== 'all') count++;
    if (filters.mode && filters.mode !== 'all') count++;
    if (filters.map && filters.map !== 'all') count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.entryFee && ((filters.entryFee.min && filters.entryFee.min > 0) || (filters.entryFee.max && filters.entryFee.max < 1000))) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="bg-dark-card border-gray-800">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-dark-lighter/30 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearFilters();
                      setEntryFeeRange([0, 1000]);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Tournaments
              </Label>
              <Input
                placeholder="Search by name or description..."
                value={filters.gameMode || ''}
                onChange={(e) => handleFilterChange('gameMode', e.target.value)}
                className="bg-dark-lighter border-gray-700"
              />
            </div>

            {/* Game Mode and Match Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Game Mode
                </Label>
                <Select
                  value={filters.gameMode || 'all'}
                  onValueChange={(value) => handleFilterChange('gameMode', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="bg-dark-lighter border-gray-700">
                    <SelectValue placeholder="All Games" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>                    {GAME_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Match Type
                </Label>
                <Select
                  value={filters.mode || 'all'}
                  onValueChange={(value) => handleFilterChange('mode', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="bg-dark-lighter border-gray-700">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="duo">Duo</SelectItem>
                    <SelectItem value="squad">Squad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Map and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Map
                </Label>
                <Select
                  value={filters.map || 'all'}
                  onValueChange={(value) => handleFilterChange('map', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="bg-dark-lighter border-gray-700">
                    <SelectValue placeholder="All Maps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Maps</SelectItem>                    {TOURNAMENT_MAPS.map((map) => (
                      <SelectItem key={map.value} value={map.value}>
                        {map.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Status
                </Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="bg-dark-lighter border-gray-700">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Entry Fee Range */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Entry Fee Range
              </Label>
              <div className="px-3">
                <Slider
                  value={entryFeeRange}
                  onValueChange={handleEntryFeeChange}
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                  <span>₹{entryFeeRange[0]}</span>
                  <span>₹{entryFeeRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Quick Filter Presets */}
            <div className="space-y-2">
              <Label>Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleFilterChange('entryFee', { min: 0, max: 50 });
                    setEntryFeeRange([0, 50]);
                  }}
                  className="text-xs"
                >
                  Beginner (₹0-50)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleFilterChange('entryFee', { min: 50, max: 200 });
                    setEntryFeeRange([50, 200]);
                  }}
                  className="text-xs"
                >
                  Intermediate (₹50-200)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleFilterChange('entryFee', { min: 200, max: 1000 });
                    setEntryFeeRange([200, 1000]);
                  }}
                  className="text-xs"
                >
                  Expert (₹200+)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('mode', 'solo')}
                  className="text-xs"
                >
                  Solo Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('status', 'upcoming')}
                  className="text-xs"
                >
                  Upcoming Only
                </Button>
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Filters:</span>
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.gameMode && filters.gameMode !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Game: {filters.gameMode}
                    </Badge>
                  )}
                  {filters.mode && filters.mode !== 'all' && (
                    <Badge variant="outline" className="text-xs capitalize">
                      Type: {filters.mode}
                    </Badge>
                  )}
                  {filters.map && filters.map !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Map: {filters.map}
                    </Badge>
                  )}
                  {filters.status && filters.status !== 'all' && (
                    <Badge variant="outline" className="text-xs capitalize">
                      Status: {filters.status}
                    </Badge>
                  )}                  {filters.entryFee && ((filters.entryFee.min && filters.entryFee.min > 0) || (filters.entryFee.max && filters.entryFee.max < 1000)) && (
                    <Badge variant="outline" className="text-xs">
                      Fee: ₹{filters.entryFee.min || 0}-₹{filters.entryFee.max || 1000}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
