/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFlagStyle, FlagStyle } from '../context/FlagStyleContext';

interface FlagProps {
  flag: string; // The standard emoji flag (e.g. '🇺🇸')
  slug: string; // The country code slug (e.g. 'usa')
  name: string; // Full country name (e.g. 'United States')
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface CountryMetadata {
  iso3: string;
  bgHex: string;
  textHex: string;
  accentHex: string;
}

const METADATA_MAP: Record<string, CountryMetadata> = {
  usa: { iso3: 'USA', bgHex: '#0B2C56', textHex: '#FFFFFF', accentHex: '#D80621' },
  mex: { iso3: 'MEX', bgHex: '#006847', textHex: '#FFFFFF', accentHex: '#CE1126' },
  can: { iso3: 'CAN', bgHex: '#D80621', textHex: '#FFFFFF', accentHex: '#E8EDF5' },
  alg: { iso3: 'ALG', bgHex: '#006633', textHex: '#FFFFFF', accentHex: '#D11034' },
  eng: { iso3: 'ENG', bgHex: '#E8EDF5', textHex: '#D80621', accentHex: '#0A1628' },
  fra: { iso3: 'FRA', bgHex: '#002654', textHex: '#FFFFFF', accentHex: '#ED2939' },
  sen: { iso3: 'SEN', bgHex: '#00A357', textHex: '#FCD116', accentHex: '#E51429' },
  ecu: { iso3: 'ECU', bgHex: '#FFCC00', textHex: '#003087', accentHex: '#D80621' },
  arg: { iso3: 'ARG', bgHex: '#74ACDF', textHex: '#0A1628', accentHex: '#FFFFFF' },
  esp: { iso3: 'ESP', bgHex: '#C60B1E', textHex: '#F1BF00', accentHex: '#C60B1E' },
  sui: { iso3: 'SUI', bgHex: '#D80621', textHex: '#FFFFFF', accentHex: '#D80621' },
  egy: { iso3: 'EGY', bgHex: '#C8102E', textHex: '#FFFFFF', accentHex: '#000000' },
  bra: { iso3: 'BRA', bgHex: '#009739', textHex: '#FEDD00', accentHex: '#002776' },
  ita: { iso3: 'ITA', bgHex: '#0054A5', textHex: '#FFFFFF', accentHex: '#008C45' },
  nga: { iso3: 'NGA', bgHex: '#008751', textHex: '#FFFFFF', accentHex: '#008751' },
  jpn: { iso3: 'JPN', bgHex: '#FFFFFF', textHex: '#BC002D', accentHex: '#000055' },
  ger: { iso3: 'GER', bgHex: '#1D1D1B', textHex: '#DD0000', accentHex: '#FFCC00' },
  por: { iso3: 'POR', bgHex: '#DA291C', textHex: '#FFFFFF', accentHex: '#046A38' },
  cro: { iso3: 'CRO', bgHex: '#172554', textHex: '#FFFFFF', accentHex: '#FF0000' },
  kor: { iso3: 'KOR', bgHex: '#E50027', textHex: '#FFFFFF', accentHex: '#0054A5' },
  col: { iso3: 'COL', bgHex: '#FCD116', textHex: '#003893', accentHex: '#CE1126' },
  uru: { iso3: 'URU', bgHex: '#0081C4', textHex: '#0A1628', accentHex: '#FFFFFF' },
  mar: { iso3: 'MAR', bgHex: '#C1272D', textHex: '#006233', accentHex: '#DA291C' },
  ned: { iso3: 'NED', bgHex: '#FF4F00', textHex: '#FFFFFF', accentHex: '#21468B' },
  bel: { iso3: 'BEL', bgHex: '#FFCD00', textHex: '#000000', accentHex: '#FF0000' },
  ukr: { iso3: 'UKR', bgHex: '#FFD700', textHex: '#0057B7', accentHex: '#0057B7' },
  pol: { iso3: 'POL', bgHex: '#FFFFFF', textHex: '#DC143C', accentHex: '#DC143C' },
};

// Generates a hash-based beautiful palette for missing country metadata
function getFallbackMetadata(slug: string, name: string): CountryMetadata {
  const cleanId = (slug || name || 'fallback').toLowerCase().trim();
  const iso3 = cleanId.length >= 3 ? cleanId.substring(0, 3).toUpperCase() : 'UNK';
  
  // Hash function to consistently select nice colors
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = cleanId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    { bg: '#10B981', txt: '#FFFFFF', acc: '#3B82F6' }, // emerald
    { bg: '#3B82F6', txt: '#FFFFFF', acc: '#F5A623' }, // blue
    { bg: '#F5A623', txt: '#07101E', acc: '#EF4444' }, // gold
    { bg: '#EC4899', txt: '#FFFFFF', acc: '#8B5CF6' }, // pink
    { bg: '#8B5CF6', txt: '#FFFFFF', acc: '#10B981' }, // violet
    { bg: '#06B6D4', txt: '#FFFFFF', acc: '#F43F5E' }, // cyan
    { bg: '#E11D48', txt: '#FFFFFF', acc: '#FFCC00' }, // rose
    { bg: '#1E293B', txt: '#F8FAFC', acc: '#38BDF8' }, // slate
  ];
  const choice = colors[Math.abs(hash) % colors.length];
  
