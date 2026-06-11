/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Player, Match, GroupStandings } from '../types';

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 60000; // 60 seconds

// Client-side rate-limit trackers from soccer API headers
let requestsAvailableMinute = 10;
let requestCounterReset = 60; // in seconds
let lastResponseTime = Date.now();

const BASE_URL = 'https://api.football-data.org/v4';

// Emoji lookup index for countries and major WC contenders
const COUNTRY_TO_FLAG: Record<string, string> = {
  'United States': '🇺🇸', 'USA': '🇺🇸', 'US': '🇺🇸',
  'Mexico': '🇲🇽', 'MEX': '🇲🇽',
  'Canada': '🇨🇦', 'CAN': '🇨🇦',
  'Algeria': '🇩🇿', 'ALG': '🇩🇿', 'DZA': '🇩🇿',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'France': '🇫🇷', 'FRA': '🇫🇷',
  'Senegal': '🇸🇳', 'SEN': '🇸🇳',
  'Ecuador': '🇪🇨', 'ECU': '🇪🇨',
  'Argentina': '🇦🇷', 'ARG': '🇦🇷',
  'Spain': '🇪🇸', 'ESP': '🇪🇸',
  'Switzerland': '🇨🇭', 'SUI': '🇨🇭', 'CHE': '🇨🇭',
  'Egypt': '🇪🇬', 'EGY': '🇪🇬',
  'Brazil': '🇧🇷', 'BRA': '🇧🇷',
  'Italy': '🇮🇹', 'ITA': '🇮🇹',
  'Nigeria': '🇳🇬', 'NGA': '🇳🇬',
  'Japan': '🇯🇵', 'JPN': '🇯🇵',
  'Germany': '🇩🇪', 'GER': '🇩🇪', 'DEU': '🇩🇪',
  'Portugal': '🇵🇹', 'POR': '🇵🇹', 'PRT': '🇵🇹',
  'Croatia': '🇭🇷', 'CRO': '🇭🇷', 'HRV': '🇭🇷',
  'South Korea': '🇰🇷', 'KOR': '🇰🇷',
  'Colombia': '🇨🇴', 'COL': '🇨🇴',
  'Uruguay': '🇺🇾', 'URU': '🇺🇾',
  'Morocco': '🇲🇦', 'MAR': '🇲🇦',
  'Netherlands': '🇳🇱', 'NED': '🇳🇱', 'NLD': '🇳🇱',
  'Belgium': '🇧🇪', 'BEL': '🇧🇪',
  'Ukraine': '🇺🇦', 'UKR': '🇺🇦',
  'Poland': '🇵🇱', 'POL': '🇵🇱',
  'Sweden': '🇸🇪', 'SWE': '🇸🇪',
  'Australia': '🇦🇺', 'AUS': '🇦🇺',
  'Cameroon': '🇨🇲', 'CMR': '🇨🇲',
  'Mali': '🇲🇱', 'MLI': '🇲🇱',
  'Iraq': '🇮🇶', 'IRQ': '🇮🇶',
  'Ghana': '🇬🇭', 'GHA': '🇬🇭',
  'Costa Rica': '🇨🇷', 'CRC': '🇨🇷',
  'Tunisia': '🇹🇳', 'TUN': '🇹🇳',
  'South Africa': '🇿🇦', 'RSA': '🇿🇦',
  'Denmark': '🇩🇰', 'DEN': '🇩🇰',
  'Iran': '🇮🇷', 'IRN': '🇮🇷',
  'New Zealand': '🇳🇿', 'NZL': '🇳🇿',
  'Chile': '🇨🇱', 'CHI': '🇨🇱',
  'Saudi Arabia': '🇸🇦', 'KSA': '🇸🇦',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Cape Verde': '🇨🇻', 'CPV': '🇨🇻',
  'Peru': '🇵🇪', 'PER': '🇵🇪',
  'Qatar': '🇶🇦', 'QAT': '🇶🇦',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Jamaica': '🇯🇲', 'JAM': '🇯🇲'
};

