/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  slug: string;
  group_letter: string;
  coach_name: string;
  coach_nationality: string;
  confederation: string;
  win_probability: number;
  win_factors: string;
  fifa_ranking: number;
  best_case: string;
  realistic_target: string;
  flag: string; // flag emoji
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  rating: number;
  club: string;
  age: number;
  shirt_number: number;
}

export interface Group {
  id: string;
  letter: string;
  nickname: string;
  difficulty: 'Easy' | 'Competitive' | 'Group of Death';
}

export interface Match {
  id: string;
  group_letter?: string;
  team_home_id: string;
  team_away_id: string;
  score_home: number | null;
  score_away: number | null;
  match_date: string;
  venue: string;
  stage: 'Group' | 'Round of 32' | 'Round of 16' | 'Quarterfinals' | 'Semifinals' | 'Final';
  played: boolean;
  // Join properties (optional, added dynamically)
  home_team?: Team;
  away_team?: Team;
}

export interface GroupStandings {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // goals for
  ga: number; // goals against
  gd: number; // goals diff
  points: number;
}
