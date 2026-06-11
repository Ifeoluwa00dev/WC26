/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { apiFetch } from '../lib/apiFetch';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { GitCompare, Trophy, Star, ShieldAlert, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { Team, Player } from '../types';
import Flag from '../components/Flag';

interface ComputedMetrics {
  attack: number;
  midfield: number;
  defense: number;
  depth: number;
  experience: number;
  star_power: number;
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Picked teams
  const [team1Slug, setTeam1Slug] = useState('');
  const [team2Slug, setTeam2Slug] = useState('');

  // Team details
  const [team1Data, setTeam1Data] = useState<{ team: Team; squad: Player[]; metrics: ComputedMetrics } | null>(null);
  const [team2Data, setTeam2Data] = useState<{ team: Team; squad: Player[]; metrics: ComputedMetrics } | null>(null);

  // Fetch all teams first
  useEffect(() => {
    const fetchTeams = async () => {
      try {
       const json = await apiFetch('/api/teams');
if (json.status === 'ok') {
          setAllTeams(json.data);
        }
      } catch (err) {
        console.error('Error fetching teams', err);
      }
    };
    fetchTeams();
  }, []);

  // Update picked Slugs from URL params
  useEffect(() => {
    if (allTeams.length > 0) {
      const t1 = searchParams.get('team1') || 'esp'; // Default Spain
      const t2 = searchParams.get('team2') || 'arg'; // Default Argentina
      setTeam1Slug(t1);
      setTeam2Slug(t2);
    }
  }, [searchParams, allTeams]);

  // Compute metrics from squad data
  const computeMetrics = (squad: Player[], team: Team): ComputedMetrics => {
    const forwards = squad.filter(p => p.position === 'FW');
    const midfields = squad.filter(p => p.position === 'MF');
    const defenders = squad.filter(p => p.position === 'DF');

    const avg = (arr: Player[]) => arr.length > 0 ? (arr.reduce((sum, p) => sum + p.rating, 0) / arr.length) : 75;

    // Depth is calculated from lowest 13 players
    const sortedRatings = [...squad].sort((a, b) => a.rating - b.rating);
    const bottomAvg = sortedRatings.slice(0, 13);
    const depthVal = avg(bottomAvg);

    // Experience: average age scaled
    const ageAvg = squad.length > 0 ? (squad.reduce((sum, p) => sum + p.age, 0) / squad.length) : 26;

    // Star power: max player rating
    const maxVal = squad.length > 0 ? Math.max(...squad.map(p => p.rating)) : 80;

    return {
      attack: parseFloat(avg(forwards).toFixed(1)),
      midfield: parseFloat(avg(midfields).toFixed(1)),
      defense: parseFloat(avg(defenders).toFixed(1)),
      depth: parseFloat(depthVal.toFixed(1)),
      experience: parseFloat(ageAvg.toFixed(1)),
      star_power: maxVal
    };
  };

  // Fetch individual team detail for comparisons
  useEffect(() => {
  const fetchComparisonData = async () => {
    if (!team1Slug || !team2Slug) return;
    setLoading(true);

    try {
      const [json1, json2] = await Promise.all([
        apiFetch(`/api/teams/${team1Slug.toLowerCase()}`),
        apiFetch(`/api/teams/${team2Slug.toLowerCase()}`)
      ]);

      if (json1.status === 'ok') {
        setTeam1Data({
          team: json1.data.team,
          squad: json1.data.squad,
          metrics: computeMetrics(json1.data.squad, json1.data.team)
        });
      }
      if (json2.status === 'ok') {
        setTeam2Data({
          team: json2.data.team,
          squad: json2.data.squad,
          metrics: computeMetrics(json2.data.squad, json2.data.team)
        });
      }
    } catch (err) {
      console.error('Error fetching comparison data', err);
    } finally {
      setLoading(false);
    }
  };

  fetchComparisonData();
}, [team1Slug, team2Slug]);

  const handleDropdownChange = (index: 1 | 2, slug: string) => {
    const mutableParams = new URLSearchParams(searchParams);
    if (index === 1) {
      mutableParams.set('team1', slug);
    } else {
      mutableParams.set('team2', slug);
    }
    setSearchParams(mutableParams);
  };

  // Prepare recharts grouped bar charts data
  const getChartData = () => {
    if (!team1Data || !team2Data) return [];
    return [
      { metric: 'Offensive Attack', [team1Data.team.name]: team1Data.metrics.attack, [team2Data.team.name]: team2Data.metrics.attack },
      { metric: 'Midfield Block', [team1Data.team.name]: team1Data.metrics.midfield, [team2Data.team.name]: team2Data.metrics.midfield },
      { metric: 'Defense Structure', [team1Data.team.name]: team1Data.metrics.defense, [team2Data.team.name]: team2Data.metrics.defense },
      { metric: 'Roster Depth', [team1Data.team.name]: team1Data.metrics.depth, [team2Data.team.name]: team2Data.metrics.depth },
      { metric: 'Star Power Rating', [team1Data.team.name]: team1Data.metrics.star_power, [team2Data.team.name]: team2Data.metrics.star_power },
    ];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10 pb-16">
      
      {/* Header */}
      <div className="text-center md:text-left border-b border-[#6B7A99]/15 pb-4 md:flex md:items-end justify-between">
        <div>
          <h1 className="text-4xl font-display font-black text-[#E8EDF5] tracking-widest uppercase flex items-center justify-center md:justify-start gap-2.5">
            <GitCompare className="h-8 w-8 text-accent shrink-0" />
            Tactical Comparison Engine
          </h1>
          <p className="text-xs text-[#6B7A99] font-medium uppercase tracking-wide mt-1">
            Analyze rosters, squad depth, star power, and title expectancy in a side-by-side terminal
          </p>
        </div>
      </div>

      {/* Selectors */}
      <section className="bg-[#111C2E] border border-[#6B7A99]/15 p-5 rounded-xl shadow-xl">
        <p className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-widest mb-3 text-center leading-none">
          ★ Select two qualified nations to synchronize metrics ★
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
          {/* Team 1 Selection */}
          <div className="w-full sm:w-64 space-y-1">
            <label className="text-[10px] text-accent uppercase font-bold tracking-widest">Left Country</label>
            <select
              value={team1Slug}
              onChange={(e) => handleDropdownChange(1, e.target.value)}
              className="w-full bg-[#07101E] border border-[#6B7A99]/25 text-xs text-[#E8EDF5] rounded-md py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-accent font-bold cursor-pointer"
            >
              {allTeams.map(t => (
                <option key={t.id} value={t.slug} disabled={t.slug === team2Slug}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[#6B7A99] font-mono text-sm uppercase shrink-0 font-black">VS</span>

          {/* Team 2 Selection */}
          <div className="w-full sm:w-64 space-y-1">
            <label className="text-[10px] text-accent-red uppercase font-bold tracking-widest">Right Country</label>
            <select
              value={team2Slug}
              onChange={(e) => handleDropdownChange(2, e.target.value)}
              className="w-full bg-[#07101E] border border-[#6B7A99]/25 text-xs text-[#E8EDF5] rounded-md py-2.5 px-3.5 focus:outline-none focus:ring-1 focus:ring-accent-red font-bold cursor-pointer"
            >
              {allTeams.map(t => (
                <option key={t.id} value={t.slug} disabled={t.slug === team1Slug}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center text-xs text-[#6B7A99] py-16 animate-pulse">
          Evaluating tactical positional rosters and synchronizing metrics...
        </div>
      ) : !team1Data || !team2Data ? (
        <div className="text-center text-sm text-red-400 py-16">
          Unable to synchronize datasets. Select alternate configurations.
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Side by side summary cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Team 1 Banner */}
            <div className="bg-gradient-to-br from-[#111C2E] to-[#0A1628] border border-accent/20 p-6 rounded-xl flex items-center justify-between shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flag flag={team1Data.team.flag} slug={team1Data.team.id} name={team1Data.team.name} size="lg" />
                  <div>
                    <h2 className="text-2xl font-display font-black text-[#E8EDF5] tracking-wide leading-none">{team1Data.team.name}</h2>
                    <span className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-wider mt-0.5">{team1Data.team.confederation} Federation</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#6B7A99]">
                  <p>Coach: <span className="text-[#E8EDF5] font-semibold">{team1Data.team.coach_name}</span></p>
                  <p>FIFA ranking: <span className="text-accent font-semibold">#{team1Data.team.fifa_ranking}</span></p>
                  <p>Highest rated star: <span className="text-green-400 font-semibold">{[...team1Data.squad].sort((a,b)=>b.rating-a.rating)[0]?.name || 'N/A'}</span></p>
                </div>
              </div>

              <div className="text-center space-y-1 shrink-0 bg-[#07101E] border border-[#6B7A99]/15 px-4.5 py-4.5 rounded-lg w-28">
                <span className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono">Win Probability</span>
                <span className="text-2xl font-display font-black text-accent block leading-none">{team1Data.team.win_probability}%</span>
              </div>
            </div>

            {/* Team 2 Banner */}
            <div className="bg-gradient-to-br from-[#111C2E] to-[#0A1628] border border-red-500/10 p-6 rounded-xl flex items-center justify-between shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flag flag={team2Data.team.flag} slug={team2Data.team.id} name={team2Data.team.name} size="lg" />
                  <div>
                    <h2 className="text-2xl font-display font-black text-[#E8EDF5] tracking-wide leading-none">{team2Data.team.name}</h2>
                    <span className="text-[10px] text-[#6B7A99] uppercase font-bold tracking-wider mt-0.5">{team2Data.team.confederation} Federation</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#6B7A99]">
                  <p>Coach: <span className="text-[#E8EDF5] font-semibold">{team2Data.team.coach_name}</span></p>
                  <p>FIFA ranking: <span className="text-accent-red font-semibold">#{team2Data.team.fifa_ranking}</span></p>
                  <p>Highest rated star: <span className="text-green-400 font-semibold">{[...team2Data.squad].sort((a,b)=>b.rating-a.rating)[0]?.name || 'N/A'}</span></p>
                </div>
              </div>

              <div className="text-center space-y-1 shrink-0 bg-[#07101E] border border-[#6B7A99]/15 px-4.5 py-4.5 rounded-lg w-28">
                <span className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono">Win Probability</span>
                <span className="text-2xl font-display font-black text-accent-red block leading-none">{team2Data.team.win_probability}%</span>
              </div>
            </div>

          </section>

          {/* D. VISUAL COMPARISON STATS GROUPED BARCHART */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-accent" />
              Roster Comparative Attribute Distribution
            </h2>

            <div className="bg-[#111C2E] border border-[#6B7A99]/15 p-5 rounded-xl h-80 shadow-lg">
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F304A" />
                    <XAxis dataKey="metric" stroke="#6B7A99" tick={{ fontSize: 10 }} />
                    <YAxis domain={[65, 100]} stroke="#6B7A99" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111C2E', borderColor: '#6B7A99', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey={team1Data.team.name} fill="#F5A623" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={team2Data.team.name} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Direct KPI Side by Side Breakdown List */}
          <section className="bg-[#111C2E] border border-[#6B7A99]/15 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-[#0A1628] px-4 py-3 border-b border-[#6B7A99]/15 uppercase tracking-widest text-[10px] text-[#6B7A99] font-bold text-center">
              Direct Side-by-Side metrics overview
            </div>

            <div className="divide-y divide-[#6B7A99]/10">
              
              {/* FIFA Rank line */}
              <div className="flex justify-between items-center px-6 py-3.5 text-xs text-[#E8EDF5]">
                <div className="w-1/3 font-mono font-bold text-accent text-sm">#{team1Data.team.fifa_ranking}</div>
                <div className="w-1/3 text-center text-[#6B7A99] font-semibold uppercase text-[10px] tracking-wide">Fifa Ranking</div>
                <div className="w-1/3 text-right font-mono font-bold text-accent-red text-sm">#{team2Data.team.fifa_ranking}</div>
              </div>

              {/* Roster Avg rating line */}
              <div className="flex justify-between items-center px-6 py-3.5 text-xs text-[#E8EDF5]">
                <div className="w-1/3 font-mono font-bold text-green-400 text-sm">
                  {parseFloat((team1Data.squad.reduce((s,p)=>s+p.rating,0)/26).toFixed(1))}
                </div>
                <div className="w-1/3 text-center text-[#6B7A99] font-semibold uppercase text-[10px] tracking-wide">Roster Mean Rating</div>
                <div className="w-1/3 text-right font-mono font-bold text-green-400 text-sm">
                  {parseFloat((team2Data.squad.reduce((s,p)=>s+p.rating,0)/26).toFixed(1))}
                </div>
              </div>

              {/* Mean Roster Age line */}
              <div className="flex justify-between items-center px-6 py-3.5 text-xs text-[#E8EDF5]">
                <div className="w-1/3 font-mono font-bold text-sm">
                  {team1Data.metrics.experience} <span className="text-[10px] text-[#6B7A99] font-sans">Yrs</span>
                </div>
                <div className="w-1/3 text-center text-[#6B7A99] font-semibold uppercase text-[10px] tracking-wide">Average Age</div>
                <div className="w-1/3 text-right font-mono font-bold text-sm">
                  {team2Data.metrics.experience} <span className="text-[10px] text-[#6B7A99] font-sans">Yrs</span>
                </div>
              </div>

              {/* Head coach match line */}
              <div className="flex justify-between items-center px-6 py-3.5 text-xs text-[#E8EDF5]">
                <div className="w-1/3 font-bold truncate pr-2">{team1Data.team.coach_name}</div>
                <div className="w-1/3 text-center text-[#6B7A99] font-semibold uppercase text-[10px] tracking-wide">Tactical Manager</div>
                <div className="w-1/3 text-right font-bold truncate pl-2">{team2Data.team.coach_name}</div>
              </div>

              {/* Target outlook line */}
              <div className="flex justify-between items-center px-6 py-3.5 text-xs text-[#E8EDF5]">
                <div className="w-1/3 text-left font-sans text-[10px] text-[#6B7A99] font-bold uppercase">{team1Data.team.realistic_target}</div>
                <div className="w-1/3 text-center text-[#6B7A99] font-semibold uppercase text-[10px] tracking-wide">Realistic Target Stage</div>
                <div className="w-1/3 text-right font-sans text-[10px] text-[#6B7A99] font-bold uppercase">{team2Data.team.realistic_target}</div>
              </div>

            </div>
          </section>

          {/* Nav Links Footer */}
          <div className="flex justify-between p-1">
            <Link
              to={`/teams/${team1Data.team.slug}`}
              className="px-4 py-2 bg-[#1F304A] hover:bg-[#0A1628] text-xs text-accent font-bold uppercase rounded border border-[#6B7A99]/10 flex items-center gap-1.5 transition-all"
            >
              Roster: {team1Data.team.name}
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to={`/teams/${team2Data.team.slug}`}
              className="px-4 py-2 bg-[#1F304A] hover:bg-[#0A1628] text-xs text-accent-red font-bold uppercase rounded border border-[#6B7A99]/10 flex items-center gap-1.5 transition-all"
            >
              Roster: {team2Data.team.name}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
