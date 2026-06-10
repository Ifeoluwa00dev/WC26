/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { apiFetch } from '../lib/apiFetch';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Clipboard, Flame, HelpCircle, ChevronRight, Trophy, Sparkles, Sliders } from 'lucide-react';
import { Team, Match } from '../types';
import Flag from '../components/Flag';

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // June 11, 2026 Countdown Engine
  const targetDate = new Date('2026-06-11T00:00:00Z').getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isPast: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Teams
  useEffect(() => {
  const fetchHomeData = async () => {
    try {
      const json = await apiFetch('/api/teams');
      if (json.status === 'ok') {
        setTeams(json.data);
      }
      
      const mJson = await apiFetch('/api/matches');
      if (mJson.status === 'ok') {
        const allMatches: Match[] = mJson.data;
        const selections = allMatches
  .filter(m => m.stage === 'Group')
  .slice(0, 3);
        setFeaturedMatches(selections);
      }
    } catch (err) {
      console.error('Error fetching home data', err);
    } finally {
      setLoading(false);
    }
  };
  fetchHomeData();
}, []);

  // Top favorites for win probability spotlight
  const favorites = [...teams]
    .sort((a, b) => b.win_probability - a.win_probability)
    .slice(0, 8);

  // Group letters
  const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Dark Horse selections
  const darkHorsesList = [
    {
      country: 'Japan',
      flag: '🇯🇵',
      text: 'Moriyasu\'s side boasts an exceptional roster of Bundesliga and Ligue 1 stars. Their tactical flexibility and extreme structural coordination makes them highly capable of toppling any champion block.',
      slug: 'jpn',
      potentialRating: 'A+',
      winProb: '3.5%'
    },
    {
      country: 'Senegal',
      flag: '🇸🇳',
      text: 'Boasting remarkable physical standards and veteran champions paired with explosive Gen-Z talent. They reside in Group D alongside France but present immense threat on quick direct transitions.',
      slug: 'sen',
      potentialRating: 'A',
      winProb: '3.0%'
    },
    {
      country: 'Morocco',
      flag: '🇲🇦',
      text: 'The 2022 blockbusters return. Under Regragui\'s defensive low schemes and Achraf Hakimi\'s lightning overlaps, Morocco has the world-class composure to trigger massive bracket upsets.',
      slug: 'mar',
      potentialRating: 'A-',
      winProb: '4.5%'
    }
  ];

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HERO BANNER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#111C2E] to-[#07101E] py-20 px-4 border-b border-[#6B7A99]/15">
        
        {/* Decorative Grid Layer */}
        <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Subtle glow circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl z-0" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-bold uppercase tracking-widest leading-none">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            FIFA World Cup 2026 Fan Central
          </div>

          <h1 className="text-6xl md:text-8xl font-display font-black text-[#E8EDF5] tracking-wider leading-none select-none">
            EVERY SQUAD. <span className="text-accent underline decoration-accent/30 decoration-wavy">EVERY GROUP.</span> EVERY STORY.
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#6B7A99] font-medium tracking-wide">
            Analyze rosters, evaluate team ratings, simulate live group standings, and compare player profiles on the webs' premiere premium football fan intelligence terminal.
          </p>

          {/* Countdown timer */}
          <div className="bg-[#111C2E] border border-[#6B7A99]/20 rounded-xl max-w-lg mx-auto p-4 inline-block shadow-2xl">
            <p className="text-[10px] text-accent uppercase font-bold tracking-widest text-[#6B7A99] mb-2 font-mono">
              ★ Kickoff Countdown (June 11, 2026) ★
            </p>
            {timeLeft.isPast ? (
              <span className="text-2xl font-display text-accent tracking-widest">THE TOURNAMENT IS LIVE!</span>
            ) : (
              <div className="flex justify-center items-center gap-4 text-[#E8EDF5]">
                <div className="text-center">
                  <span className="block text-3xl font-display font-black text-accent font-mono leading-none">{timeLeft.days}</span>
                  <span className="text-[9px] text-[#6B7A99] uppercase tracking-wider font-semibold font-sans">Days</span>
                </div>
                <div className="text-xl text-[#6B7A99] font-bold mt-1">:</div>
                <div className="text-center">
                  <span className="block text-3xl font-display font-black text-accent font-mono leading-none">{timeLeft.hours}</span>
                  <span className="text-[9px] text-[#6B7A99] uppercase tracking-wider font-semibold font-sans">Hours</span>
                </div>
                <div className="text-xl text-[#6B7A99] font-bold mt-1">:</div>
                <div className="text-center">
                  <span className="block text-3xl font-display font-black text-accent font-mono leading-none">{timeLeft.minutes}</span>
                  <span className="text-[9px] text-[#6B7A99] uppercase tracking-wider font-semibold font-sans">Mins</span>
                </div>
                <div className="text-xl text-[#6B7A99] font-bold mt-1">:</div>
                <div className="text-center">
                  <span className="block text-3xl font-display font-black text-[#6B7A99] font-mono leading-none">{timeLeft.seconds}</span>
                  <span className="text-[9px] text-accent uppercase tracking-wider font-semibold font-sans">Secs</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-bold leading-none uppercase tracking-wider">
            <Link
              to="/teams"
              className="px-6 py-3.5 bg-accent text-primary rounded-lg hover:bg-amber-300 transition-all font-bold active:scale-95 shadow-md shadow-accent/15"
            >
              Explore Teams
            </Link>
            <Link
              to="/groups"
              className="px-6 py-3.5 bg-[#1F304A] text-[#E8EDF5] border border-[#6B7A99]/20 rounded-lg hover:bg-[#111C2E] transition-all"
            >
              View Groups
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FAVORITES SPOTLIGHT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#6B7A99]/15 pb-2">
          <h2 className="text-xl font-display text-[#E8EDF5] uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Win Probability Favorites
          </h2>
          <span className="text-[10px] text-[#6B7A99] uppercase tracking-widest font-mono">Top 8 Title favorites</span>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin">
          {loading ? (
            <div className="text-xs text-[#6B7A99] py-4">Compiling team statistics...</div>
          ) : (
            favorites.map((team, index) => {
              const ringColor = index === 0 ? 'border-amber-400' : index < 3 ? 'border-slate-300' : 'border-[#6B7A99]/25';
              return (
                <Link
                  key={team.id}
                  to={`/teams/${team.slug}`}
                  className="glass-effect p-4 rounded-xl shrink-0 w-44 hover:shadow-xl hover:border-accent/40 active:scale-95 transition-all text-left block"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-[#6B7A99]/10 pb-2">
                    <Flag flag={team.flag} slug={team.slug} name={team.name} size="sm" />
                    <span className="text-xs font-mono font-bold text-[#6B7A99]">#{team.fifa_ranking}</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#E8EDF5] truncate uppercase leading-none mb-1">{team.name}</h3>
                  <p className="text-[10px] text-[#6B7A99] uppercase font-mono tracking-wider">{team.confederation}</p>

                  <div className="flex items-center gap-2 mt-4">
                    {/* Tiny Circular Progress Meter */}
                    <div className="relative h-10 w-10 shrink-0">
                      <svg className="h-full w-full -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          className="stroke-[#07101E] fill-none"
                          strokeWidth="3.5"
                        />
                        <svg className="absolute">
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            className="stroke-accent fill-none"
                            strokeWidth="3.5"
                            strokeDasharray={100}
                            strokeDashoffset={100 - team.win_probability * 5} // approximate dash scaled
                          />
                        </svg>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-accent">
                        {team.win_probability}%
                      </span>
                    </div>
                    <div className="text-[10px] text-[#E8EDF5]/80 font-bold tracking-tight">
                      Win probability
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* 3. GROUP STAGE DRAW GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#6B7A99]/15 pb-2">
          <h2 className="text-sm font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#6B7A99]" />
            Tournament Group Stage Draw
          </h2>
          <Link to="/groups" className="text-[11px] text-[#F5A623] hover:underline font-bold uppercase tracking-wider flex items-center gap-1">
            Display Draw Detail <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupLetters.map((letter) => {
            const letterTeams = teams.filter((t) => t.group_letter === letter);
            return (
              <Link
                key={letter}
                to={`/groups/${letter.toLowerCase()}`}
                className="glass-effect p-4 rounded-xl hover:border-accent/40 active:scale-98 transition-all hover:shadow-xl text-left block"
              >
                <div className="flex items-center justify-between mb-3.5 border-b border-[#6B7A99]/10 pb-1.5">
                  <span className="font-display text-xl font-bold text-accent">Group {letter}</span>
                  <span className="text-[9px] text-[#6B7A99] font-semibold tracking-wider bg-primary px-1.5 py-0.5 rounded uppercase">Pool</span>
                </div>
                <div className="space-y-1.5">
                  {letterTeams.length === 0 ? (
                    <div className="text-[10px] text-[#6B7A99]">Generating pool seeding...</div>
                  ) : (
                    letterTeams.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs text-[#E8EDF5] font-medium leading-none">
                        <span className="flex items-center gap-1.5">
                          <Flag flag={t.flag} slug={t.slug} name={t.name} size="sm" />
                          <span className="truncate max-w-[110px]">{t.name}</span>
                        </span>
                        <span className="text-[10px] text-[#6B7A99] font-mono leading-none">#{t.fifa_ranking}</span>
                      </div>
                    ))
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. TOURNAMENT STATS SUMMARY BAR */}
      <section className="bg-[#111C2E] border-y border-[#6B7A99]/15">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="block text-4xl font-display font-bold text-accent">48</span>
              <span className="text-xs text-[#6B7A99] uppercase tracking-widest font-semibold">Teams Registered</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl font-display font-bold text-accent">12</span>
              <span className="text-xs text-[#6B7A99] uppercase tracking-widest font-semibold">Seeded Groups</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl font-display font-bold text-accent">104</span>
              <span className="text-xs text-[#6B7A99] uppercase tracking-widest font-semibold">Total Matches</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl font-display font-bold text-accent">32</span>
              <span className="text-xs text-[#6B7A99] uppercase tracking-widest font-semibold">Advance to KO</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED MATCHUPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#6B7A99]/15 pb-2">
          <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Flame className="h-4.5 w-4.5 text-[#C8102E]" />
            Featured Tactical Matchups
          </h2>
          <span className="text-[10px] text-[#6B7A99] uppercase tracking-widest font-mono">Interactive scoreboards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-xs text-[#6B7A99] text-center col-span-3 py-6">Compiling fixtures...</div>
          ) : (
            featuredMatches.map((m) => {
              const home = teams.find(t => t.id === m.team_home_id);
              const away = teams.find(t => t.id === m.team_away_id);
              if (!home || !away) return null;
              
              return (
                <div key={m.id} className="glass-effect rounded-xl overflow-hidden shadow-lg border border-[#6B7A99]/10">
                  <div className="bg-[#1F304A] px-4 py-2 border-b border-[#6B7A99]/15 flex items-center justify-between text-[11px] font-bold text-[#E8EDF5] uppercase tracking-wider">
                    <span>Group {m.group_letter} Matchup</span>
                    <span className="text-accent bg-[#07101E] px-2 py-0.5 rounded text-[10px] font-mono leading-none">
                      {m.played ? 'FULL MATCH' : 'UPCOMING'}
                    </span>
                  </div>

                  <div className="p-4 space-y-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {/* Home */}
                      <Link to={`/teams/${home.slug}`} className="flex-1 text-center group flex flex-col items-center">
                        <div className="block h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Flag flag={home.flag} slug={home.slug} name={home.name} size="lg" />
                        </div>
                        <span className="block text-xs font-bold text-[#E8EDF5] truncate mt-1 group-hover:text-accent transition-colors">
                          {home.name}
                        </span>
                        <span className="block text-[10px] text-[#6B7A99] uppercase font-mono mt-0.5">Rank #{home.fifa_ranking}</span>
                      </Link>

                      {/* Score or VS */}
                      <div className="px-4 py-2 bg-[#0A1628] rounded-lg border border-[#6B7A99]/10 shrink-0">
                        {m.played ? (
                          <div className="flex items-center gap-3 text-xl font-mono font-black text-accent">
                            <span>{m.score_home}</span>
                            <span className="text-xs text-[#6B7A99] font-normal font-sans">-</span>
                            <span>{m.score_away}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-[#6B7A99] uppercase tracking-wider">VS</span>
                        )}
                      </div>

                      {/* Away */}
                      <Link to={`/teams/${away.slug}`} className="flex-1 text-center group flex flex-col items-center">
                        <div className="block h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Flag flag={away.flag} slug={away.slug} name={away.name} size="lg" />
                        </div>
                        <span className="block text-xs font-bold text-[#E8EDF5] truncate mt-1 group-hover:text-accent transition-colors">
                          {away.name}
                        </span>
                        <span className="block text-[10px] text-[#6B7A99] uppercase font-mono">Rank #{away.fifa_ranking}</span>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-[#6B7A99]/10 text-[10px] text-[#6B7A99] font-bold uppercase tracking-wider">
                      {m.venue}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 6. DARK HORSE PICKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#6B7A99]/15 pb-2">
          <h2 className="text-xs font-bold uppercase text-[#E8EDF5] tracking-widest flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-accent" />
            Featured Dark Horses Spotlight
          </h2>
          <span className="text-[10px] text-[#6B7A99] uppercase tracking-widest font-mono">Tactical breakthrough picks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {darkHorsesList.map((pick) => (
            <Link
              key={pick.slug}
              to={`/teams/${pick.slug}`}
              className="glass-effect p-5 rounded-xl border border-accent/15 flex flex-col justify-between hover:border-accent/40 hover:shadow-xl transition-all text-left block active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#6B7A99]/10 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Flag flag={pick.flag} slug={pick.slug} name={pick.country} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-[#E8EDF5] uppercase leading-none ml-1">{pick.country}</h3>
                      <span className="text-[9px] text-accent uppercase font-semibold font-mono">Breakthrough Potential: {pick.potentialRating}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#07101E] px-2 py-0.5 rounded text-[#6B7A99]">Prob: {pick.winProb}</span>
                </div>
                <p className="text-xs text-[#E8EDF5]/85 leading-relaxed italic">
                  "{pick.text}"
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#6B7A99]/10 flex items-center justify-between text-[10px] text-accent font-bold uppercase tracking-wider">
                <span>Inspect Active Seeding Squad</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
