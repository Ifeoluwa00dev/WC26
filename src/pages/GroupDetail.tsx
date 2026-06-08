/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutGrid, Calendar, HelpCircle, Trophy, Edit3, ArrowLeft, RefreshCw, Star } from 'lucide-react';
import { Team, Match, GroupStandings } from '../types';
import Flag from '../components/Flag';

interface TeamCardData {
  id: string;
  name: string;
  flag: string;
  coach_name: string;
  win_probability: number;
  average_rating: number;
  key_player: { name: string; rating: number } | null;
}

export default function GroupDetail() {
  const { groupLetter } = useParams();
  const [data, setData] = useState<{
    group: { letter: string; nickname: string; difficulty: string };
    standings: GroupStandings[];
    team_cards: TeamCardData[];
    fixtures: Match[];
    editorial: string;
    h2h_matrix: Record<string, Record<string, string>>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [scoreHomeInput, setScoreHomeInput] = useState<number>(0);
  const [scoreAwayInput, setScoreAwayInput] = useState<number>(0);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const fetchGroupDetail = async () => {
    if (!groupLetter) return;
    try {
      const res = await fetch(`/api/groups/${groupLetter.toLowerCase()}`);
      const json = await res.json();
      if (json.status === 'ok') {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching group detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetail();
  }, [groupLetter]);

  const handleEditClick = (m: Match) => {
    setEditingMatch(m);
    setScoreHomeInput(m.score_home ?? 0);
    setScoreAwayInput(m.score_away ?? 0);
  };

  const handleSaveScore = async () => {
    if (!editingMatch) return;
    try {
      const res = await fetch(`/api/matches/${editingMatch.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_home: scoreHomeInput,
          score_away: scoreAwayInput,
          played: true
        })
      });
      const json = await res.json();
      if (json.status === 'ok') {
        setEditingMatch(null);
        // Refresh local view
        setLoading(true);
        fetchGroupDetail();
      }
    } catch (err) {
      console.error('Error updating match score', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-[#6B7A99] animate-pulse">
        Fetching single group information and standing statistics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-red-400">
        Group Stage Pool not found. Verify letter slug parameter.
      </div>
    );
  }

  const { group, standings, team_cards, fixtures, editorial, h2h_matrix } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10 pb-16">
      
      {/* Page Navigation Breadcrumb */}
      <div className="flex items-center justify-between border-b border-[#6B7A99]/15 pb-4">
        <Link
          to="/groups"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Seeding Draws
        </Link>
        <span className="text-[10px] text-[#6B7A99] font-bold uppercase tracking-widest font-mono">
          Pool Terminal / Group {group.letter}
        </span>
      </div>

      {/* Group Header Banner */}
      <div className="bg-[#111C2E] rounded-xl border border-[#6B7A99]/15 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <h1 className="text-5xl font-display font-black text-[#E8EDF5] tracking-widest leading-none">
              Group {group.letter}
            </h1>
            <span className="text-xs text-[#6B7A99] uppercase font-bold tracking-wider">
              "{group.nickname}"
            </span>
          </div>
          <p className="text-xs text-[#6B7A99]">
            Current standing positions computed by official goal difference and ranking weight criteria.
          </p>
        </div>

        <div>
          <span className="inline-block bg-accent/10 border border-accent/25 text-accent text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg leading-none">
            Pool difficulty: {group.difficulty}
          </span>
        </div>
      </div>

      {/* Standings Table & Side Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-accent" />
            Live Pool Standings
          </h2>

          <div className="overflow-x-auto bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl shadow-xl">
            <table className="w-full text-xs text-left text-[#E8EDF5]">
              <thead>
                <tr className="bg-[#0A1628] border-b border-[#6B7A99]/15 uppercase tracking-widest text-[9px] text-[#6B7A99] font-bold font-mono">
                  <th className="px-4 py-3 text-center w-12">Pos</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-center">P</th>
                  <th className="px-4 py-3 text-center">W</th>
                  <th className="px-3 py-3 text-center">D</th>
                  <th className="px-3 py-3 text-center">L</th>
                  <th className="px-3 py-3 text-center">GF</th>
                  <th className="px-3 py-3 text-center">GA</th>
                  <th className="px-4 py-3 text-center">GD</th>
                  <th className="px-4 py-3 text-center text-accent">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, index) => (
                  <tr
                    key={row.team.id}
                    className="border-b last:border-none border-[#6B7A99]/10 hover:bg-[#1F304A]/30 transition-all font-semibold"
                  >
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-mono font-bold ${
                        index < 2
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : index === 2
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/teams/${row.team.slug}`}
                        className="flex items-center gap-2.5 text-[#E8EDF5] hover:text-accent font-bold"
                      >
                        <Flag flag={row.team.flag} slug={row.team.slug} name={row.team.name} size="sm" />
                        <span>{row.team.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-center font-mono">{row.played}</td>
                    <td className="px-4 py-4 text-center font-mono text-green-400">{row.won}</td>
                    <td className="px-3 py-4 text-center font-mono text-[#6B7A99]">{row.drawn}</td>
                    <td className="px-3 py-4 text-center font-mono text-red-400">{row.lost}</td>
                    <td className="px-3 py-4 text-center font-mono">{row.gf}</td>
                    <td className="px-3 py-4 text-center font-mono">{row.ga}</td>
                    <td className="px-4 py-4 text-center font-mono text-[#6B7A99]">
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-accent font-black text-sm">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 text-[10px] uppercase font-semibold text-[#6B7A99] bg-[#111C2E]/40 px-4 py-2.5 rounded-lg">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400" /> Top 2: QF Bracket</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> 3rd Slot: Wildcard Pool</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> 4th Slot: Out</span>
          </div>
        </div>

        {/* Static Group Editorial Info */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Star className="h-4.5 w-4.5 text-accent" />
            Tactical Group Analysis
          </h2>
          <div className="glass-effect p-5 rounded-xl border border-[#6B7A99]/15 space-y-4 relative">
            <p className="text-xs text-[#E8EDF5]/90 leading-relaxed font-sans italic">
              "{editorial}"
            </p>
            <div className="border-t border-[#6B7A99]/10 pt-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B7A99] font-bold uppercase tracking-wider text-[10px]">Primary Favorite:</span>
                <span className="text-accent font-black">{standings[0]?.team.name || 'Unseeded'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B7A99] font-bold uppercase tracking-wider text-[10px]">Upset Candidate:</span>
                <span className="text-red-400 font-bold">{standings[2]?.team.name || 'Unseeded'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4 Team Cards row */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest">
          SQUAD INTEL SUMMARY CARDS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {team_cards.map((c) => (
            <div
              key={c.id}
              className="glass-effect p-4.5 rounded-xl border border-[#6B7A99]/15 hover:border-accent/30 transition-all flex flex-col justify-between"
            >
              <div className="border-b border-[#6B7A99]/10 pb-3 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <Flag flag={c.flag} slug={c.id} name={c.name} size="md" />
                  <div>
                    <h3 className="text-sm font-bold text-[#E8EDF5] uppercase leading-none truncate w-[130px]">{c.name}</h3>
                    <span className="text-[10px] text-[#6B7A99]">Coach: {c.coach_name}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B7A99] font-semibold text-[10px] uppercase">Win probability:</span>
                  <span className="font-mono text-accent font-bold">{c.win_probability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7A99] font-semibold text-[10px] uppercase">Roster avg rating:</span>
                  <span className="font-mono font-bold text-green-400">{c.average_rating}</span>
                </div>
                {c.key_player && (
                  <div className="flex justify-between border-t border-[#6B7A99]/10 pt-1.5 mt-1.5 font-sans">
                    <span className="text-[#6B7A99] text-[10px] uppercase">Key Star:</span>
                    <span className="font-semibold text-[#E8EDF5] truncate max-w-[100px]" title={c.key_player.name}>
                      {c.key_player.name} ({c.key_player.rating})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixtures Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Match Lineups */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-[#6B7A99]" />
            Official Pool Matches
          </h2>

          <div className="space-y-3.5">
            {fixtures.map((m) => {
              const hTeam = team_cards.find(t => t.id === m.team_home_id);
              const aTeam = team_cards.find(t => t.id === m.team_away_id);
              if (!hTeam || !aTeam) return null;
              
              return (
                <div
                  key={m.id}
                  className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl overflow-hidden shadow"
                >
                  <div className="flex h-16 items-center px-4 justify-between gap-4">
                    {/* Home details */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Flag flag={hTeam.flag} slug={hTeam.id} name={hTeam.name} size="sm" />
                      <span className="text-xs font-bold text-[#E8EDF5] truncate uppercase">{hTeam.name}</span>
                    </div>

                    {/* Quick Scoreboard / Edit Trigger */}
                    <button
                      onClick={() => handleEditClick(m)}
                      className="px-4 py-1.5 bg-[#07101E] text-xs font-mono font-black border border-[#6B7A99]/10 rounded-md hover:border-accent hover:text-accent transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      {m.played ? (
                        <span className="text-accent">{m.score_home} - {m.score_away}</span>
                      ) : (
                        <span className="text-[#6B7A99]">VS</span>
                      )}
                      <Edit3 className="h-3 w-3 text-[#6B7A99] hover:text-accent shrink-0" />
                    </button>

                    {/* Away details */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <span className="text-xs font-bold text-[#E8EDF5] truncate uppercase text-right">{aTeam.name}</span>
                      <Flag flag={aTeam.flag} slug={aTeam.id} name={aTeam.name} size="sm" />
                    </div>
                  </div>
                  <div className="bg-[#0A1628]/40 border-t border-[#6B7A99]/10 px-4 py-2 flex justify-between items-center text-[9px] uppercase font-bold text-[#6B7A99] font-mono leading-none">
                    <span>{new Date(m.match_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>{m.venue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* H2H Historical Matrix Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-[#C8102E]" />
            Pool H2H Match Record Matrix
          </h2>

          <div className="overflow-hidden bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl shadow-xl p-4">
            <p className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-wider mb-3 leading-none">
              ★ Historical FIFA World Cup match counts (Wins / Draws / Losses) ★
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-center font-semibold font-mono text-[#E8EDF5]">
                <thead>
                  <tr className="border-b border-[#6B7A99]/15">
                    <th className="py-2.5 text-left text-xs uppercase text-[#6B7A99] font-sans">Side</th>
                    {team_cards.map(t => (
                      <th key={t.id} className="py-2.5 font-bold" title={t.name}>
                        <div className="flex justify-center">
                          <Flag flag={t.flag} slug={t.id} name={t.name} size="sm" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team_cards.map((rowTeam) => (
                    <tr key={rowTeam.id} className="border-b last:border-none border-[#6B7A99]/10">
                      <td className="py-3 text-left font-sans text-xs font-semibold text-[#E8EDF5]">
                        <span className="flex items-center gap-1.5 font-semibold uppercase shrink-0 truncate max-w-[100px]">
                          <Flag flag={rowTeam.flag} slug={rowTeam.id} name={rowTeam.name} size="xs" />
                          <span>{rowTeam.name.substring(0, 3)}</span>
                        </span>
                      </td>
                      {team_cards.map((colTeam) => {
                        const cellVal = h2h_matrix[rowTeam.id]?.[colTeam.id] || '-';
                        return (
                          <td
                            key={colTeam.id}
                            className={`py-3 ${cellVal === '-' ? 'text-[#6B7A99]/40' : 'text-[#E8EDF5]/90'}`}
                          >
                            {cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Score edit modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#111C2E] border border-[#6B7A99]/25 p-5 rounded-xl shadow-2xl relative space-y-5">
            <h3 className="text-sm font-bold text-[#E8EDF5] uppercase tracking-wider text-center border-b border-[#6B7A99]/10 pb-2">
              Update Match Scoreboard
            </h3>

            <div className="flex items-center justify-between text-center gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="h-10 flex items-center justify-center">
                  <Flag
                    flag={team_cards.find(t => t.id === editingMatch.team_home_id)?.flag || '🏳️'}
                    slug={editingMatch.team_home_id}
                    name={team_cards.find(t => t.id === editingMatch.team_home_id)?.name || ''}
                    size="lg"
                  />
                </div>
                <span className="block text-xs font-bold text-[#E8EDF5] truncate uppercase">
                  {team_cards.find(t => t.id === editingMatch.team_home_id)?.name}
                </span>
              </div>

              {/* Numbers */}
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={scoreHomeInput}
                  onChange={(e) => setScoreHomeInput(parseInt(e.target.value) || 0)}
                  className="w-12 h-12 bg-[#07101E] border border-accent/25 focus:border-accent text-center text-xl font-bold font-mono text-accent rounded-md focus:outline-none"
                />
                <span className="text-[#6B7A99], font-bold font-mono text-lg">:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={scoreAwayInput}
                  onChange={(e) => setScoreAwayInput(parseInt(e.target.value) || 0)}
                  className="w-12 h-12 bg-[#07101E] border border-accent/25 focus:border-accent text-center text-xl font-bold font-mono text-accent rounded-md focus:outline-none"
                />
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="h-10 flex items-center justify-center">
                  <Flag
                    flag={team_cards.find(t => t.id === editingMatch.team_away_id)?.flag || '🏳️'}
                    slug={editingMatch.team_away_id}
                    name={team_cards.find(t => t.id === editingMatch.team_away_id)?.name || ''}
                    size="lg"
                  />
                </div>
                <span className="block text-xs font-bold text-[#E8EDF5] truncate uppercase">
                  {team_cards.find(t => t.id === editingMatch.team_away_id)?.name}
                </span>
              </div>
            </div>

            <div className="flex gap-3 text-xs font-bold leading-none uppercase tracking-wider">
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-3 bg-[#1F304A] hover:bg-[#0A1628] rounded border border-[#6B7A99]/15 text-[#E8EDF5]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScore}
                className="flex-1 py-3 bg-accent text-primary rounded font-bold hover:bg-amber-300"
              >
                Save Results
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
