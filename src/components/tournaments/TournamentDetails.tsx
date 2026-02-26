import React, { useState } from "react";
import { Tournament, UserProfile } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatMatchTime } from "@/lib/utils";
import { formatTournamentPrice, getCurrencyByCountry } from "@/utils/currencyConverter";
import { Calendar, MapPin, DollarSign, Users, Award, Crosshair, Info, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import JoinTournamentModal from "./JoinTournamentModal";

interface TournamentDetailsProps {
  tournament: Tournament;
}

const TournamentDetails = ({ tournament }: TournamentDetailsProps) => {
  const { userProfile } = useAuth() as { userProfile: UserProfile | null };
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const handleJoinClick = () => {
    setJoinModalOpen(true);
  };

  // Use startTime for date
  const dateStr = tournament.startTime || "";
  const date = new Date(dateStr);
  const isValidDate = !isNaN(date.getTime());

  // Fallbacks for missing fields
  const image = tournament.bannerImage || "/netwin-logo.png";
  const title = tournament.title || "Tournament";
  const mode = tournament.type || "Unknown";
  const gameMode = tournament.gameMode || "Unknown";
  const map = tournament.map || "Unknown";
  const entryFee = tournament.entryFee ?? 0;
  const prizePool = tournament.prizePool ?? 0;
  const registeredPlayers = tournament.registeredTeams ?? 0;
  const maxPlayers = tournament.maxPlayers ?? 100;
  const status = tournament.status as "upcoming" | "live" | "completed" | "cancelled";
  // Derive the correct currency for the tournament based on its country
  const currency = tournament.country 
    ? getCurrencyByCountry(tournament.country)
    : (tournament.currency || "INR");

  return (
    <div className="space-y-6">
      {/* Tournament Banner */}
      <div className="relative overflow-hidden rounded-xl h-60 sm:h-80">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            {status === "live" && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">LIVE</span>
            )}
            {status === "upcoming" && (
              <span className="bg-yellow-500 text-black text-xs font-medium px-2 py-0.5 rounded">UPCOMING</span>
            )}
            {status === "completed" && (
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded">COMPLETED</span>
            )}
            {status === "cancelled" && (
              <span className="bg-gray-500 text-white text-xs font-medium px-2 py-0.5 rounded">CANCELLED</span>
            )}
            <span className="bg-dark bg-opacity-70 text-white text-xs font-medium px-2 py-0.5 rounded">
              {mode}
            </span>
            <span className="bg-dark bg-opacity-70 text-white text-xs font-medium px-2 py-0.5 rounded">
              {gameMode}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-white">{title}</h1>
        </div>
      </div>

      {/* Tournament Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm text-gray-400">Date & Time</span>
          </div>
          <div className="font-medium">{isValidDate ? formatMatchTime(date) : "Invalid date"}</div>
        </div>

        <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm text-gray-400">Map</span>
          </div>
          <div className="font-medium">{map}</div>
        </div>

        <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-gray-400">Entry Fee</span>
          </div>
          <div className="font-medium">{formatTournamentPrice(entryFee, currency, userProfile?.currency || "INR")}</div>
        </div>

        <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-gray-400">Slots</span>
          </div>
          <div className="font-medium">{registeredPlayers}/{maxPlayers}</div>
        </div>
      </div>

      {/* Tournament Details Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid grid-cols-3 bg-dark-card">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="bg-dark-card rounded-xl p-4 border border-gray-800 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Tournament Details</h3>
              <p className="text-gray-300">{tournament.description || "Join this exciting tournament and showcase your gaming skills. Compete against the best players and win amazing prizes!"}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Format</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Match starts at: {isValidDate ? date.toLocaleTimeString() : "Invalid time"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Mode: {mode}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Map: {map}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Rewards</h4>
                <ul className="space-y-2">                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-400" />
                    <span>Prize Pool: {formatTournamentPrice(prizePool, currency, userProfile?.currency || "INR")}</span>
                  </li>
                  {tournament.killReward && tournament.killReward > 0 && (
                    <li className="flex items-center gap-2">
                      <Crosshair className="h-4 w-4 text-red-400" />
                      <span>Per Kill: {formatTournamentPrice(tournament.killReward, currency, userProfile?.currency || "INR")}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <div className="bg-dark-card rounded-xl p-4 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Tournament Rules</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-white hover:text-primary">General Rules</AccordionTrigger>
                <AccordionContent className="text-gray-300">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>All participants must join the match lobby 15 minutes before the match starts.</li>
                    <li>Players must use their registered game IDs only.</li>
                    <li>Any form of cheating or hacking will result in immediate disqualification.</li>
                    <li>The tournament organizer&apos;s decision will be final in case of disputes.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-white hover:text-primary">Scoring System</AccordionTrigger>
                <AccordionContent className="text-gray-300">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Position Points: 1st (15), 2nd (12), 3rd (10), 4th (8), 5th (6), 6th-10th (4), 11th-15th (2)</li>                    {tournament.killReward && tournament.killReward > 0 && (
                      <li>Each kill: {formatTournamentPrice(tournament.killReward, currency, userProfile?.currency || "INR")}</li>
                    )}
                    <li>The team with the highest total points will be declared the winner.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-white hover:text-primary">Match Settings</AccordionTrigger>
                <AccordionContent className="text-gray-300">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Map: {map}</li>
                    <li>Mode: {mode}</li>
                    <li>TPP/FPP: TPP</li>
                    <li>Red Zone: Enabled</li>
                    <li>Flare Guns: Enabled</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-white hover:text-primary">Result Submission</AccordionTrigger>
                <AccordionContent className="text-gray-300">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Team owners must submit a screenshot of their match results within 30 minutes after the match ends.</li>
                    <li>The screenshot must clearly show the team name, position, and kill count.</li>
                    <li>Failure to submit results on time may result in disqualification.</li>
                    <li>Prize distribution will be done within 24 hours after the tournament ends.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>

        <TabsContent value="prizes" className="mt-4">
          <div className="bg-dark-card rounded-xl p-4 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Prize Distribution</h3>
            <div className="space-y-4">
              {tournament.rewardsDistribution && tournament.rewardsDistribution.length > 0 ? (
                tournament.rewardsDistribution.map(
                  (reward: { position: number; percentage: number }, index: number) => (
                    <div key={index} className="flex items-center gap-4 bg-dark-lighter p-3 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        reward.position === 1 ? 'bg-yellow-500' :
                        reward.position === 2 ? 'bg-gray-500' :
                        reward.position === 3 ? 'bg-amber-700' : 'bg-gray-600'
                      }`}>
                        <span className="font-bold">{reward.position}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{reward.position === 1 ? '1st Place' : reward.position === 2 ? '2nd Place' : reward.position === 3 ? '3rd Place' : `${reward.position}th Place`}</h4>
                        <p className="text-gray-400 text-sm">
                          {reward.position === 1 ? 'Winner Winner Chicken Dinner' : 
                           reward.position === 2 ? 'Runner Up' : 
                           reward.position === 3 ? 'Second Runner Up' : 'Top Finisher'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          reward.position === 1 ? 'text-yellow-400' :
                          reward.position === 2 ? 'text-gray-300' :
                          reward.position === 3 ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                          {formatTournamentPrice(Math.round((prizePool * reward.percentage) / 100), currency, userProfile?.currency || "INR")}
                        </div>
                        <p className="text-xs text-gray-400">{reward.percentage}% of prize pool</p>
                      </div>
                    </div>
                  )
                )
              ) : (
                // Default prize distribution if not specified
                <>
                  <div className="flex items-center gap-4 bg-dark-lighter p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">1st Place</h4>
                      <p className="text-gray-400 text-sm">Winner Winner Chicken Dinner</p>
                    </div>
                    <div className="text-right">                      <div className="font-bold text-yellow-400">
                        {formatTournamentPrice(Math.round(prizePool * 0.5), currency, userProfile?.currency || "INR")}
                      </div>
                      <p className="text-xs text-gray-400">50% of prize pool</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-dark-lighter p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                      <span className="font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">2nd Place</h4>
                      <p className="text-gray-400 text-sm">Runner Up</p>
                    </div>
                    <div className="text-right">                      <div className="font-bold text-gray-300">
                        {formatTournamentPrice(Math.round(prizePool * 0.3), currency, userProfile?.currency || "INR")}
                      </div>
                      <p className="text-xs text-gray-400">30% of prize pool</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-dark-lighter p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center">
                      <span className="font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">3rd Place</h4>
                      <p className="text-gray-400 text-sm">Second Runner Up</p>
                    </div>
                    <div className="text-right">                      <div className="font-bold text-amber-600">
                        {formatTournamentPrice(Math.round(prizePool * 0.2), currency, userProfile?.currency || "INR")}
                      </div>
                      <p className="text-xs text-gray-400">20% of prize pool</p>
                    </div>
                  </div>
                </>
              )}
              
              {/* Per Kill Reward Display */}
              {tournament.killReward && tournament.killReward > 0 && (
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Crosshair className="h-5 w-5 text-red-400" />
                      <h4 className="font-medium">Per Kill Reward</h4>
                    </div>                    <div className="font-bold text-red-400">
                      {formatTournamentPrice(tournament.killReward, currency, userProfile?.currency || "INR")}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Each kill earns additional {formatTournamentPrice(tournament.killReward, currency, userProfile?.currency || "INR")} on top of position rewards.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Ready to join?</h3>
        </div>        <p className="text-gray-300 mb-4">
          Secure your spot in this exciting tournament and compete for a prize pool of {formatTournamentPrice(prizePool, currency, userProfile?.currency || "INR")}!
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="bg-gradient-to-r from-primary to-secondary text-white font-medium py-2 px-6 rounded-lg transition"
            onClick={handleJoinClick}
            disabled={status === "completed" || status === "cancelled"}
          >
            {status === "completed" ? "Tournament Ended" :
              status === "cancelled" ? "Tournament Cancelled" :
                status === "live" ? "Join Live Tournament" : "Join Tournament"}
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 text-white hover:bg-dark-lighter"
          >
            Share Tournament
          </Button>
        </div>
      </div>

      {/* Join Tournament Modal */}
      <JoinTournamentModal
        tournament={tournament}
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  );
};

export default TournamentDetails;
