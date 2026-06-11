/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, GitFork, Play, RotateCcw, HelpCircle, ChevronRight, CheckCircle, Edit3, Save, Calendar
} from 'lucide-react';
import { Team, Match, GroupStandings } from '../types';
import Flag from '../components/Flag';
import { getFlagEmoji } from '../lib/footballApi';
import { apiFetch } from '../lib/apiFetch';

const mapAPIToGroups = (apiResult: any, code: 'WC'|'PL'): GroupSummary[] => {
  const standingsRaw = apiResult.standings || [];
  if (code === 'PL') {
    const table = standingsRaw[0]?.table || [];
    const groups: GroupSummary[] = [];
    const groupLetters = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 0; i < groupLetters.length; i++) {
      const letter = groupLetters[i];
      const slice = table.slice(i * 4, (i + 1) * 4);
      groups.push({
        letter,
        standings: table.filter((row: any) => row.team).map((row: any) => ({
  team: {
    id: String(row.team?.id || ''),
    name: row.team?.shortName || row.team?.name || 'TBD',
    slug: (row.team?.shortName || row.team?.name || 'tbd').toLowerCase().replace(/\s+/g, '-'),
    group_letter: groupLetter,
    coach_name: 'Unknown Coach',
    coach_nationality: 'Unknown',
    confederation: 'FIFA',
    win_probability: 2.0,
    win_factors: 'Group Stage Contenders',
    fifa_ranking: row.position,
    best_case: 'Knockouts',
    realistic_target: 'Group Stage',
    flag: getFlagEmoji(row.team?.name || '', row.team?.tla || '')
  },
          played: row.playedGames,
          won: row.won,
          drawn: row.draw,
          lost: row.lost,
          gf: row.goalsFor,
          ga: row.goalsAgainst,
          gd: row.goalDifference,
          points: row.points
        }))
      });
    }
    return groups;
  } else {
    // WC standings mapper
    return standingsRaw.map((st: any) => {
      const groupLetter = st.group ? st.group.replace('GROUP_', '').replace('Group ', '') : 'A';
      const table = st.table || [];
      return {
        letter: groupLetter,
        standings: table.map((row: any) => ({
          team: {
            id: String(row.team.id),
            name: row.team.shortName || row.team.name,
            slug: (row.team.shortName || row.team.name).toLowerCase().replace(/\s+/g, '-'),
            group_letter: groupLetter,
            coach_name: 'Unknown Coach',
            coach_nationality: 'Unknown',
            confederation: 'FIFA',
            win_probability: 2.0,
            win_factors: 'Group Stage Contenders',
            fifa_ranking: row.position,
            best_case: 'Knockouts',
            realistic_target: 'Group Stage',
            flag: getFlagEmoji(row.team?.name || '', row.team?.tla || '')
          },
          played: row.playedGames,
          won: row.won,
          drawn: row.draw,
          lost: row.lost,
          gf: row.goalsFor,
          ga: row.goalsAgainst,
          gd: row.goalDifference,
          points: row.points
        }))
      };
    });
  }
};

