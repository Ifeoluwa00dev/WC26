/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Users, LayoutGrid, BarChart2, CalendarDays, GitCompare, Search, Bot, Menu, X, Palette, Check } from 'lucide-react';
import { useFlagStyle, FlagStyle } from '../context/FlagStyleContext';

interface NavbarProps {
  onOpenAnalyst: () => void;
}

export default function Navbar({ onOpenAnalyst }: NavbarProps) {
  const [searchVal, setSearchVal] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { flagStyle, setFlagStyle } = useFlagStyle();
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  const styleOptions: { value: FlagStyle; label: string; desc: string; sample: string }[] = [
    { value: 'emoji', label: 'Classic Emoji', desc: 'Standard Emojis', sample: '🇺🇸' },
    { value: 'circular', label: 'Matte Badges', desc: 'Circular flags', sample: '⚬(🇺🇸)' },
    { value: 'pill', label: 'Capsules', desc: 'Flag + country text', sample: '🇺🇸 USA' },
    { value: 'retro', label: 'Retro Bracket', desc: 'System brackets', sample: '[USA]' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
      setIsMobileOpen(false);
    }
  };

  const navItems = [
    { label: 'Groups', path: '/groups', icon: LayoutGrid },
    { label: 'Teams', path: '/teams', icon: Users },
    { label: 'Fixtures', path: '/fixtures', icon: CalendarDays },
    { label: 'Scorers', path: '/scorers', icon: Trophy },
    { label: 'Compare', path: '/compare', icon: GitCompare },
    { label: 'Live Bracket', path: '/standings', icon: Trophy },
    { label: 'Global Intel', path: '/analytics', icon: BarChart2 },
  ];

  const checkActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A1628]/95 backdrop-blur-md border-b border-[#6B7A99]/15 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="text-3xl font-display text-accent tracking-wider group-hover:text-amber-300 transition-colors">
              WC26
            </span>
            <div className="hidden md:flex flex-col border-l border-[#6B7A99]/20 pl-2 leading-none">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#E8EDF5]">Fan Intelligence</span>
              <span className="text-[9px] text-[#6B7A99] uppercase tracking-wider">FIFA World Cup 2026</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = checkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium tracking-wide transition-all ${
                    active
                      ? 'bg-[#111C2E] text-accent border-b-2 border-accent'
                      : 'text-[#E8EDF5]/80 hover:bg-[#111C2E] hover:text-[#E8EDF5]'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${active ? 'text-accent animate-pulse' : 'text-[#6B7A99]'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search Box & Quick AI Agent button */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search players, coaches..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-56 bg-[#111C2E] border border-[#6B7A99]/25 rounded-md py-1.5 pl-9 pr-3 text-xs text-[#E8EDF5] placeholder-[#6B7A99] focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all focus:w-64"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#6B7A99]" />
            </form>

            {/* Flag Style Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111C2E] text-[#E8EDF5] border border-[#6B7A99]/25 hover:border-accent/40 font-bold text-xs uppercase tracking-wider transition-all"
                title="Flag Style Options"
              >
                <Palette className="h-4 w-4 text-accent" />
                <span className="hidden xl:inline">Style:</span>
                <span className="text-accent">{flagStyle === 'emoji' ? '🇺🇸 Emoji' : flagStyle === 'circular' ? 'Circle Flag' : flagStyle === 'pill' ? 'Capsule' : 'Retro'}</span>
              </button>
              
              {isStyleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsStyleMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-[#0A1628] border border-[#6B7A99]/25 rounded-md shadow-2xl p-2 z-50 space-y-1">
                    <div className="text-[9px] uppercase tracking-wider font-mono text-[#6B7A99] font-bold px-2 py-1 border-b border-[#6B7A99]/15">
                      Select Flag Visual Style
                    </div>
                    {styleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFlagStyle(opt.value);
                          setIsStyleMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-all ${
                          flagStyle === opt.value
                            ? 'bg-accent/15 text-accent font-bold'
                            : 'text-[#E8EDF5]/80 hover:bg-[#111C2E] hover:text-[#E8EDF5]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{opt.label}</span>
                          <span className="text-[9.5px] text-[#6B7A99] font-normal leading-tight">{opt.desc}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] bg-[#07101E] px-1.5 py-0.5 rounded border border-[#6B7A99]/15 leading-none text-accent">
                            {opt.sample}
                          </span>
                          {flagStyle === opt.value && <Check className="h-3.5 w-3.5 text-accent" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            
          </div>

          {/* Mobile Buttons */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onOpenAnalyst}
              className="px-2.5 py-1.5 rounded bg-accent text-primary font-bold text-xs"
              title="AI analyst"
            >
              <Bot className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-1.5 text-[#E8EDF5] hover:bg-[#111C2E] rounded-md focus:outline-none"
            >
              {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden bg-[#0A1628] border-b border-[#6B7A99]/15 px-4 pt-2 pb-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search players, coaches..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-[#111C2E] border border-[#6B7A99]/25 rounded-md py-2 pl-9 pr-3 text-sm text-[#E8EDF5]"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B7A99]" />
          </form>

          {/* Mobile Flag Style Selector */}
          <div className="bg-[#111C2E]/60 border border-[#6B7A99]/15 rounded-lg p-3 space-y-2">
            <span className="text-[9px] text-[#6B7A99] uppercase font-bold tracking-widest font-mono flex items-center gap-1">
              <Palette className="h-3 w-3 text-accent" /> Flag Styling Option
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {styleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFlagStyle(opt.value)}
                  className={`py-1.5 px-2 rounded text-center text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 border ${
                    flagStyle === opt.value
                      ? 'bg-accent text-primary border-accent'
                      : 'bg-[#07101E] text-[#6B7A99] border-[#6B7A99]/15 hover:text-[#E8EDF5]'
                  }`}
                >
                  <span className="font-mono text-[9px]">{opt.sample}</span>
                  <span>{opt.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = checkActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm ${
                    active ? 'bg-[#111C2E] text-accent' : 'text-[#E8EDF5] hover:bg-[#111C2E]'
                  }`}
                >
                  <Icon className="h-5 w-5 text-[#6B7A99]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