  return {
    iso3,
    bgHex: choice.bg,
    textHex: choice.txt,
    accentHex: choice.acc,
  };
}

export function getCountryCode(slug: string, name: string) {
  const norm = slug?.toLowerCase();
  if (METADATA_MAP[norm]) return METADATA_MAP[norm].iso3;
  return name ? name.substring(0, 3).toUpperCase() : 'UNK';
}

function toFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export default function Flag({ flag, slug, name, className = '', size = 'md' }: FlagProps) {
  const { flagStyle } = useFlagStyle();
  const slugKey = (slug || '').toLowerCase();
  const meta = METADATA_MAP[slugKey] || getFallbackMetadata(slugKey, name);

  let displayFlag = flag;
  if (flag && flag.length === 2 && /^[A-Z]{2}$/i.test(flag)) {
    displayFlag = toFlagEmoji(flag);
  } else if ((!flag || flag === '🏴' || flag === '🏳️') && slug && slug.length === 2 && /^[A-Z]{2}$/i.test(slug)) {
    displayFlag = toFlagEmoji(slug);
  } else if ((!flag || flag === '🏴' || flag === '🏳️') && name && name.length === 2 && /^[A-Z]{2}$/i.test(name)) {
    displayFlag = toFlagEmoji(name);
  }

  // Size specifications
  const getDims = () => {
    switch (size) {
      case 'xs':
        return {
          emoji: 'text-xs',
          circle: 'w-4.5 h-4.5 text-[9px]',
          pill: 'px-1 py-0 text-[7px] gap-0.5',
          retro: 'text-[8px] border-l py-0 border-accent/60 pl-0.5',
        };
      case 'sm':
        return {
          emoji: 'text-base',
          circle: 'w-6 h-6 text-xs',
          pill: 'px-1.5 py-0.5 text-[8px] gap-1',
          retro: 'text-[9px] border-l py-0 border-accent/70 pl-1',
        };
      case 'lg':
        return {
          emoji: 'text-3xl sm:text-4xl',
          circle: 'w-11 h-11 text-2xl',
          pill: 'px-3 py-1 text-xs gap-2',
          retro: 'text-sm border-l-2 py-0.5 border-accent pl-2',
        };
      case 'xl':
        return {
          emoji: 'text-5xl sm:text-6xl',
          circle: 'w-16 h-16 text-[38px]',
          pill: 'px-4.5 py-1.5 text-sm gap-2.5',
          retro: 'text-lg border-l-4 py-1 border-accent pl-3',
        };
      case 'md':
      default:
        return {
          emoji: 'text-2xl sm:text-3xl',
          circle: 'w-9 h-9 text-lg',
          pill: 'px-2 py-0.5 text-[9px] gap-1.5',
          retro: 'text-xs border-l-2 py-0.5 border-accent pl-1.5',
        };
    }
  };

  const dims = getDims();

  if (flagStyle === 'circular') {
    return (
      <div
        className={`relative flex items-center justify-center rounded-full font-mono font-black select-none border border-[#6B7A99]/20 shadow-md transform hover:scale-105 transition-transform shrink-0 overflow-hidden ${dims.circle} ${className}`}
        style={{ backgroundColor: meta.bgHex }}
        title={`${name} [${meta.iso3}]`}
      >
        <span className="filter drop-shadow-sm leading-none flex items-center justify-center">{displayFlag || '🏳️'}</span>
        {/* Subtle accent color ring or dot */}
        <span
          className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#07101E]"
          style={{ backgroundColor: meta.accentHex }}
        />
      </div>
    );
  }

  if (flagStyle === 'pill') {
    return (
      <span
        className={`inline-flex items-center bg-[#111C2E] border border-[#6B7A99]/25 rounded-md text-[10px] uppercase font-bold tracking-wider leading-none shrink-0 text-[#E8EDF5] hover:border-accent/40 transition-colors ${dims.pill} ${className}`}
        title={`${name} [${meta.iso3}]`}
      >
        <span className="select-none filter drop-shadow">{displayFlag || '🏳️'}</span>
        <span className="font-mono text-accent text-[9px]">{meta.iso3}</span>
      </span>
    );
  }

  if (flagStyle === 'retro') {
    return (
      <span
        className={`inline-flex items-center text-xs font-mono font-bold leading-none gap-1 select-none transform hover:translate-x-0.5 transition-all text-[#E8EDF5] ${dims.retro} ${className}`}
        title={`${name} [${meta.iso3}]`}
      >
        <span className="scale-90 opacity-90">{displayFlag || '🏳️'}</span>
        <span className="text-[10px] text-accent tracking-widest font-black uppercase">[{meta.iso3}]</span>
      </span>
    );
  }

  // Classic default 'emoji' style
  return (
    <span
      className={`select-none filter drop-shadow inline-block transform hover:scale-110 active:scale-95 transition-transform cursor-default ${dims.emoji} ${className}`}
      title={`${name} [${meta.iso3}]`}
    >
      {displayFlag || '🏳️'}
    </span>
  );
}
