/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Users, LayoutGrid, Calendar, HelpCircle, ArrowRight } from 'lucide-react';
import { Team, Player, Group } from '../types';
import Flag from '../components/Flag';
import { fetchCompetitionData, getFlagEmoji } from '../lib/footballApi';
import Fuse from 'fuse.js';

interface SearchPlayerResult extends Player {
  team_name: string;
  team_flag: string;
  team_slug: string;
}

const mapPosition = (pos: string): 'GK' | 'DF' | 'MF' | 'FW' => {
  if (!pos) return 'MF';
  const p = pos.toLowerCase();
  if (p.includes('goal') || p === 'gk') return 'GK';
  if (p.includes('def') || p === 'df') return 'DF';
  if (p.includes('mid') || p === 'mf') return 'MF';
  if (p.includes('off') || p.includes('forw') || p.includes('stri') || p === 'fw') return 'FW';
  return 'MF';
};

interface SearchResultsData {
  teams: Team[];
  players: SearchPlayerResult[];
  groups: any[]; // Mapped to support dynamic nickname or live attributes
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultsData>({ teams: [], players: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [preFetchedData, setPreFetchedData] = useState<{
    teams: Team[];
    players: SearchPlayerResult[];
    groups: any[];
  } | null>(null);

  // Sync state with url parameter
  const urlQuery = searchParams.get('q') || '';

  useEffect(() => {
    const preFetchAll = async () => {
      setLoading(true);
      try {
        const [teamsRes, standingsRes] = await Promise.all([
          fetchCompetitionData('/teams'),
          fetchCompetitionData('/standings')
        ]);

        const rawTeams = teamsRes.data?.teams || [];
        const code = teamsRes.code;

        // Map teams
        const mappedTeams: Team[] = rawTeams.map((t: any, index: number) => ({
          id: String(t.id),
          name: t.shortName || t.name,
          slug: (t.shortName || t.name).toLowerCase().replace(/\s+/g, '-'),
          group_letter: String.fromCharCode(65 + (index % 12)),
          coach_name: t.coach?.name || 'Unknown Coach',
          coach_nationality: t.coach?.nationality || 'Unknown',
          confederation: code === 'WC' ? 'FIFA' : 'UEFA',
          win_probability: 2.0,
          win_factors: 'Live roster squad',
          fifa_ranking: index + 1,
          best_case: 'Knockout round',
          realistic_target: 'Regular season',
          flag: getFlagEmoji(t.name, t.tla)
        }));

        // Map players
        const mappedPlayers: SearchPlayerResult[] = [];
        rawTeams.forEach((t: any) => {
          const squad = t.squad || [];
          squad.forEach((p: any) => {
            const birthYear = p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : 1998;
            const computedAge = 2026 - birthYear;
            
            mappedPlayers.push({
              id: String(p.id),
              name: p.name,
              position: mapPosition(p.position),
              age: computedAge > 15 && computedAge < 45 ? computedAge : 26,
              shirt_number: p.shirtNumber || (p.id % 98) + 1,
              club: t.shortName || t.name,
              rating: 80 + (p.id % 15),
              team_id: String(t.id),
              team_name: t.shortName || t.name,
              team_flag: getFlagEmoji(t.name, t.tla),
              team_slug: (t.shortName || t.name).toLowerCase().replace(/\s+/g, '-')
            });
          });
        });

        // Map groups
        const letters = code === 'PL' ? ['A', 'B', 'C', 'D', 'E'] : ['A','B','C','D','E','F','G','H','I','J','K','L'];
        const mappedGroups = letters.map(letter => ({
          id: letter.toLowerCase(),
          letter: letter,
          name: `Group ${letter}`,
          nickname: code === 'PL' ? `English League Div ${letter}` : `Drawing Pool ${letter}`,
          played: 0,
          teams: mappedTeams.filter(t => t.group_letter === letter)
        }));

        setPreFetchedData({
          teams: mappedTeams,
          players: mappedPlayers,
          groups: mappedGroups
        });

      } catch (err) {
        console.error('Failed to pre-fetch search index', err);
      } finally {
        setLoading(false);
      }
    };

    preFetchAll();
  }, []);

  useEffect(() => {
    setQuery(urlQuery);
    if (urlQuery.trim() && preFetchedData) {
      handleSearch(urlQuery);
    } else {
      setResults({ teams: [], players: [], groups: [] });
    }
  }, [urlQuery, preFetchedData]);

  const handleSearch = (term: string) => {
    if (!preFetchedData) return;

    const optionsTeams = {
      keys: ['name', 'coach_name', 'confederation'],
      threshold: 0.35
    };
    const optionsPlayers = {
      keys: ['name', 'position', 'club', 'nationality'],
      threshold: 0.35
    };
    const optionsGroups = {
      keys: ['letter', 'name', 'nickname'],
      threshold: 0.2
    };

    const fuseTeams = new Fuse(preFetchedData.teams, optionsTeams);
    const fusePlayers = new Fuse(preFetchedData.players, optionsPlayers);
    const fuseGroups = new Fuse(preFetchedData.groups, optionsGroups);

    const matchTeams = fuseTeams.search(term).map(r => r.item);
    const matchPlayers = fusePlayers.search(term).map(r => r.item);
    const matchGroups = fuseGroups.search(term).map(r => r.item);

    setResults({
      teams: matchTeams,
      players: matchPlayers,
      groups: matchGroups
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const hasResults = results.teams.length > 0 || results.players.length > 0 || results.groups.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10 pb-16">
      
      {/* Header */}
      <div className="text-center md:text-left border-b border-[#6B7A99]/15 pb-4">
        <h1 className="text-4xl font-display font-black text-[#E8EDF5] tracking-widest uppercase flex items-center justify-center md:justify-start gap-2.5">
          <SearchIcon className="h-8 w-8 text-accent shrink-0" />
          Unified Tournament Search
        </h1>
        <p className="text-xs text-[#6B7A99] font-medium uppercase tracking-wide mt-1">
          Query player names, qualified head coaches, representative federations, or specific drawing pools
        </p>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 sm:p-5 rounded-xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type player, team, coach..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#07101E] border border-[#6B7A99]/25 rounded-md py-3 pl-11 pr-4 text-sm text-[#E8EDF5] focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <SearchIcon className="absolute left-4 top-3.5 h-4 w-4 text-[#6B7A99]" />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-accent text-primary font-bold text-sm uppercase tracking-wider rounded-md hover:bg-amber-300 transition-all cursor-pointer shadow-md glow-gold text-center sm:w-auto"
        >
          Search
        </button>
      </form>

      {/* Search outcome panels */}
      {loading ? (
        <div className="text-center text-xs text-[#6B7A99] py-12 animate-pulse">
          Searching through live rosters indexes...
        </div>
      ) : !urlQuery.trim() ? (
        <div className="text-center text-xs text-[#6B7A99] py-12 border border-dashed border-[#6B7A99]/20 rounded-xl">
          Enter a search phrase above to search individual stars or nations.
        </div>
      ) : !hasResults ? (
        <div className="text-center text-xs text-[#6B7A99] py-12 border border-dashed border-[#6B7A99]/20 rounded-xl space-y-2">
          <p className="font-bold text-[#E8EDF5]">No matching records found for "{urlQuery}"</p>
          <p className="max-w-md mx-auto leading-relaxed">
            Try looking up standard players like **"Messi"**, **"Mbappe"**, **"Yamal"**, **"Pulisic"**, or qualified tacticians like **"Tuchel"** or **"Pochettino"**!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Segment 1: Teams */}
          {results.teams.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2 border-b border-[#6B7A99]/15 pb-1">
                <Users className="h-4 w-4 text-accent" />
                Matching Qualified Teams ({results.teams.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.teams.map((t) => (
                  <Link
                    key={t.id}
                    to={`/teams/${t.slug}`}
                    className="glass-effect p-4 rounded-xl border border-[#6B7A99]/15 hover:border-accent/40 active:scale-98 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Flag flag={t.flag} slug={t.slug} name={t.name} size="lg" />
                      <div>
                        <h3 className="text-sm font-bold text-[#E8EDF5] uppercase leading-none">{t.name}</h3>
                        <span className="text-[10px] text-[#6B7A99] font-semibold tracking-wider mt-1 block uppercase">
                          Group {t.group_letter} • {t.confederation}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-accent shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Segment 2: Match players */}
          {results.players.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2 border-b border-[#6B7A99]/15 pb-1">
                <Users className="h-4 w-4 text-green-400" />
                Matching Roster Players ({results.players.length})
              </h2>

              <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl overflow-hidden shadow-lg divide-y divide-[#6B7A99]/10">
                {results.players.map((p) => (
                  <Link
                    key={p.id}
                    to={`/teams/${p.team_slug}`}
                    className="flex h-14 items-center px-4 justify-between hover:bg-[#1F304A]/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Flag flag={p.team_flag} slug={p.team_slug} name={p.team_name} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-[#E8EDF5]">{p.name}</span>
                        <span className="block text-[9px] text-[#6B7A99] uppercase font-mono mt-0.5">
                          {p.position} • {p.club}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div>
                        <span className="block text-[8px] text-[#6B7A99] uppercase font-mono">Rating</span>
                        <span className="text-xs font-black font-mono text-accent leading-none">{p.rating}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-accent" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Segment 3: Groups */}
          {results.groups.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2 border-b border-[#6B7A99]/15 pb-1">
                <LayoutGrid className="h-4 w-4 text-[#6B7A99]" />
                Matching Group Pools ({results.groups.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.groups.map((g) => (
                  <Link
                    key={g.id}
                    to={`/groups/${g.letter.toLowerCase()}`}
                    className="glass-effect p-4 rounded-xl border border-[#6B7A99]/15 hover:border-accent/40 active:scale-98 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-[#E8EDF5] uppercase leading-none">Group {g.letter}</h3>
                      <span className="text-[10px] text-accent font-semibold tracking-widest mt-1 block uppercase font-mono">
                        "{g.nickname}"
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-accent shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
