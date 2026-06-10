/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { apiFetch } from '../lib/apiFetch';
import {
  ArrowLeft, Shield, Users, Trophy, Calendar, Sparkles, Star, GitCompare, UserCheck, Play
} from 'lucide-react';
import { Team, Player } from '../types';
import Flag from '../components/Flag';

interface GroupMatch {
  year: number;
  stage: string;
  scorer: string;
}

interface TeamDetailData {
  team: Team;
  squad: Player[];
  stats: {
    avg_rating: number;
    min_age: number;
    max_age: number;
    elite_league_count: number;
  };
  charts: {
    age_distribution: Array<{ bucket: string; count: number }>;
    position_distribution: Array<{ position: string; count: number }>;
    rating_distribution: Array<{ name: string; rating: number; position: string }>;
  };
  coach: {
    name: string;
    nationality: string;
    appointed_year: number;
    tactical_style: string;
    previous_role: string;
  };
  key_player: Player | null;
  history: {
    first_appearance: number;
    last_five: GroupMatch[];
  };
}

export default function TeamDetail() {
  const { countrySlug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<TeamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Squad sorting parameters
  const [squadSortBy, setSquadSortBy] = useState<'RATING' | 'AGE' | 'POSITION'>('RATING');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    const fetchTeamDetail = async () => {
      if (!countrySlug) return;
      try {
      const json = await apiFetch(`/api/teams/${countrySlug?.toLowerCase()}`);
if (json.status === 'ok') {
  setData(json.data);
}
      } catch (err) {
        console.error('Error fetching team detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamDetail();
  }, [countrySlug]);

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-[#6B7A99] animate-pulse">
        Retrieving team datasets, player ratings, and compiling analytical charts...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-red-400">
        Country slug error. No team matches slug parameter.
      </div>
    );
  }

  const { team, squad, stats, charts, coach, key_player, history } = data;

  // Sorting handlers for roster list
  const handleSort = (field: 'RATING' | 'AGE' | 'POSITION') => {
    if (squadSortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSquadSortBy(field);
      setSortOrder('DESC');
    }
  };

  const getSortedRoster = () => {
  const roster = data?.real_squad?.length ? data.real_squad : squad;
  const sorted = [...roster];
  sorted.sort((a: any, b: any) => {
    if (squadSortBy === 'AGE') {
      return sortOrder === 'ASC' 
        ? (a.age || 0) - (b.age || 0) 
        : (b.age || 0) - (a.age || 0);
    }
    if (squadSortBy === 'POSITION') {
      const weights: Record<string, number> = { GK: 1, DF: 2, MF: 3, FW: 4 };
      const wA = weights[a.position] || 9;
      const wB = weights[b.position] || 9;
      return sortOrder === 'ASC' ? wA - wB : wB - wA;
    }
    return sortOrder === 'ASC' 
      ? (a.rating || 0) - (b.rating || 0) 
      : (b.rating || 0) - (a.rating || 0);
  });
  return sorted;
};

  // Color mappings for positional rows
  const getPositionStyles = (pos: 'GK' | 'DF' | 'MF' | 'FW') => {
    switch (pos) {
      case 'GK': return 'border-l-4 border-amber-500/80 bg-amber-500/5 text-amber-100 hover:bg-amber-500/10';
      case 'DF': return 'border-l-4 border-blue-500/80 bg-blue-500/5 text-blue-100 hover:bg-blue-500/10';
      case 'MF': return 'border-l-4 border-green-500/80 bg-green-500/5 text-green-100 hover:bg-green-500/10';
      case 'FW': return 'border-l-4 border-red-500/80 bg-red-500/5 text-red-100 hover:bg-red-500/10';
    }
  };

  const positionColors = {
    GK: '#F5A623',
    DF: '#3b82f6',
    MF: '#10b981',
    FW: '#ef4444'
  };

  // Recharts theme palettes
  const PIE_COLORS = ['#F5A623', '#3b82f6', '#10b981', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10 pb-16">
      
      {/* breadcrumbs & actions */}
      <div className="flex h-10 items-center justify-between border-b border-[#6B7A99]/15 pb-2">
        <Link
          to="/teams"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teams Directory
        </Link>
        <button
          onClick={() => navigate(`/compare?team1=${team.slug}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent/15 border border-accent/35 text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-primary transition-all active:scale-95 cursor-pointer"
        >
          <GitCompare className="h-4 w-4" />
          Compare Core Roster
        </button>
      </div>

      {/* A. TEAM HEADER BANNER */}
      <section className="bg-gradient-to-r from-[#111C2E] to-[#1F304A]/60 rounded-2xl border border-[#6B7A99]/15 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-[350px] h-[350px] bg-accent/5 rounded-full blur-3xl z-0 pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <Flag flag={team.flag} slug={team.id} name={team.name} size="xl" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase bg-accent text-primary px-2.5 py-0.5 rounded-md font-extrabold leading-none">
                Group {team.group_letter}
              </span>
              <span className="text-xs text-[#6B7A99] font-bold uppercase tracking-wider">
                {team.confederation} Federation
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-wider text-[#E8EDF5] leading-none uppercase">
              {team.name}
            </h1>
            <p className="text-xs text-[#6B7A99] font-semibold uppercase tracking-wider leading-none">
              Head coach: <span className="text-[#E8EDF5]">{team.coach_name}</span> ({team.coach_nationality})
            </p>
          </div>
        </div>

        {/* Win circular meter */}
        <div className="shrink-0 flex items-center gap-4 bg-[#0A1628]/80 p-4 rounded-xl border border-[#6B7A99]/15 relative z-10 w-full sm:w-auto sm:inline-flex shadow-lg h-28">
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-full w-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-[#07101E] fill-none"
                strokeWidth="4.5"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-accent fill-none"
                strokeWidth="4.5"
                strokeDasharray={163}
                strokeDashoffset={163 - team.win_probability * 7} // scaled
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono font-black text-xs text-accent leading-none">
              {team.win_probability}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest block font-mono">Win Probability</span>
            <span className="text-sm font-display font-bold text-[#E8EDF5] tracking-wider block uppercase mt-0.5">Title Expectancy</span>
            <span className="text-[9px] text-accent font-semibold block leading-none">Standard Seeding Tier</span>
          </div>
        </div>
      </section>

      {/* B. KEY STATS ROW */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 rounded-xl text-center space-y-1">
          <span className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono block">Squad Avg Rating</span>
          <span className="text-2xl font-display font-black text-[#E8EDF5] tracking-wider block font-mono">
            {stats.avg_rating}
          </span>
          <span className="text-[9px] text-green-400 font-bold block uppercase leading-none">Roster Mean</span>
        </div>

        <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 rounded-xl text-center space-y-1">
          <span className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono block">Youngest Cadet</span>
          <span className="text-2xl font-display font-black text-[#E8EDF5] tracking-wider block font-mono">
            {stats.min_age} <span className="text-xs text-[#6B7A99] font-sans">Yrs</span>
          </span>
          <span className="text-[9px] text-accent font-bold block uppercase leading-none">Min Age Limit</span>
        </div>

        <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 rounded-xl text-center space-y-1">
          <span className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono block">Oldest Veteran</span>
          <span className="text-2xl font-display font-black text-[#E8EDF5] tracking-wider block font-mono">
            {stats.max_age} <span className="text-xs text-[#6B7A99] font-sans">Yrs</span>
          </span>
          <span className="text-[9px] text-accent-red font-bold block uppercase leading-none">Max Age Limit</span>
        </div>

        <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 rounded-xl text-center space-y-1">
          <span className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono block">Top 5 League Players</span>
          <span className="text-2xl font-display font-black text-[#E8EDF5] tracking-wider block font-mono">
            {stats.elite_league_count} <span className="text-xs text-[#6B7A99] font-sans">/ 26</span>
          </span>
          <span className="text-[9px] text-blue-400 font-bold block uppercase leading-none">Elite Club Giants</span>
        </div>
      </section>

      {/* C. FULL ROSTER TABLE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#6B7A99]/15 pb-2">
          <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-[#6B7A99]" />
            Official 26-Player Squad
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B7A99] uppercase font-bold text-[9px] font-mono leading-none">Roster Sort:</span>
            <div className="flex bg-[#111C2E] border border-[#6B7A99]/25 p-1 rounded-md shrink-0">
              
              <button
                onClick={() => handleSort('AGE')}
                className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase leading-none ${
                    squadSortBy === 'AGE' ? 'bg-accent text-primary' : 'text-[#6B7A99]'
                }`}
              >
                Age {squadSortBy === 'AGE' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('POSITION')}
                className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase leading-none ${
                    squadSortBy === 'POSITION' ? 'bg-accent text-primary' : 'text-[#6B7A99]'
                }`}
              >
                Pos {squadSortBy === 'POSITION' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Responsive table */}
        <div className="overflow-x-auto bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl shadow-xl">
          <table className="w-full text-xs text-left text-[#E8EDF5]">
            <thead>
  <tr className="bg-[#0A1628] border-b border-[#6B7A99]/15 uppercase tracking-widest text-[9px] text-[#6B7A99] font-bold font-mono">
    <th className="px-4 py-3 text-center w-12">#</th>
    <th className="px-4 py-3">Player Name</th>
    <th className="px-4 py-3 text-center">Position</th>
    <th className="px-4 py-3 text-center">Age</th>
  </tr>
</thead>
            <tbody>
              {getSortedRoster().map((p: any) => (
  <tr key={p.id} className={`...`}>
  <td className="px-4 py-3.5 text-center font-mono text-[#6B7A99]">{p.shirt_number || '-'}</td>
  <td className="px-4 py-3.5 font-bold text-sm tracking-wide text-[#E8EDF5]">{p.name}</td>
  <td className="px-4 py-3.5 text-center font-mono">
    <span className="px-2 py-0.5 bg-[#07101E] rounded font-bold text-[10px]" style={{ color: positionColors[p.position] }}>
      {p.position}
    </span>
  </td>
  <td className="px-4 py-3.5 text-center font-mono text-[#E8EDF5]/80">{p.age}</td>
</tr>
))}
            </tbody>
          </table>
        </div>
      </section>

      {/* D. VISUALIZATIONS SECTION (3 charts) */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest">
          Squad Statistical Visualizations
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Age Distribution */}
          <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 rounded-xl flex flex-col justify-between shadow-lg h-72">
            <span className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono mb-2">Age Distribution Grid</span>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.age_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F304A" />
                  <XAxis dataKey="bucket" stroke="#6B7A99" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6B7A99" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111C2E', borderColor: '#6B7A99', fontSize: 11 }} />
                  <Bar dataKey="count" fill="#F5A623" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Position Breakdown */}
          <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 rounded-xl flex flex-col justify-between shadow-lg h-72">
            <span className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono mb-2">Position Breakdown Donut</span>
            <div className="flex-1 min-h-0 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.position_distribution}
                    key="position"
                    dataKey="count"
                    nameKey="position"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {charts.position_distribution.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111C2E', borderColor: '#6B7A99', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend overlay for donut */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 text-[9px] font-mono font-bold uppercase tracking-wide">
                <span className="text-[#F5A623]">GK: {charts.position_distribution.find(c => c.position === 'GK')?.count}</span>
                <span className="text-[#3b82f6]">DF: {charts.position_distribution.find(c => c.position === 'DF')?.count}</span>
                <span className="text-[#10b981]">MF: {charts.position_distribution.find(c => c.position === 'MF')?.count}</span>
                <span className="text-[#ef4444]">FW: {charts.position_distribution.find(c => c.position === 'FW')?.count}</span>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-4 rounded-xl flex flex-col justify-between shadow-lg h-72">
            <span className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono mb-2">Top 8 Stars Distribution Radar</span>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.rating_distribution.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F304A" />
                  <XAxis type="number" domain={[70, 100]} stroke="#6B7A99" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" stroke="#6B7A99" tick={{ fontSize: 8 }} width={65} />
                  <Tooltip contentStyle={{ backgroundColor: '#111C2E', borderColor: '#6B7A99', fontSize: 11 }} />
                  <Bar dataKey="rating" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </section>

      {/* E & F. COACH PROFILE CARD & TOURNAMENT ANALYSIS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coach profile */}
        <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl p-5 shadow-lg space-y-4 h-full">
          <div className="border-b border-[#6B7A99]/10 pb-2 flex items-center gap-2">
            <UserCheck className="h-4.5 w-4.5 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8EDF5]">Technical Coach Profile</h3>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-lg font-display text-accent tracking-wider font-extrabold uppercase leading-none">{coach.name}</span>
              <span className="block text-[10px] text-[#6B7A99] uppercase font-mono mt-0.5">Appointed: {coach.appointed_year} • National Tactician</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="block text-[#6B7A99] uppercase text-[9px] font-bold">Nationality:</span>
                <span className="font-semibold text-[#E8EDF5]">{coach.nationality}</span>
              </div>
              <div>
                <span className="block text-[#6B7A99] uppercase text-[9px] font-bold">Previous Role:</span>
                <span className="font-semibold text-[#E8EDF5]">{coach.previous_role}</span>
              </div>
              <div className="border-t border-[#6B7A99]/10 pt-2.5">
                <span className="block text-accent uppercase text-[9px] font-bold">Tactical Alignment:</span>
                <p className="text-[#E8EDF5] tracking-wide mt-1 italic leading-relaxed">
                  "{coach.tactical_style}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament expectations analysis */}
        <div className="lg:col-span-2 bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl p-5 shadow-lg space-y-5">
          <div className="border-b border-[#6B7A99]/10 pb-2 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8EDF5]">Tournament Outlook Analysis</h3>
          </div>

          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-[#E8EDF5]/90 font-sans">
              {team.win_factors}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-[#6B7A99]/10 pt-4">
              <div>
                <span className="text-[#6B7A99] uppercase text-[9px] font-bold block">Best Case Potential</span>
                <span className="text-base text-accent font-bold tracking-tight uppercase block mt-1">{team.best_case}</span>
              </div>
              <div>
                <span className="text-[#6B7A99] uppercase text-[9px] font-bold block">Realistic Target</span>
                <span className="text-base text-green-400 font-bold tracking-tight uppercase block mt-1">{team.realistic_target}</span>
              </div>
              {key_player && (
                <div className="col-span-2 md:col-span-1">
                  <span className="text-[#6B7A99] uppercase text-[9px] font-bold block">Key Outfield Star</span>
                  <span className="text-xs text-[#E8EDF5] font-extrabold truncate block mt-1" title={key_player.name}>
                    {key_player.name} ({key_player.rating})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* G. HISTORICAL PERFORMANCE TABLE */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-[#C8102E]" />
          Historic World Cup Appearance Performance
        </h2>

        <div className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#6B7A99] uppercase font-bold text-[9px] tracking-widest">Inaugural Appearance:</span>
            <span className="text-[#E8EDF5] font-mono font-black text-sm uppercase bg-[#07101E] px-2.5 py-0.5 rounded border border-[#6B7A99]/10 leading-none">
              {history.first_appearance} World Cup
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center font-semibold text-[#E8EDF5]">
              <thead>
                <tr className="border-b border-[#6B7A99]/15 uppercase tracking-widest text-[9px] text-[#6B7A99] font-bold font-mono">
                  <th className="py-2.5 text-left">Year</th>
                  <th className="py-2.5 text-center">Stage Reached</th>
                  <th className="py-2.5 text-right">Top National Scorer</th>
                </tr>
              </thead>
              <tbody>
                {history.last_five.map((entry) => (
                  <tr key={entry.year} className="border-b last:border-none border-[#6B7A99]/10">
                    <td className="py-3 text-left font-mono font-bold text-accent">{entry.year}</td>
                    <td className="py-3 text-center uppercase tracking-wide text-[11px] font-sans font-extrabold">{entry.stage}</td>
                    <td className="py-3 text-right text-[#E8EDF5]/90">{entry.scorer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
