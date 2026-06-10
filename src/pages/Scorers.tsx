import { useState, useEffect } from 'react';
import { Trophy, Target, Zap, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/apiFetch';

interface Scorer {
  rank: number;
  player: {
    id: string;
    name: string;
    nationality: string;
    age: number | null;
    position: string;
  };
  team: {
    id: string;
    name: string;
    tla: string;
    flag: string;
  };
  goals: number;
  assists: number;
  penalties: number;
  playedMatches: number;
  goalsPerMatch: number;
}

export default function Scorers() {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScorers = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiFetch('/api/football/scorers');
      if (json.status === 'ok') {
        setScorers(json.data.scorers);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load scorers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScorers(); }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-[#6B7A99]';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#6B7A99]/15 pb-5">
        <div>
          <h1 className="text-3xl font-display font-black text-[#E8EDF5] tracking-widest uppercase flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-accent shrink-0" />
            Golden Boot Race
          </h1>
          <p className="text-xs text-[#6B7A99] font-medium uppercase tracking-wide mt-1">
            Live top scorers · FIFA World Cup 2026 · Updates after every match
          </p>
        </div>
        <button
          onClick={fetchScorers}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111C2E] border border-[#6B7A99]/20 text-[#E8EDF5] text-xs font-bold rounded hover:bg-[#1F304A] transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats summary */}
      {!loading && scorers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl p-4 text-center">
            <span className="text-2xl font-display font-black text-accent">
              {scorers[0]?.goals}
            </span>
            <p className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest mt-1">
              Top Goals
            </p>
            <p className="text-xs text-[#E8EDF5] font-bold mt-0.5 truncate">
              {scorers[0]?.player.name}
            </p>
          </div>
          <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl p-4 text-center">
            <span className="text-2xl font-display font-black text-green-400">
              {Math.max(...scorers.map(s => s.assists))}
            </span>
            <p className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest mt-1">
              Top Assists
            </p>
            <p className="text-xs text-[#E8EDF5] font-bold mt-0.5 truncate">
              {scorers.find(s => s.assists === Math.max(...scorers.map(x => x.assists)))?.player.name}
            </p>
          </div>
          <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl p-4 text-center">
            <span className="text-2xl font-display font-black text-blue-400">
              {scorers.length}
            </span>
            <p className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest mt-1">
              Players Scored
            </p>
            <p className="text-xs text-[#E8EDF5] font-bold mt-0.5">
              Across all groups
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 p-4 rounded-xl text-xs">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-[#6B7A99] animate-pulse">
          Loading Golden Boot standings...
        </div>
      ) : scorers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#6B7A99]/20 rounded-xl space-y-3">
          <Trophy className="h-10 w-10 text-[#6B7A99] mx-auto" />
          <p className="text-sm text-[#6B7A99] font-bold">No goals scored yet</p>
          <p className="text-xs text-[#6B7A99]">
            The tournament kicks off June 11 — check back after the first matches.
          </p>
        </div>
      ) : (
        <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-xs text-left text-[#E8EDF5]">
            <thead>
              <tr className="bg-[#0A1628] border-b border-[#6B7A99]/15 uppercase tracking-widest text-[9px] text-[#6B7A99] font-bold font-mono">
                <th className="px-4 py-3 text-center w-12">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-center">
                  <Target className="h-3 w-3 inline mr-1" />Goals
                </th>
                <th className="px-4 py-3 text-center">
                  <Zap className="h-3 w-3 inline mr-1" />Assists
                </th>
                <th className="px-4 py-3 text-center">Pens</th>
                <th className="px-4 py-3 text-center">Played</th>
                <th className="px-4 py-3 text-center">G/Match</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s) => (
                <tr
                  key={s.player.id}
                  className={`border-b last:border-none border-[#6B7A99]/10 hover:bg-[#1F304A]/30 transition-all ${
                    s.rank <= 3 ? 'bg-accent/5' : ''
                  }`}
                >
                  <td className="px-4 py-3.5 text-center">
                    <span className={`font-mono font-black text-sm ${getRankStyle(s.rank)}`}>
                      {getRankIcon(s.rank)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-[#E8EDF5]">{s.player.name}</div>
                    <div className="text-[9px] text-[#6B7A99] uppercase font-mono mt-0.5">
                      {s.player.position} · {s.player.nationality}
                      {s.player.age ? ` · Age ${s.player.age}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.team.flag}</span>
                      <span className="font-semibold text-[#E8EDF5]">{s.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-mono font-black text-accent text-lg">{s.goals}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-mono font-bold text-green-400">{s.assists ?? 0}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-mono text-[#6B7A99]">{s.penalties ?? 0}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-mono text-[#6B7A99]">{s.playedMatches}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-mono text-blue-400 font-bold">{s.goalsPerMatch}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}