export function toFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function getFlagEmoji(name: string, tla?: string): string {
  if (tla && COUNTRY_TO_FLAG[tla.toUpperCase()]) {
    return COUNTRY_TO_FLAG[tla.toUpperCase()];
  }
  if (tla && tla.length === 2 && /^[A-Z]{2}$/i.test(tla)) {
    return toFlagEmoji(tla);
  }
  if (COUNTRY_TO_FLAG[name]) {
    return COUNTRY_TO_FLAG[name];
  }
  if (name && name.length === 2 && /^[A-Z]{2}$/i.test(name)) {
    return toFlagEmoji(name);
  }
  for (const [key, value] of Object.entries(COUNTRY_TO_FLAG)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  // Safe default
  return '🏴';
}

/**
 * Perform a fetch with our rate limiting headers and 60s caching protection
 */
export async function fetchWithRateLimit(url: string, options: RequestInit = {}): Promise<any> {
  const cacheKey = url + JSON.stringify(options);
  const now = Date.now();

  // Check cache hit
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_TTL)) {
    console.log(`[FootballAPI] Cache Hit for: ${url}`);
    return cache[cacheKey].data;
  }

  // Rate Limiting Protection Check: If we ran out of calls, throw or wait
  if (requestsAvailableMinute <= 0) {
    const elapsedSinceLastReset = Math.floor((now - lastResponseTime) / 1000);
    if (elapsedSinceLastReset < requestCounterReset) {
      const waitTime = requestCounterReset - elapsedSinceLastReset;
      console.warn(`[FootballAPI] Near rate limit limit reached! Waiting ${waitTime}s.`);
      
      // Serve cached version as safety safeguard, even if expired
      if (cache[cacheKey]) {
        console.warn(`[FootballAPI] Utilizing expired cached data for: ${url} due to rate limits`);
        return cache[cacheKey].data;
      }
      throw new Error(`Rate limit reached. Please retry in ${waitTime} seconds.`);
    } else {
      // Proactively reset rate limit locally
      requestsAvailableMinute = 10;
    }
  }

  // Header injections from env configuration
  let apiToken = 'd0b2bdb325';
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN) {
    apiToken = process.env.NEXT_PUBLIC_FOOTBALL_API_TOKEN;
  } else {
    try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv.NEXT_PUBLIC_FOOTBALL_API_TOKEN) {
        apiToken = metaEnv.NEXT_PUBLIC_FOOTBALL_API_TOKEN;
      }
    } catch {
      // safe fallback
    }
  }
  const headers = {
    ...options.headers,
    'X-Auth-Token': apiToken,
  };

  const response = await fetch(url, { ...options, headers });

  // Update headers counters
  const reqAvailable = response.headers.get('X-Requests-Available-Minute');
  const reqReset = response.headers.get('X-RequestCounter-Reset');

  if (reqAvailable !== null) {
    requestsAvailableMinute = parseInt(reqAvailable, 10);
  }
  if (reqReset !== null) {
    requestCounterReset = parseInt(reqReset, 10);
  }
  lastResponseTime = Date.now();

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Football API Error (${response.status}): ${errorText || response.statusText}`);
  }

  const jsonResult = await response.json();
  
  // Cache response
  cache[cacheKey] = {
    data: jsonResult,
    timestamp: now
  };

  return jsonResult;
}

/**
 * Smart getter that requests World Cup (WC) first, falling back to Premier League (PL) on failures or licensing limits
 */
export async function fetchCompetitionData(endpoint: string): Promise<{ data: any; code: 'WC' | 'PL' }> {
  try {
    const url = `${BASE_URL}/competitions/WC${endpoint}`;
    console.log(`[FootballAPI] Attempting WC request: ${url}`);
    const res = await fetchWithRateLimit(url);
    return { data: res, code: 'WC' };
  } catch (error: any) {
    console.warn(`[FootballAPI] WC competition endpoint failed, fallback to PL:`, error.message);
    const url = `${BASE_URL}/competitions/PL${endpoint}`;
    const res = await fetchWithRateLimit(url);
    return { data: res, code: 'PL' };
  }
}

export async function getFootballData(endpoint: string, fallbackToPL: boolean = true): Promise<any> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (fallbackToPL) {
    let childEndpoint = cleanEndpoint;
    if (cleanEndpoint.startsWith('/competitions/WC')) {
      childEndpoint = cleanEndpoint.replace('/competitions/WC', '');
    }
    const res = await fetchCompetitionData(childEndpoint);
    return res.data;
  } else {
    const fullUrl = cleanEndpoint.startsWith('http') ? cleanEndpoint : `${BASE_URL}${cleanEndpoint}`;
    return await fetchWithRateLimit(fullUrl);
  }
}
