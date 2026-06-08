/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A1628] border-t border-[#6B7A99]/15 text-[#E8EDF5]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between gap-6 border-b border-[#6B7A99]/10 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-display text-accent tracking-wider font-bold">WC26</span>
            <span className="text-xs text-[#6B7A99] uppercase tracking-widest font-semibold border-l border-[#6B7A99]/20 pl-3">
              "Every squad. Every group. Every story."
            </span>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6B7A99] font-medium uppercase tracking-wider">
            <span className="hover:text-accent transition-colors cursor-pointer">Live Calendar</span>
            <span className="hover:text-accent transition-colors cursor-pointer">Intelligence Index</span>
            <span className="hover:text-accent transition-colors cursor-pointer">Tactical Comparisons</span>
            <span className="hover:text-accent transition-colors cursor-pointer">API Registry</span>
          </div>
        </div>

        <div className="sm:flex sm:items-center sm:justify-between text-xs text-[#6B7A99] leading-none">
          <p className="flex items-center gap-1">
            <span>Built by Google AI Studio Build</span>
            <span>&copy; {new Date().getFullYear()} WC26 Fan Intelligence Platform.</span>
          </p>
          <p className="flex items-center gap-1.5 mt-2 sm:mt-0 uppercase tracking-widest font-mono">
            <Shield className="h-3.5 w-3.5 text-accent" />
            <span>Data Source:</span>
            <span className="text-[#E8EDF5] font-semibold">Official FIFA 2026 Squads & Drafts</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
