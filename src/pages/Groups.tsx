/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { apiFetch } from '../lib/apiFetch';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Flame, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import Flag from '../components/Flag';

interface GroupTeam {
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
  avg_rating: number; // calculated average
}

interface Group {
  id: string;
  letter: string;
  nickname: string;
  difficulty: 'Easy' | 'Competitive' | 'Group of Death';
  teams: GroupTeam[];
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const json = await apiFetch('/api/groups');
if (json.status === 'ok') {
          setGroups(json.data);
        }
      } catch (err) {
        console.error('Error fetching groups data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // Filter groups if they contain at least one team belonging to the selected confederation
  const filteredGroups = groups.filter((g) => {
    if (activeTab === 'ALL') return true;
    return g.teams.some((team) => team.confederation.toUpperCase() === activeTab);
  });

  const confederations = ['ALL', 'UEFA', 'CONMEBOL', 'CAF', 'AFC', 'CONCACAF', 'OFC'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-16">
      
      {/* Header */}
      <div className="text-center md:text-left md:flex md:items-end md:justify-between border-b border-[#6B7A99]/15 pb-4">
        <div>
          <h1 className="text-4xl font-display font-black text-[#E8EDF5] tracking-widest uppercase">
            Group Stage Draw 2026
          </h1>
          <p className="text-xs text-[#6B7A99] font-medium uppercase tracking-wide mt-1">
            Explore the 12 groups comprising the 48 participating nations
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex justify-center gap-2 text-[10px] text-accent font-bold uppercase tracking-widest font-mono">
          <span className="bg-[#111C2E] border border-accent/25 px-2 py-1 rounded">12 Pools</span>
          <span className="bg-[#111C2E] border border-accent/25 px-2 py-1 rounded">48 Teams Max</span>
        </div>
      </div>

      {/* Confederation Filtering Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin border-b border-[#6B7A99]/10">
        {confederations.map((conf) => (
          <button
            key={conf}
            onClick={() => setActiveTab(conf)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap leading-none ${
              activeTab === conf
                ? 'bg-accent text-primary'
                : 'bg-[#111C2E] text-[#6B7A99] hover:bg-[#111C2E]/50 hover:text-[#E8EDF5]'
            }`}
          >
            {conf === 'ALL' ? 'All Draw Groups' : `${conf}`}
          </button>
        ))}
      </div>

      {/* Grid container */}
      {loading ? (
        <div className="text-center text-xs text-[#6B7A99] py-16 animate-pulse">
          Seeding tournament data and preparing layouts...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center text-xs text-[#6B7A99] py-16 border border-dashed border-[#6B7A99]/20 rounded-xl">
          No groups match the selected confederation filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((g) => {
            // Pick appropriate CSS style for difficulty tag
            let difficultyStyle = 'bg-green-500/10 text-green-400 border-green-500/20';
            let difficultyIcon = Award;
            if (g.difficulty === 'Group of Death') {
              difficultyStyle = 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse';
              difficultyIcon = ShieldAlert;
            } else if (g.difficulty === 'Competitive') {
              difficultyStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              difficultyIcon = Flame;
            }

            const DifficultyIcon = difficultyIcon;

            return (
              <div
                key={g.id}
                className="glass-effect rounded-xl overflow-hidden shadow-xl border border-[#6B7A99]/15 flex flex-col justify-between"
              >
                {/* Banner */}
                <div className="bg-[#111C2E] p-4 border-b border-[#6B7A99]/15 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-2xl font-black text-accent tracking-widest leading-none">
                        Group {g.letter}
                      </span>
                      <span className={`flex items-center gap-1 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border font-semibold ${difficultyStyle}`}>
                        <DifficultyIcon className="h-3 w-3" />
                        {g.difficulty}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7A99] font-bold uppercase tracking-wide block mt-1">
                      "{g.nickname}"
                    </span>
                  </div>
                </div>

                {/* Team lines */}
                <div className="p-4 space-y-3.5 flex-1">
                  {g.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between text-xs font-semibold leading-none text-[#E8EDF5]"
                    >
                      <Link
                        to={`/teams/${team.slug}`}
                        className="flex items-center gap-2 hover:text-accent transition-colors group"
                      >
                        <Flag flag={team.flag} slug={team.slug} name={team.name} size="sm" />
                        <span className="group-hover:underline truncate max-w-[150px]">
                          {team.name}
                        </span>
                        <span className="text-[8px] text-[#6B7A99] uppercase bg-[#111C2E] border border-[#6B7A99]/10 px-1 py-0.5 rounded">
                          {team.confederation}
                        </span>
                      </Link>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="block text-[8px] text-[#6B7A99] uppercase font-mono font-bold">FIFA</span>
                          <span className="text-[10px] font-mono text-[#E8EDF5] font-bold">#{team.fifa_ranking}</span>
                        </div>
                        <div className="w-12">
                          <span className="block text-[8px] text-[#6B7A99] uppercase font-mono font-bold">Prob</span>
                          <span className="text-[10px] font-mono text-accent font-bold">{team.win_probability}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card CTA */}
                <div className="p-4 bg-[#0A1628]/40 border-t border-[#6B7A99]/10">
                  <Link
                    to={`/groups/${g.letter.toLowerCase()}`}
                    className="w-full py-2 bg-[#1F304A] text-[#E8EDF5]/90 hover:text-accent font-bold hover:bg-[#111C2E] border border-[#6B7A99]/10 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    Manage Bracket Standing
                    <ArrowRight className="h-3.5 w-3.5 text-accent" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
