/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { apiFetch } from '../lib/apiFetch';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, SlidersHorizontal, ChevronRight, User } from 'lucide-react';
import Flag from '../components/Flag';

interface TeamWithRating {
  id: string;
  name: string;
  slug: string;
  group_letter: string;
  coach_name: string;
  coach_nationality: string;
  confederation: string;
  win_probability: number;
  fifa_ranking: number;
  flag: string;
  avg_rating: number; // dynamically loaded
  top_player: { name: string; rating: number } | null;
}

export default function Teams() {
  const [teams, setTeams] = useState<TeamWithRating[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConfederation, setSelectedConfederation] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedWinRange, setSelectedWinRange] = useState('ALL');
  const [sortBy, setSortBy] = useState('RANKING'); // ALPHABETICAL | WIN_PROB | SQUAD_RATING | RANKING
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const json = await apiFetch('/api/teams/enriched');
if (json.status === 'ok') {
          setTeams(json.data);
        }
      } catch (err) {
        console.error('Error fetching teams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Filter Logics
  const filteredTeams = teams.filter((team) => {
    // 1. Search Query
    if (searchQuery.trim() && !team.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 2. Confederation
    if (selectedConfederation !== 'ALL' && team.confederation !== selectedConfederation) {
      return false;
    }
    // 3. Group Letter
    if (selectedGroup !== 'ALL' && team.group_letter !== selectedGroup) {
      return false;
    }
    // 4. Win Prob Range
    if (selectedWinRange !== 'ALL') {
      const prob = team.win_probability;
      if (selectedWinRange === 'FAVORITES' && prob < 8.0) return false;
      if (selectedWinRange === 'CONTENDERS' && (prob < 3.0 || prob >= 8.0)) return false;
      if (selectedWinRange === 'DARKHORSES' && (prob < 1.0 || prob >= 3.0)) return false;
      if (selectedWinRange === 'UNDERDOGS' && prob >= 1.0) return false;
    }
    return true;
  });

  // Sort Logics
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (sortBy === 'ALPHABETICAL') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'WIN_PROB') {
      return b.win_probability - a.win_probability;
    }
    if (sortBy === 'SQUAD_RATING') {
      return b.avg_rating - a.avg_rating;
    }
    // Default RANKING (lower is better ranking, e.g. Rank 1 first)
    return a.fifa_ranking - b.fifa_ranking;
  });

  const confederations = ['ALL', 'UEFA', 'CONMEBOL', 'CAF', 'AFC', 'CONCACAF', 'OFC'];
  const groupsList = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const winRanges = [
    { label: 'All Ranges', val: 'ALL' },
    { label: 'Favorites (★ >=8%)', val: 'FAVORITES' },
    { label: 'Contenders (3% - 8%)', val: 'CONTENDERS' },
    { label: 'Dark Horses (1% - 3%)', val: 'DARKHORSES' },
    { label: 'Underdogs (< 1%)', val: 'UNDERDOGS' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-16">
      
      {/* Header */}
      <div className="text-center md:text-left border-b border-[#6B7A99]/15 pb-4">
        <h1 className="text-4xl font-display font-black text-[#E8EDF5] tracking-widest uppercase flex flex-col md:flex-row md:items-baseline gap-2.5 justify-center md:justify-start">
          <span>Participating Teams</span>
          <span className="text-sm font-sans text-accent font-semibold tracking-wider font-mono uppercase bg-[#111C2E] border border-accent/25 px-2.5 py-1 rounded">
            48 Nations Pool
          </span>
        </h1>
        <p className="text-xs text-[#6B7A99] font-medium uppercase tracking-wide mt-1">
          Explore complete rosters, tactical coaching profiles, and win metrics for every qualified country
        </p>
      </div>

      {/* Filter and search control bar */}
      <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-[#6B7A99]/10 pb-3">
          <SlidersHorizontal className="h-4.5 w-4.5 text-accent" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#E8EDF5]">Advanced Selection Filters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Real-time search */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest">Search Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Find by country name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#07101E] border border-[#6B7A99]/25 rounded-md py-2 pl-9 pr-3 text-xs text-[#E8EDF5] focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-[#6B7A99]" />
            </div>
          </div>

          {/* Confederation Filter */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest">Confederation</label>
            <select
              value={selectedConfederation}
              onChange={(e) => setSelectedConfederation(e.target.value)}
              className="w-full bg-[#07101E] border border-[#6B7A99]/25 text-xs text-[#E8EDF5] rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-accent font-semibold"
            >
              {confederations.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Federations' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest">Draw Pool</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-[#07101E] border border-[#6B7A99]/25 text-xs text-[#E8EDF5] rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-accent font-semibold"
            >
              {groupsList.map(g => (
                <option key={g} value={g}>
                  {g === 'ALL' ? 'All Group Seeding' : `Group ${g}`}
                </option>
              ))}
            </select>
          </div>

          {/* Win Probability Filter */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest">Tier Range</label>
            <select
              value={selectedWinRange}
              onChange={(e) => setSelectedWinRange(e.target.value)}
              className="w-full bg-[#07101E] border border-[#6B7A99]/25 text-xs text-[#E8EDF5] rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-accent font-semibold"
            >
              {winRanges.map(wr => (
                <option key={wr.val} value={wr.val}>
                  {wr.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Options bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#6B7A99]/10 text-xs">
          <span className="text-[#6B7A99] font-bold uppercase tracking-widest text-[9px] font-mono">
            Filtered matches: {sortedTeams.length} / 48 Countries
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[#6B7A99] uppercase font-semibold text-[10px]">Sort criteria:</span>
            <div className="flex bg-[#07101E] border border-[#6B7A99]/25 p-1 rounded-md">
              <button
                onClick={() => setSortBy('RANKING')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  sortBy === 'RANKING' ? 'bg-accent text-primary' : 'text-[#6B7A99] hover:text-[#E8EDF5]'
                }`}
              >
                FIFA Rank
              </button>
              <button
                onClick={() => setSortBy('WIN_PROB')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  sortBy === 'WIN_PROB' ? 'bg-accent text-primary' : 'text-[#6B7A99] hover:text-[#E8EDF5]'
                }`}
              >
                Win %
              </button>
              <button
                onClick={() => setSortBy('SQUAD_RATING')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  sortBy === 'SQUAD_RATING' ? 'bg-accent text-primary' : 'text-[#6B7A99] hover:text-[#E8EDF5]'
                }`}
              >
                Avg Rating
              </button>
              <button
                onClick={() => setSortBy('ALPHABETICAL')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  sortBy === 'ALPHABETICAL' ? 'bg-accent text-primary' : 'text-[#6B7A99] hover:text-[#E8EDF5]'
                }`}
              >
                A-Z
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="text-center text-xs text-[#6B7A99] py-16 animate-pulse">
          Retrieving 48 procedural rosters from Database storage...
        </div>
      ) : sortedTeams.length === 0 ? (
        <div className="text-center text-xs text-[#6B7A99] py-16 border border-dashed border-[#6B7A99]/25 rounded-xl">
          No teams match your selected filter criteria. Adjust filter query parameters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedTeams.map((team) => {
            // Determine progress level color
            let colorClass = 'bg-green-500';
            if (team.win_probability < 1.0) {
              colorClass = 'bg-red-400';
            } else if (team.win_probability < 3.0) {
              colorClass = 'bg-amber-400';
            }

            return (
              <div
                key={team.id}
                className="glass-effect rounded-xl overflow-hidden shadow-lg border border-[#6B7A99]/15 flex flex-col justify-between"
              >
                {/* Visual Header */}
                <div className="p-4.5 space-y-4">
                  <div className="flex justify-between items-start">
                    <Flag flag={team.flag} slug={team.slug} name={team.name} size="lg" />
                    <div className="text-right">
                      <span className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest block font-mono">FIFA Rank</span>
                      <span className="text-sm font-mono text-[#E8EDF5] font-black leading-none">#{team.fifa_ranking}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#E8EDF5] uppercase tracking-wide truncate">{team.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] uppercase font-bold text-accent bg-[#07101E] px-1.5 py-0.5 rounded leading-none">
                        Group {team.group_letter}
                      </span>
                      <span className="text-[9px] text-[#6B7A99] uppercase tracking-wider font-semibold font-sans">
                        {team.confederation}
                      </span>
                    </div>
                  </div>

                  {/* Coach and metrics details */}
                  <div className="border-t border-[#6B7A99]/10 pt-3 space-y-2.5 text-[10px]">
                    <div className="flex justify-between items-center font-sans font-semibold text-[#6B7A99]">
                      <span className="uppercase">Tactician:</span>
                      <span className="text-[#E8EDF5] font-bold">{team.coach_name}</span>
                    </div>

                    <div className="flex justify-between items-center font-sans font-semibold text-[#6B7A99]">
                      <span className="uppercase">Squad Avg Rating:</span>
                      <span className="text-green-400 font-mono font-bold text-xs">{team.avg_rating}</span>
                    </div>

                    {team.top_player && (
                      <div className="flex justify-between items-center font-sans font-semibold text-[#6B7A99]">
                        <span className="uppercase">Main Outfield:</span>
                        <span className="text-[#E8EDF5] truncate max-w-[120px] font-bold" title={team.top_player.name}>
                          {team.top_player.name} ({team.top_player.rating})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Win Prob bar and CTA */}
                <div>
                  {/* Color coded probability bar */}
                  <div className="px-4.5 pb-3">
                    <div className="flex justify-between text-[10px] text-[#6B7A99] font-bold uppercase font-mono tracking-wider mb-1 leading-none">
                      <span>Win probability</span>
                      <span className="text-accent">{team.win_probability}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#07101E] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass}`}
                        style={{ width: `${Math.min(100, team.win_probability * 6.5)}%` }} // normalized visual length
                      />
                    </div>
                  </div>

                  <div className="p-4.5 bg-[#0A1628]/40 border-t border-[#6B7A99]/10">
                    <Link
                      to={`/teams/${team.slug}`}
                      className="w-full py-2 bg-[#1F304A] text-[#E8EDF5] hover:text-accent font-bold hover:bg-[#0A1628] rounded-lg border border-[#6B7A99]/10 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                    >
                      View Squad Details
                      <ChevronRight className="h-4 w-4 text-accent mt-0.5" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
