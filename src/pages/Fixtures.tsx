/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Edit3, Save, X, Play,
  ChevronDown, ChevronUp, Filter, RefreshCw
} from 'lucide-react';
import { Match, Team } from '../types';
import Flag from '../components/Flag';
import { apiFetch } from '../lib/apiFetch';

type StageFilter = 'All' | 'Group' | 'Round of 32' | 'Round of 16' | 'Quarterfinals' | 'Semifinals' | 'Final';
type StatusFilter = 'All' | 'Upcoming' | 'Played';

interface MatchWithTeams extends Match {
  home_team?: Team;
  away_team?: Team;
}

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
    full: d,
  };
}

function groupMatchesByDate(matches: MatchWithTeams[]) {
  const map = new Map<string, MatchWithTeams[]>();
  matches.forEach(m => {
    const key = new Date(m.match_date).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  });
  return Array.from(map.entries()).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );
}

const STAGE_COLORS: Record<string, string> = {
  'Group':        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Round of 32':  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Round of 16':  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Quarterfinals':'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Semifinals':   'bg-red-500/10 text-red-400 border-red-500/20',
  'Final':        'bg-accent/10 text-accent border-accent/30',
};

export default function Fixtures() {
  const [matches, setMatches]         = useState<MatchWithTeams[]>([]);
  const [allTeams, setAllTeams]       = useState<Team[]>([]);
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState<string | null>(null);

  // filters
  const [stageFilter, setStageFilter]   = useState<StageFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [groupFilter, setGroupFilter]   = useState<string>('All');
  const [showFilters, setShowFilters]   = useState(false);

  // inline score editing
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [scoreHome, setScoreHome]         = useState(0);
  const [scoreAway, setScoreAway]         = useState(0);
  const [savingId, setSavingId]           = useState<string | null>(null);

  // collapse date groups
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const matchesJson = await apiFetch('/api/football/matches');
      const raw: Match[] = matchesJson.data?.matches ?? matchesJson.data ?? [];

      // Also pull teams from standings for flag/name lookup
      const standingsJson = await apiFetch('/api/football/standings');
      const standingsRaw = standingsJson.data?.standings ?? [];
      const teamMap = new Map<string, Team>();
      standingsRaw.forEach((st: any) => {
        (st.table ?? []).forEach((row: any) => {
          const t: Team = {
            id: String(row.team.id),
            name: row.team.shortName || row.team.name,
            slug: (row.team.shortName || row.team.name).toLowerCase().replace(/\s+/g, '-'),
            group_letter: st.group?.replace('GROUP_', '') ?? 'A',
            coach_name: '',
            coach_nationality: '',
            confederation: 'FIFA',
            win_probability: 0,
            win_factors: '',
            fifa_ranking: row.position,
            best_case: '',
            realistic_target: '',
            flag: row.team.tla ?? '🏳️',
          };
          teamMap.set(t.id, t);
        });
      });

      const enriched: MatchWithTeams[] = raw.map((m: any) => ({
        ...m,
        home_team: teamMap.get(String(m.team_home_id)) ?? m.home_team,
        away_team: teamMap.get(String(m.team_away_id)) ?? m.away_team,
      }));

      setMatches(enriched);
      setAllTeams(Array.from(teamMap.values()));
    } catch (err: any) {
      setApiError(err.message ?? 'Failed to load fixtures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── helpers ──────────────────────────────────────────────────────────────
  const openEdit = (m: MatchWithTeams) => {
    setEditingId(m.id);
    setScoreHome(m.score_home ?? 0);
    setScoreAway(m.score_away ?? 0);
  };

  const cancelEdit = () => setEditingId(null);

  const saveScore = async (m: MatchWithTeams) => {
    setSavingId(m.id);
    try {
      // Try remote API first; fall back to local state update
      await fetch(`/api/matches/${m.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score_home: scoreHome, score_away: scoreAway, played: true }),
      }).catch(() => null); // silence network errors — we update locally regardless

      setMatches(prev => prev.map(x =>
        x.id === m.id
          ? { ...x, score_home: scoreHome, score_away: scoreAway, played: true }
          : x
      ));
    } finally {
      setSavingId(null);
      setEditingId(null);
    }
  };

  const simulateUnplayed = () => {
    setMatches(prev => prev.map(m => {
      if (!m.played && m.stage === 'Group') {
        return {
          ...m,
          score_home: Math.floor(Math.random() * 4),
          score_away: Math.floor(Math.random() * 4),
          played: true,
        };
      }
      return m;
    }));
  };

  const toggleDateCollapse = (key: string) => {
    setCollapsedDates(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── filtering ────────────────────────────────────────────────────────────
  const uniqueGroups = ['All', ...Array.from(new Set(
    matches.filter(m => m.group_letter).map(m => m.group_letter!)
  )).sort()];

  const filtered = matches.filter(m => {
    if (stageFilter  !== 'All' && m.stage !== stageFilter)               return false;
    if (statusFilter === 'Played'   && !m.played)                        return false;
    if (statusFilter === 'Upcoming' && m.played)                         return false;
    if (groupFilter  !== 'All' && m.group_letter !== groupFilter)        return false;
    return true;
  });

  const grouped = groupMatchesByDate(filtered);

  const totalUpcoming = matches.filter(m => !m.played).length;
  const totalPlayed   = matches.filter(m => m.played).length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#6B7A99]/15 pb-5">
        <div>
          <h1 className="text-3xl font-display font-black text-[#E8EDF5] tracking-widest uppercase flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-accent shrink-0" />
            Fixtures & Results
          </h1>
          <p className="text-xs text-[#6B7A99] font-medium uppercase tracking-wide mt-1">
            All 104 matches · Group stage to Final · Edit scores inline
          </p>
        </div>

        {/* stats pill + actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
            ✓ {totalPlayed} played
          </span>
          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
            ⏳ {totalUpcoming} upcoming
          </span>
          <button
            onClick={simulateUnplayed}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-primary text-xs font-bold rounded hover:bg-amber-300 transition-all"
          >
            <Play className="h-3.5 w-3.5" /> Simulate Group Stage
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111C2E] border border-[#6B7A99]/20 text-[#E8EDF5] text-xs font-bold rounded hover:bg-[#1F304A] transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowFilters(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#6B7A99] hover:text-[#E8EDF5] transition-colors"
        >
          <span className="flex items-center gap-2"><Filter className="h-3.5 w-3.5 text-accent" /> Filter Matches</span>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showFilters && (
          <div className="border-t border-[#6B7A99]/10 px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-[#6B7A99] tracking-widest">Status</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['All', 'Upcoming', 'Played'] as StatusFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                      statusFilter === s
                        ? 'bg-accent text-primary border-accent'
                        : 'bg-[#07101E] text-[#6B7A99] border-[#6B7A99]/15 hover:text-[#E8EDF5]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-[#6B7A99] tracking-widest">Stage</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['All', 'Group', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'] as StageFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStageFilter(s)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                      stageFilter === s
                        ? 'bg-accent text-primary border-accent'
                        : 'bg-[#07101E] text-[#6B7A99] border-[#6B7A99]/15 hover:text-[#E8EDF5]'
                    }`}
                  >
                    {s === 'All' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Group */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-[#6B7A99] tracking-widest">Group</label>
              <div className="flex gap-1.5 flex-wrap">
                {uniqueGroups.map(g => (
                  <button
                    key={g}
                    onClick={() => setGroupFilter(g)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                      groupFilter === g
                        ? 'bg-accent text-primary border-accent'
                        : 'bg-[#07101E] text-[#6B7A99] border-[#6B7A99]/15 hover:text-[#E8EDF5]'
                    }`}
                  >
                    {g === 'All' ? 'All' : `Grp ${g}`}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {apiError && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 p-4 rounded-xl text-xs">
          ⚠ {apiError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-[#6B7A99] animate-pulse">
          Loading fixtures...
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#6B7A99] border border-dashed border-[#6B7A99]/20 rounded-xl">
          No matches found for the selected filters.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, dayMatches]) => {
            const isCollapsed = collapsedDates.has(dateKey);
            const label = new Date(dateKey).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            });
            const playedCount = dayMatches.filter(m => m.played).length;

            return (
              <div key={dateKey} className="space-y-2">

                {/* Date header */}
                <button
                  onClick={() => toggleDateCollapse(dateKey)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#0A1628] rounded-lg border border-[#6B7A99]/10 hover:border-[#6B7A99]/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#E8EDF5]">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    {label}
                    <span className="text-[#6B7A99] font-mono normal-case">
                      · {playedCount}/{dayMatches.length} played
                    </span>
                  </div>
                  {isCollapsed
                    ? <ChevronDown className="h-4 w-4 text-[#6B7A99]" />
                    : <ChevronUp   className="h-4 w-4 text-[#6B7A99]" />
                  }
                </button>

                {!isCollapsed && (
                  <div className="space-y-2.5 pl-1">
                    {dayMatches.map(m => {
                      const hTeam = m.home_team ?? allTeams.find(t => t.id === m.team_home_id);
                      const aTeam = m.away_team ?? allTeams.find(t => t.id === m.team_away_id);
                      const { time } = formatMatchDate(m.match_date);
                      const isEditing = editingId === m.id;
                      const isSaving  = savingId  === m.id;

                      return (
                        <div
                          key={m.id}
                          className={`bg-[#111C2E] border rounded-xl overflow-hidden shadow transition-all ${
                            m.played
                              ? 'border-[#6B7A99]/15'
                              : 'border-blue-500/15 hover:border-blue-500/30'
                          }`}
                        >
                          {/* Stage + time bar */}
                          <div className="flex items-center justify-between px-4 py-1.5 bg-[#0A1628]/50 border-b border-[#6B7A99]/10">
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${STAGE_COLORS[m.stage] ?? 'text-[#6B7A99]'}`}>
                              {m.stage}{m.group_letter ? ` · Grp ${m.group_letter}` : ''}
                            </span>
                            <div className="flex items-center gap-3 text-[9px] text-[#6B7A99] font-mono font-bold uppercase">
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />{time}
                              </span>
                              <span className="flex items-center gap-1 max-w-[140px] truncate">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />{m.venue}
                              </span>
                            </div>
                          </div>

                          {/* Match row */}
                          <div className="flex items-center px-4 py-3 gap-3">

                            {/* Home team */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Flag flag={hTeam?.flag ?? '🏳️'} slug={hTeam?.id ?? ''} name={hTeam?.name ?? ''} size="sm" />
                              <span className="text-sm font-bold text-[#E8EDF5] truncate uppercase">
                                {hTeam?.name ?? 'TBD'}
                              </span>
                            </div>

                            {/* Score / VS / Edit */}
                            <div className="shrink-0 flex flex-col items-center gap-1 min-w-[90px]">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number" min="0" max="20"
                                    value={scoreHome}
                                    onChange={e => setScoreHome(parseInt(e.target.value) || 0)}
                                    className="w-10 h-9 bg-[#07101E] border border-accent/30 text-center font-mono font-bold text-accent text-base rounded focus:outline-none focus:ring-1 focus:ring-accent"
                                  />
                                  <span className="text-[#6B7A99] font-mono font-bold">–</span>
                                  <input
                                    type="number" min="0" max="20"
                                    value={scoreAway}
                                    onChange={e => setScoreAway(parseInt(e.target.value) || 0)}
                                    className="w-10 h-9 bg-[#07101E] border border-accent/30 text-center font-mono font-bold text-accent text-base rounded focus:outline-none focus:ring-1 focus:ring-accent"
                                  />
                                </div>
                              ) : m.played ? (
                                <div className="text-center">
                                  <span className="text-xl font-mono font-black text-accent">
                                    {m.score_home} – {m.score_away}
                                  </span>
                                  <div className="text-[8px] text-green-400 font-bold uppercase tracking-wider">FT</div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <span className="text-xs font-mono font-bold text-[#6B7A99] tracking-widest">VS</span>
                                  <div className="text-[8px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">Upcoming</div>
                                </div>
                              )}

                              {/* edit / save / cancel buttons */}
                              <div className="flex items-center gap-1 mt-0.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveScore(m)}
                                      disabled={isSaving}
                                      className="flex items-center gap-0.5 px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[9px] font-bold hover:bg-green-500/20 transition-all disabled:opacity-50"
                                    >
                                      <Save className="h-2.5 w-2.5" /> Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="flex items-center gap-0.5 px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-bold hover:bg-red-500/20 transition-all"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => openEdit(m)}
                                    className="flex items-center gap-0.5 px-2 py-1 bg-[#1F304A] text-[#6B7A99] border border-[#6B7A99]/15 rounded text-[9px] font-bold hover:text-accent hover:border-accent/30 transition-all"
                                  >
                                    <Edit3 className="h-2.5 w-2.5" />
                                    {m.played ? 'Edit' : 'Enter Score'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Away team */}
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="text-sm font-bold text-[#E8EDF5] truncate uppercase text-right">
                                {aTeam?.name ?? 'TBD'}
                              </span>
                              <Flag flag={aTeam?.flag ?? '🏳️'} slug={aTeam?.id ?? ''} name={aTeam?.name ?? ''} size="sm" />
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}