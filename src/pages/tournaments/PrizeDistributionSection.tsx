import React, { useState } from "react";
import { Tournament } from "@/types";
import { Button } from "@/components/ui/button";

interface PlayerInput {
  name: string;
  position: number | '';
  kills: number | '';
  reward?: number;
}

interface Props {
  tournament: Tournament;
}

const PrizeDistributionSection: React.FC<Props> = ({ tournament }) => {
  // For demo, generate dummy players. Replace with real data as needed.
  const [players, setPlayers] = useState<PlayerInput[]>(
    Array.from({ length: tournament.totalPlayers || 10 }, (_, i) => ({
      name: `Player ${i + 1}`,
      position: '',
      kills: '',
      reward: 0,
    }))
  );
  const [calculated, setCalculated] = useState(false);

  const handleInput = (idx: number, field: 'position' | 'kills', value: string) => {
    setPlayers(players => players.map((p, i) =>
      i === idx ? { ...p, [field]: value === '' ? '' : Math.max(0, Number(value)) } : p
    ));
    setCalculated(false);
  };

  const calculateRewards = () => {
    // Find all 1st place players
    const firstPlacePlayers = players.filter(p => p.position === 1);
    const perFirstPrize = firstPlacePlayers.length > 0 ? (tournament.firstPrize || 0) / firstPlacePlayers.length : 0;
    // Calculate per kill reward
    const perKillReward = tournament.perKillReward || 0;
    setPlayers(players => players.map(p => ({
      ...p,
      reward:
        (p.position === 1 ? perFirstPrize : 0) +
        (typeof p.kills === 'number' && p.kills > 0 ? p.kills * perKillReward : 0),
    })));
    setCalculated(true);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-primary/10">
              <th className="p-2">Player</th>
              <th className="p-2">Position</th>
              <th className="p-2">Kills</th>
              <th className="p-2">Reward</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <tr key={idx} className="border-b border-gray-700">
                <td className="p-2">{player.name}</td>
                <td className="p-2">
                  <input
                    type="number"
                    min={1}
                    className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                    value={player.position}
                    onChange={e => handleInput(idx, 'position', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min={0}
                    className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                    value={player.kills}
                    onChange={e => handleInput(idx, 'kills', e.target.value)}
                  />
                </td>
                <td className="p-2 font-semibold">
                  {calculated ? `₹${player.reward?.toFixed(2)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={calculateRewards} variant="default">
          Calculate Rewards
        </Button>
      </div>
    </div>
  );
};

export default PrizeDistributionSection;