const mapAPIToMatches = (apiResult: any, code: 'WC'|'PL'): Match[] => {
  const matchesRaw = apiResult.matches || [];
  return matchesRaw.map((m: any) => {
    const groupLetter = m.group ? m.group.replace('GROUP_', '') : 'A';
    
    const homeTeam: Team = {
      id: String(m.homeTeam.id),
      name: m.homeTeam.shortName || m.homeTeam.name || 'TBD',
      slug: (m.homeTeam?.shortName || m.homeTeam?.name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
      group_letter: groupLetter,
      coach_name: 'Unknown Coach',
      coach_nationality: 'Unknown',
      confederation: 'FIFA',
      win_probability: 2.0,
      win_factors: '',
      fifa_ranking: 0,
      best_case: '',
      realistic_target: '',
      flag: getFlagEmoji(m.homeTeam.name, m.homeTeam.tla)
    };

    const awayTeam: Team = {
      id: String(m.awayTeam.id),
      name: m.awayTeam.shortName || m.awayTeam.name || 'TBD' ,
      slug: (m.awayTeam?.shortName || m.awayTeam?.name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
      group_letter: groupLetter,
      coach_name: 'Unknown Coach',
      coach_nationality: 'Unknown',
      confederation: 'FIFA',
      win_probability: 2.0,
      win_factors: '',
      fifa_ranking: 0,
      best_case: '',
      realistic_target: '',
      flag: getFlagEmoji(m.awayTeam.name, m.awayTeam.tla)
    };

    let stage: Match['stage'] = 'Group';
    if (m.stage === 'LAST_32' || m.stage === 'ROUND_OF_32') stage = 'Round of 32';
    else if (m.stage === 'LAST_16' || m.stage === 'ROUND_OF_16') stage = 'Round of 16';
    else if (m.stage === 'QUARTER_FINALS') stage = 'Quarterfinals';
    else if (m.stage === 'SEMI_FINALS') stage = 'Semifinals';
    else if (m.stage === 'FINAL') stage = 'Final';

    return {
      id: String(m.id),
      group_letter: groupLetter,
      team_home_id: String(m.homeTeam.id),
      team_away_id: String(m.awayTeam.id),
      score_home: m.score?.fullTime?.home ?? null,
      score_away: m.score?.fullTime?.away ?? null,
      match_date: m.utcDate,
      venue: m.venue || 'TBD Stadium',
      stage,
      played: m.status === 'FINISHED' || m.status === 'AWARDED',
      home_team: homeTeam,
      away_team: awayTeam
    };
  });
};

interface GroupSummary {
  letter: string;
  standings: GroupStandings[];
}

export default function Standings() {
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'BRACKET'>('GROUPS');
  const [groupsData, setGroupsData] = useState<GroupSummary[]>([]);
   const [matches, setMatches] = useState<Match[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [competitionCode, setCompetitionCode] = useState<'WC' | 'PL'>('WC');
  const [apiError, setApiError] = useState<string | null>(null);

  // Score edit states inside the brackets
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [scoreHomeInput, setScoreHomeInput] = useState<number>(0);
  const [scoreAwayInput, setScoreAwayInput] = useState<number>(0);

  const fetchStandingsData = async () => {
  setLoading(true);
  setApiError(null);
  try {
    const standingsJson = await apiFetch('/api/football/standings');
    const standingsData = standingsJson.data;
    const code = standingsJson.status === 'ok' ? 'WC' : 'PL';
    setCompetitionCode('WC');
    const mappedGroups = mapAPIToGroups(standingsData, 'WC');
    setGroupsData(mappedGroups);

    const matchesJson = await apiFetch('/api/football/matches');
    const matchesData = matchesJson.data;
    const mappedMatches = mapAPIToMatches(matchesData, 'WC');
    setMatches(mappedMatches);

    const extractedTeams: Team[] = [];
    const seenTeamIds = new Set<string>();
    mappedGroups.forEach(g => {
      g.standings.forEach(row => {
        if (!seenTeamIds.has(row.team.id)) {
          seenTeamIds.add(row.team.id);
          extractedTeams.push(row.team);
        }
      });
    });
    setAllTeams(extractedTeams);

  } catch (err: any) {
    console.error('Error fetching standings datasets', err);
    setApiError(err.message || 'Failed to fetch data.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchStandingsData();
  }, []);

  // Simulate group stage locally in state (client-side)
  const handleSimulateAll = () => {
    setSimulating(true);
    setTimeout(() => {
      setMatches(prev => prev.map(m => {
        if (m.stage === 'Group' && !m.played) {
          const hGoals = Math.floor(Math.random() * 4);
          const aGoals = Math.floor(Math.random() * 4);
          return {
            ...m,
            score_home: hGoals,
            score_away: aGoals,
            played: true
          };
        }
        return m;
      }));
      setSimulating(false);
    }, 800);
  };

  // Reset database state back to raw API results
  const handleResetDb = async () => {
    await fetchStandingsData();
  };

  // Trigger editable bracket scoreboard
  const openBracketEdit = (m: Match) => {
    setEditingMatchId(m.id);
    setScoreHomeInput(m.score_home ?? 0);
    setScoreAwayInput(m.score_away ?? 0);
  };

  const handleSaveBracketScore = async (mId: string) => {
    // Save locally since remote football-data.org API is read-only
    setMatches(prev => prev.map(m => {
      if (m.id === mId) {
        return {
          ...m,
          score_home: scoreHomeInput,
          score_away: scoreAwayInput,
          played: true
        };
      }
      return m;
    }));
    setEditingMatchId(null);
  };

  // Filter matches for knockout rendering
  const r32Matches = matches.filter(m => m.stage === 'Round of 32');
  const r16Matches = matches.filter(m => m.stage === 'Round of 16');
  const qfMatches = matches.filter(m => m.stage === 'Quarterfinals');
  const sfMatches = matches.filter(m => m.stage === 'Semifinals');
  const finalMatch = matches.find(m => m.stage === 'Final');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#6B7A99]/15 pb-4">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-display font-black text-[#E8EDF5] tracking-widest uppercase flex items-center justify-center sm:justify-start gap-2.5">
            <Trophy className="h-8 w-8 text-accent shrink-0" />
            Live Tournament Tracker
          </h1>
          <p className="text-xs text-[#6B7A99] font-medium uppercase tracking-wide mt-1">
            Simulate group outcomes, track qualified standing grids, and map out the entire tournament bracket tree
          </p>
        </div>

        {/* Global actions */}
        <div className="flex flex-col sm:flex-row bg-[#111C2E] sm:bg-[#111C2E] border border-[#6B7A99]/25 p-1 rounded-md text-xs font-bold uppercase tracking-wider leading-none gap-1.5 w-full sm:w-auto">
          <button
            onClick={handleSimulateAll}
            disabled={simulating}
            className="px-3.5 py-2.5 bg-accent text-primary font-bold rounded flex items-center justify-center gap-1.5 hover:bg-amber-300 disabled:opacity-50 cursor-pointer shadow-md glow-gold w-full sm:w-auto"
          >
            <Play className={`h-3.5 w-3.5 ${simulating ? 'animate-spin' : ''}`} />
            {simulating ? 'Simulating Matches...' : 'Simulate Group Stage'}
          </button>
          <button
            onClick={handleResetDb}
            className="px-3.5 py-2.5 bg-[#1F304A] text-[#E8EDF5] border border-[#6B7A99]/15 rounded flex items-center justify-center gap-1.5 hover:bg-[#0A1628] cursor-pointer w-full sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Bracket Seeding
          </button>
        </div>
      </div>

      {/* Tabs selectors for main contents */}
      <div className="flex justify-center border-b border-[#6B7A99]/10 pb-1">
        <div className="flex bg-[#111C2E] p-1 border border-[#6B7A99]/20 rounded-lg max-w-full">
          <button
            onClick={() => setActiveTab('GROUPS')}
            className={`px-3 sm:px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'GROUPS'
                ? 'bg-accent text-primary'
                : 'text-[#6B7A99] hover:text-[#E8EDF5]'
            }`}
          >
            <Trophy className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Group Stages Standings</span>
            <span className="inline sm:hidden">Groups</span>
          </button>
          <button
            onClick={() => setActiveTab('BRACKET')}
            className={`px-3 sm:px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'BRACKET'
                ? 'bg-accent text-primary'
                : 'text-[#6B7A99] hover:text-[#E8EDF5]'
            }`}
          >
            <GitFork className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Knockout Bracket Tree</span>
            <span className="inline sm:hidden">Bracket</span>
          </button>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-200 p-4 rounded-xl text-xs flex flex-col gap-1.5 font-sans">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <span>⚠ API Connection Error</span>
          </div>
          <p>{apiError}</p>
        </div>
      )}

      {competitionCode === 'PL' && !apiError && (
        <div className="bg-amber-950/30 border border-amber-500/20 text-amber-200 p-4 rounded-xl text-xs flex items-center justify-between font-sans shadow-sm">
          <div className="space-y-0.5">
            <h4 className="font-bold text-amber-400">⚡ Premier League Fallback (PL Enabled)</h4>
            <p className="text-[11px] text-[#A6B2C9] font-medium">WC 2026 scheduling is unavailable/unlicensed on football-data.org tier. PL teams have been mapped to 4-team groups.</p>
          </div>
          <span className="bg-[#111C2E] border border-amber-500/35 px-2.5 py-1 text-[10px] uppercase font-bold text-accent rounded-full font-mono shrink-0">
            Active: PL
          </span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-xs text-[#6B7A99] py-16 animate-pulse">
          Seeding tournament standing arrays and recalculating bracket tree mappings...
        </div>
      ) : activeTab === 'GROUPS' ? (
        
        /* 12 GROUPS GRID */
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupsData.map((g) => (
            <div
              key={g.letter}
              className="glass-effect rounded-xl overflow-hidden border border-[#6B7A99]/15 shadow-md flex flex-col justify-between"
            >
              <div className="bg-[#111C2E] px-4 py-2 flex justify-between items-center border-b border-[#6B7A99]/15">
                <span className="font-display text-lg text-accent tracking-widest font-black leading-none">
                  Group {g.letter}
                </span>
                <Link
                  to={`/groups/${g.letter.toLowerCase()}`}
                  className="text-[9.5px] uppercase text-accent font-bold tracking-widest flex items-center gap-0.5 hover:underline"
                >
                  Edit matches <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Little Standing Array */}
              <div className="p-4 space-y-2.5">
                <div className="grid grid-cols-12 text-[8px] uppercase tracking-widest text-[#6B7A99] font-mono font-bold border-b border-[#6B7A99]/10 pb-1 mb-1.5 text-center leading-none">
                  <span className="col-span-1 text-left">P</span>
                  <span className="col-span-7 text-left">Team</span>
                  <span className="col-span-1">P</span>
                  <span className="col-span-1">W</span>
                  <span className="col-span-1">GD</span>
                  <span className="col-span-1 text-accent">Pts</span>
                </div>

                {g.standings.map((row, index) => (
                  <div
                    key={row.team.id}
                    className="grid grid-cols-12 items-center text-xs font-semibold leading-none text-[#E8EDF5] text-center"
                  >
                    {/* Position */}
                    <span className={`col-span-1 text-left font-mono font-bold text-[9px] ${
                      index < 2 ? 'text-green-400' : index === 2 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {index + 1}
                    </span>

                    {/* Flag and Name */}
                    <Link
                      to={`/teams/${row.team.slug}`}
                      className="col-span-7 text-left truncate flex items-center gap-1.5 hover:text-accent font-bold"
                    >
                      <Flag flag={row.team.flag} slug={row.team.slug} name={row.team.name} size="xs" />
                      <span className="truncate max-w-[110px]">{row.team.name}</span>
                    </Link>

                    {/* Stats metrics */}
                    <span className="col-span-1 font-mono text-[#6B7A99]">{row.played}</span>
                    <span className="col-span-1 font-mono text-green-400">{row.won}</span>
                    <span className="col-span-1 font-mono text-[#6B7A99]">
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </span>
                    <span className="col-span-1 font-mono text-accent font-black">{row.points}</span>
                  </div>
                ))}
              </div>

              {/* Status color bar indicators */}
              <div className="bg-[#0A1628]/40 border-t border-[#6B7A99]/10 px-4 py-1.5 flex justify-between text-[8px] text-[#6B7A99] uppercase font-bold font-mono">
                <span className="text-green-400">Green: Advances</span>
                <span className="text-amber-400">Amber: Wildcard Pool</span>
              </div>
            </div>
          ))}
        </section>
      ) : (
        
        /* KNOCKOUT BRACKET FLOW TREE */
        <section className="space-y-8 overflow-x-auto pb-6">
          <div className="flex gap-8 min-w-[1200px] justify-between p-4">
            
            {/* 1. ROUND OF 32 (16 teams visible on two halves, or list) */}
            <div className="w-64 space-y-4 shrink-0">
              <div className="border-b border-[#6B7A99]/20 pb-1.5 text-center bg-[#111C2E] py-2 rounded-t-lg">
                <span className="text-[10px] text-accent uppercase font-black tracking-widest font-mono">Round of 32</span>
                <p className="text-[8px] text-[#6B7A99] uppercase font-bold leading-none mt-0.5">16 Matchups</p>
              </div>

              <div className="space-y-3">
                {r32Matches.map((m, idx) => {
                  const hT = allTeams.find(t => t.id === m.team_home_id);
                  const aT = allTeams.find(t => t.id === m.team_away_id);
                  const isEditing = editingMatchId === m.id;

                  return (
                    <div key={m.id} className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-lg p-2 space-y-1.5 relative overflow-hidden shadow">
                      {/* Home */}
                      <div className="flex items-center justify-between text-xs font-semibold leading-none text-[#E8EDF5]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Flag flag={hT?.flag || '🏴'} slug={hT?.id || ''} name={hT?.name || ''} size="xs" />
                          <span className="truncate max-w-[110px]">{hT?.name || 'Qualified Team'}</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={scoreHomeInput}
                            onChange={(e) => setScoreHomeInput(parseInt(e.target.value) || 0)}
                            className="w-8 bg-[#07101E] text-center border border-accent/25 rounded text-xs font-bold text-accent"
                          />
                        ) : (
                          <span className="font-mono text-accent font-bold">{m.score_home ?? '-'}</span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex items-center justify-between text-xs font-semibold leading-none text-[#E8EDF5]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Flag flag={aT?.flag || '🏴'} slug={aT?.id || ''} name={aT?.name || ''} size="xs" />
                          <span className="truncate max-w-[110px]">{aT?.name || 'Qualified Team'}</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={scoreAwayInput}
                            onChange={(e) => setScoreAwayInput(parseInt(e.target.value) || 0)}
                            className="w-8 bg-[#07101E] text-center border border-accent/25 rounded text-xs font-bold text-accent"
                          />
                        ) : (
                          <span className="font-mono text-accent font-bold">{m.score_away ?? '-'}</span>
                        )}
                      </div>

                      {/* Score editor trigger button */}
                      <div className="border-t border-[#6B7A99]/10 pt-1 flex justify-between items-center text-[8px] text-[#6B7A99] font-mono leading-none">
                        <span>Game #{idx + 1}</span>
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveBracketScore(m.id)}
                            className="text-green-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Save className="h-2.5 w-2.5" /> Save
                          </button>
                        ) : (
                          <button
                            onClick={() => openBracketEdit(m)}
                            className="text-accent font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Edit3 className="h-2.5 w-2.5" /> Score
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. ROUND OF 16 (8 matches) */}
            <div className="w-64 space-y-8 shrink-0 py-8">
              <div className="border-b border-[#6B7A99]/20 pb-1.5 text-center bg-[#111C2E] py-2 rounded-t-lg">
                <span className="text-[10px] text-accent uppercase font-black tracking-widest font-mono">Round of 16</span>
                <p className="text-[8px] text-[#6B7A99] uppercase font-bold leading-none mt-0.5">8 Matchups</p>
              </div>

              <div className="space-y-10">
                {r16Matches.map((m, idx) => {
                  const hT = allTeams.find(t => t.id === m.team_home_id);
                  const aT = allTeams.find(t => t.id === m.team_away_id);
                  const isEditing = editingMatchId === m.id;

                  return (
                    <div key={m.id} className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-lg p-2.5 space-y-1.5 shadow">
                      <div className="flex items-center justify-between text-xs font-semibold leading-none">
                        <span className="truncate max-w-[120px]">{hT?.name || 'R32 Winner'}</span>
                        {isEditing ? (
                          <input type="number" value={scoreHomeInput} onChange={(e)=>setScoreHomeInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E] rounded text-xs text-accent" />
                        ) : (
                          <span className="font-mono text-accent">{m.score_home ?? '-'}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold leading-none">
                        <span className="truncate max-w-[120px]">{aT?.name || 'R32 Winner'}</span>
                        {isEditing ? (
                          <input type="number" value={scoreAwayInput} onChange={(e)=>setScoreAwayInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E] rounded text-xs text-accent" />
                        ) : (
                          <span className="font-mono text-accent">{m.score_away ?? '-'}</span>
                        )}
                      </div>
                      <div className="border-t border-[#6B7A99]/10 pt-1 flex justify-between items-center text-[8px] text-[#6B7A99] font-mono leading-none">
                        <span>R16 Match #{idx + 1}</span>
                        {isEditing ? (
                          <button onClick={()=>handleSaveBracketScore(m.id)} className="text-green-400"><Save className="h-2.5 w-2.5" /> Save</button>
                        ) : (
                          <button onClick={()=>openBracketEdit(m)} className="text-accent"><Edit3 className="h-2.5 w-2.5" /> Edit</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. QUARTERFINALS (4 matches) */}
            <div className="w-64 space-y-16 shrink-0 py-16">
              <div className="border-b border-[#6B7A99]/20 pb-1.5 text-center bg-[#111C2E] py-2 rounded-t-lg">
                <span className="text-[10px] text-accent uppercase font-black tracking-widest font-mono">Quarterfinals</span>
                <p className="text-[8px] text-[#6B7A99] uppercase font-bold leading-none mt-0.5">4 Matchups</p>
              </div>

              <div className="space-y-24">
                {qfMatches.map((m, idx) => {
                  const hT = allTeams.find(t => t.id === m.team_home_id);
                  const aT = allTeams.find(t => m.team_away_id === t.id);
                  const isEditing = editingMatchId === m.id;

                  return (
                    <div key={m.id} className="bg-[#111C2E] border border-accent/20 rounded-lg p-3 space-y-2 shadow">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-bold text-[#E8EDF5]">{hT?.name || 'R16 Winner'}</span>
                        {isEditing ? (
                          <input type="number" value={scoreHomeInput} onChange={(e)=>setScoreHomeInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E]" />
                        ) : (
                          <span className="font-mono text-accent font-black">{m.score_home ?? '-'}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-bold text-[#E8EDF5]">{aT?.name || 'R16 Winner'}</span>
                        {isEditing ? (
                          <input type="number" value={scoreAwayInput} onChange={(e)=>setScoreAwayInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E]" />
                        ) : (
                          <span className="font-mono text-accent font-black">{m.score_away ?? '-'}</span>
                        )}
                      </div>
                      <div className="border-t border-[#6B7A99]/10 pt-1.5 flex justify-between items-center text-[8px] text-[#6B7A99] font-mono font-bold uppercase">
                        <span>QF #{idx + 1}</span>
                        {isEditing ? (
                          <button onClick={()=>handleSaveBracketScore(m.id)} className="text-green-400 font-extrabold flex items-center"><Save className="h-2.5 w-2.5" /> Save</button>
                        ) : (
                          <button onClick={()=>openBracketEdit(m)} className="text-accent font-extrabold flex items-center"><Edit3 className="h-2.5 w-2.5" /> Score</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. SEMIFINALS (2 matches) */}
            <div className="w-64 space-y-24 shrink-0 py-24">
              <div className="border-b border-[#6B7A99]/20 pb-1.5 text-center bg-[#111C2E] py-2 rounded-t-lg">
                <span className="text-[10px] text-accent uppercase font-black tracking-widest font-mono">Semifinals</span>
                <p className="text-[8px] text-[#6B7A99] uppercase font-bold leading-none mt-0.5">2 Matchups</p>
              </div>

              <div className="space-y-48">
                {sfMatches.map((m, idx) => {
                  const hT = allTeams.find(t => t.id === m.team_home_id);
                  const aT = allTeams.find(t => m.team_away_id === t.id);
                  const isEditing = editingMatchId === m.id;

                  return (
                    <div key={m.id} className="bg-gradient-to-r from-[#111C2E] to-[#1F304A] border-l-4 border-accent p-4 space-y-2.5 rounded shadow-lg">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="font-black text-[#E8EDF5]">{hT?.name || 'QF Winner'}</span>
                        {isEditing ? (
                          <input type="number" value={scoreHomeInput} onChange={(e)=>setScoreHomeInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E] text-accent" />
                        ) : (
                          <span className="font-mono text-accent font-black text-base">{m.score_home ?? '-'}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="font-black text-[#E8EDF5]">{aT?.name || 'QF Winner'}</span>
                        {isEditing ? (
                          <input type="number" value={scoreAwayInput} onChange={(e)=>setScoreAwayInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E] text-accent" />
                        ) : (
                          <span className="font-mono text-accent font-black text-base">{m.score_away ?? '-'}</span>
                        )}
                      </div>
                      <div className="border-t border-[#6B7A99]/10 pt-2 flex justify-between items-center text-[9px] text-accent font-mono font-bold uppercase tracking-wider">
                        <span>SF #{idx + 1} matches</span>
                        {isEditing ? (
                          <button onClick={()=>handleSaveBracketScore(m.id)} className="text-green-400 font-extrabold flex items-center gap-0.5"><Save className="h-3 w-3" /> Save</button>
                        ) : (
                          <button onClick={()=>openBracketEdit(m)} className="text-accent font-extrabold flex items-center gap-0.5"><Edit3 className="h-3 w-3" /> Manage</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. INDIVIDUAL CHAMPIONSHIP MATCHUP */}
            <div className="w-64 space-y-36 shrink-0 py-36">
              <div className="border-b-2 border-accent pb-1.5 text-center bg-accent/25 py-2.5 rounded-t-lg">
                <span className="text-xs text-accent uppercase font-black tracking-widest font-mono">Championship Final</span>
                <p className="text-[9px] text-[#E8EDF5] uppercase font-bold leading-none mt-1">★ Tophy Game ★</p>
              </div>

              {finalMatch ? (
                <div className="bg-gradient-to-br from-[#111C2E] via-[#111C2E] to-[#1F304A] border-2 border-accent p-4.5 rounded-xl shadow-2xl relative glow-gold space-y-3">
                  <div className="flex items-center justify-between text-sm font-black">
                    <span className="text-[#E8EDF5]">{allTeams.find(t => t.id === finalMatch.team_home_id)?.name || 'Semifinal Winner'}</span>
                    {editingMatchId === finalMatch.id ? (
                      <input type="number" value={scoreHomeInput} onChange={(e)=>setScoreHomeInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E] font-bold text-accent" />
                    ) : (
                      <span className="font-mono text-accent text-lg">{finalMatch.score_home ?? '-'}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm font-black">
                    <span className="text-[#E8EDF5]">{allTeams.find(t => t.id === finalMatch.team_away_id)?.name || 'Semifinal Winner'}</span>
                    {editingMatchId === finalMatch.id ? (
                      <input type="number" value={scoreAwayInput} onChange={(e)=>setScoreAwayInput(parseInt(e.target.value)||0)} className="w-8 text-center bg-[#07101E] font-bold text-accent" />
                    ) : (
                      <span className="font-mono text-accent text-lg">{finalMatch.score_away ?? '-'}</span>
                    )}
                  </div>
                  <div className="border-t border-accent/20 pt-2 flex justify-between items-center text-[10px] text-[#6B7A99] font-mono leading-none">
                    <span className="text-[#6B7A99] uppercase font-bold">Venue NY/NJ</span>
                    {editingMatchId === finalMatch.id ? (
                      <button onClick={()=>handleSaveBracketScore(finalMatch.id)} className="text-green-400 font-black"><Save className="h-3.5 w-3.5" /> Save</button>
                    ) : (
                      <button onClick={()=>openBracketEdit(finalMatch)} className="text-accent font-black"><Edit3 className="h-3.5 w-3.5 animate-pulse" /> Edit Score</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-[#6B7A99] rounded border border-dashed border-[#6B7A99]/20 p-4">
                  Finalizing bracket positions...
                </div>
              )}
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
