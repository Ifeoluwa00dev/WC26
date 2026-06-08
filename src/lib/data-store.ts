/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Player, Group, Match, GroupStandings } from '../types';

// Simple seeded random function to guarantee consistent outputs on every reload
export class LCG {
  private m = 0x80000000; // 2**31
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: number) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  nextInt(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }

  nextFloat(): number {
    return this.nextInt() / (this.m - 1);
  }

  // Float between min and max
  range(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  // Integer between min and max inclusive
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  choice<T>(arr: T[]): T {
    const idx = Math.floor(this.nextFloat() * arr.length);
    return arr[idx];
  }
}

// Procedural names generator lists to provide ultra-realistic squads
const NAMES_DB: Record<string, { first: string[]; last: string[] }> = {
  anglo: {
    first: ['Brandon', 'Jordan', 'Callum', 'Tyler', 'Marcus', 'Gareth', 'Harry', 'Declan', 'Mason', 'Jude', 'Bukayo', 'Conor', 'Ethan', 'Kieran', 'Harvey', 'Reece', 'Jack', 'Luke', 'Tyrone', 'Ollie', 'James', 'Liam', 'Ewan', 'Lewis', 'Che', 'Danny'],
    last: ['Smith', 'Walker', 'Rice', 'Bellingham', 'Saka', 'Stones', 'Trippier', 'Gallagher', 'Palmer', 'Foden', 'Kane', 'Pickford', 'Ramsdale', 'Shaw', 'Maguire', 'Alexander-Arnold', 'Henderson', 'Watkins', 'Adams', 'Gilmour', 'McTominay', 'Robertson', 'Johnson', 'Bailey', 'Antonio', 'Blake']
  },
  spanish: {
    first: ['Mateo', 'Santiago', 'Emiliano', 'Enzo', 'Lautaro', 'Julian', 'Angel', 'Nahuel', 'Rodrigo', 'Nicolas', 'Alexis', 'Leandro', 'Gonzalo', 'Geronimo', 'Lucas', 'Guido', 'Marcos', 'German', 'Alejandro', 'Lisandro', 'Valentino', 'Alvaro', 'Javier', 'Sandro', 'Pau', 'Dani'],
    last: ['Gomez', 'Fernandez', 'Martinez', 'Alvarez', 'Gonzalez', 'Rodriguez', 'Paredes', 'De Paul', 'Molina', 'Tagliafico', 'Acuna', 'Romero', 'Otamendi', 'Montiel', 'Palacios', 'Mac Allister', 'Di Maria', 'Correa', 'Rulli', 'Armani', 'Garnacho', 'Soto', 'Herrera', 'Torres', 'Perez', 'Ruiz']
  },
  french: {
    first: ['Kylian', 'Antoine', 'Olivier', 'Ousmane', 'Aurélien', 'Eduardo', 'Adrien', 'Youssouf', 'Jonathan', 'Theo', 'Dayot', 'William', 'Ibrahima', 'Benjamin', 'Lucas', 'Brice', 'Alphonse', 'Mike', 'Kingsley', 'Randal', 'Marcus', 'Warren', 'Christopher', 'Saliba', 'Karim', 'Pierre'],
    last: ['Mbappé', 'Griezmann', 'Giroud', 'Dembélé', 'Tchouaméni', 'Camavinga', 'Rabiot', 'Fofana', 'Clauss', 'Hernández', 'Upamecano', 'Saliba', 'Konaté', 'Pavard', 'Thuram', 'Samba', 'Areola', 'Maignan', 'Coman', 'Kolo Muani', 'Zaire-Emery', 'Nkunku', 'Koundé', 'Mendy', 'Dubois', 'Leroy']
  },
  portuguese: {
    first: ['Cristiano', 'Bruno', 'Bernardo', 'Ruben', 'Rafael', 'João', 'Diogo', 'Vitinha', 'Matheus', 'Gonçalo', 'Pedro', 'Danilo', 'Nuno', 'Nelson', 'Pepe', 'Jose', 'Rui', 'Otavio', 'Francisco', 'Antonio', 'Tiago', 'Andre', 'Fabio', 'Geraldo', 'Manuel', 'Ricardo'],
    last: ['Ronaldo', 'Fernandes', 'Silva', 'Dias', 'Leão', 'Félix', 'Jota', 'Cancelo', 'Mendes', 'Nunes', 'Ramos', 'Neto', 'Pereira', 'Semedo', 'Neves', 'Sá', 'Patrício', 'Palhinha', 'Conceição', 'Inácio', 'Guerreiro', 'Gomes', 'Almeida', 'Monteiro', 'Cardoso', 'Sousa']
  },
  german: {
    first: ['Florian', 'Jamal', 'Thomas', 'Kai', 'Leroy', 'Joshua', 'Ilkay', 'Leon', 'Toni', 'Maximilian', 'Robin', 'Antonio', 'Jonathan', 'Benjamin', 'Marc', 'Manuel', 'Oliver', 'Nico', 'David', 'Gregor', 'Yann', 'Granit', 'Breel', 'Ruben', 'Fabian', 'Silvan'],
    last: ['Wirtz', 'Musiala', 'Müller', 'Havertz', 'Sané', 'Kimmich', 'Gündoğan', 'Goretzka', 'Kroos', 'Beier', 'Gosens', 'Rüdiger', 'Tah', 'Henrichs', 'Ter Stegen', 'Neuer', 'Baumann', 'Schlotterbeck', 'Raum', 'Kobel', 'Sommer', 'Xhaka', 'Embolo', 'Vargas', 'Schär', 'Widmer']
  },
  arabic: {
    first: ['Mohamed', 'Ahmed', 'Youssef', 'Amine', 'Riyad', 'Sofiane', 'Saïd', 'Ismaël', 'Aissa', 'Ramy', 'Nabil', 'Baghdad', 'Yassine', 'Achraf', 'Hakim', 'Noussair', 'Nayef', 'Selim', 'Azzedine', 'Sofyan', 'Bilal', 'Abderrazak', 'Youssef', 'Salem', 'Firas', 'Ali'],
    last: ['Salah', 'Hassan', 'Mahrez', 'Bennacer', 'Mandi', 'Bensebaini', 'Bentaleb', 'Bounedjah', 'Slimani', 'Bounou', 'Hakimi', 'Ziyech', 'Mazraoui', 'Aguerd', 'Amrabat', 'Ounahi', 'En-Nesyri', 'Boufal', 'El Khannouss', 'Cheddira', 'Al-Dawsari', 'Al-Shehri', 'Al-Muwallad', 'Al-Abed', 'Al-Owais', 'Al-Faraj']
  },
  asian: {
    first: ['Heung-min', 'Min-jae', 'Kang-in', 'Hee-chan', 'Gue-sung', 'Jae-sung', 'In-beom', 'Woo-yeong', 'Young-woo', 'Seung-gyu', 'Hiroshi', 'Kaoru', 'Takefusa', 'Wataru', 'Ritsu', 'Daichi', 'Ko', 'Shogo', 'Yukinari', 'Zion', 'Mehdi', 'Alireza', 'Sardar', 'Saman', 'Milad', 'Hossein'],
    last: ['Son', 'Kim', 'Lee', 'Hwang', 'Cho', 'Park', 'Jeong', 'Seol', 'Jo', 'Mitoma', 'Kubo', 'Endo', 'Doan', 'Kamada', 'Itakura', 'Taniguchi', 'Sugawara', 'Suzuki', 'Taremi', 'Jahanbakhsh', 'Azmoun', 'Goddos', 'Mohammadi', 'Hoszeini', 'Beiranvand', 'Kanani']
  },
  african: {
    first: ['Victor', 'Ademola', 'Alex', 'Wilfred', 'Moses', 'Kelechi', 'Samuel', 'Terem', 'Ola', 'William', 'Semi', 'Stanley', 'Sipho', 'Themba', 'Percy', 'Teboho', 'Ronwen', 'Aubrey', 'Mothobi', 'Khuliso', 'Thomas', 'Inaki', 'Mohammed', 'Jordan', 'Andre', 'Salis'],
    last: ['Osimhen', 'Lookman', 'Iwobi', 'Ndidi', 'Simon', 'Iheanacho', 'Chukwueze', 'Moffi', 'Aina', 'Troost-Ekong', 'Ajayi', 'Nwabali', 'Mokoena', 'Zwane', 'Tau', 'Williams', 'Modiba', 'Mvala', 'Mudau', 'Partey', 'Williams', 'Kudus', 'Ayew', 'Samed', 'Salar', 'Mensah']
  },
  croatian_ukrainian: {
    first: ['Luka', 'Mateo', 'Marcelo', 'Andrej', 'Ivan', 'Joško', 'Borna', 'Domagoj', 'Lovro', 'Mario', 'Dominik', 'Oleksandr', 'Artem', 'Mykhaylo', 'Viktor', 'Vitaliy', 'Ilya', 'Illia', 'Ruslan', 'Taras', 'Mykola', 'Andriy', 'Anatoliy', 'Heorhiy', 'Roman', 'Valeriy'],
    last: ['Modrić', 'Kovačić', 'Brozović', 'Kramarić', 'Perišić', 'Gvardiol', 'Sosa', 'Vida', 'Majer', 'Pasalić', 'Livaković', 'Zinchenko', 'Dovbyk', 'Mudryk', 'Tsygankov', 'Mykolenko', 'Zabarnyi', 'Malinovskyi', 'Stepanenko', 'Shaparenko', 'Yarmolenko', 'Trubin', 'Lunin', 'Yaremchuk', 'Sudakov', 'Karavayev']
  },
  italian: {
    first: ['Alessandro', 'Federico', 'Gianluigi', 'Nicolò', 'Giacomo', 'Davide', 'Gianluca', 'Manuel', 'Lorenzo', 'Bryan', 'Andrea', 'Giorgio', 'Matteo', 'Giovanni', 'Francesco', 'Riccardo', 'Moise', 'Mateo', 'Guglielmo', 'Alex', 'Cristiano', 'Destiny', 'Caleb', 'Gianmarco', 'Raoul', 'Stephan'],
    last: ['Bastoni', 'Chiesa', 'Donnarumma', 'Barella', 'Raspadori', 'Frattesi', 'Scamacca', 'Locatelli', 'Pellegrini', 'Cristante', 'Cambiaso', 'Scalvini', 'Darmian', 'Di Lorenzo', 'Acerbi', 'Gatti', 'Kean', 'Retegui', 'Vicario', 'Meret', 'Biraghi', 'Udogie', 'Okoli', 'Bellanova', 'Zaccagni', 'El Shaarawy']
  },
  dutch: {
    first: ['Virgil', 'Memphis', 'Frenkie', 'Cody', 'Xavi', 'Tijjani', 'Denzel', 'Nathan', 'Matthijs', 'Stefan', 'Jeremie', 'Bart', 'Mark', 'Justin', 'Brian', 'Wout', 'Georginio', 'Daley', 'Lutsharel', 'Micky', 'Quinten', 'Steven', 'Joey', 'Ryan', 'Jurrien', 'Daley'],
    last: ['van Dijk', 'Depay', 'de Jong', 'Gakpo', 'Simons', 'Reijnders', 'Dumfries', 'Aké', 'de Ligt', 'de Vrij', 'Frimpong', 'Verbruggen', 'Flekken', 'Bijlow', 'Brobbey', 'Weghorst', 'Wijnaldum', 'Blind', 'Geertruida', 'van de Ven', 'Timber', 'Bergwijn', 'Veerman', 'Gravenberch', 'Taylor', 'Malen']
  },
  nordic: {
    first: ['Alexander', 'Victor', 'Emil', 'Dejan', 'Robin', 'Ludwig', 'Filip', 'Ken', 'Jens', 'Anthony', 'Christian', 'Pierre-Emile', 'Joachim', 'Rasmus', 'Kasper', 'Jannik', 'Andreas', 'Victor', 'Mikkel', 'Morten', 'Gustav', 'Robert', 'Martin', 'Lars', 'Chris', 'Frederik'],
    last: ['Isak', 'Lindelöf', 'Forsberg', 'Kulusevki', 'Olsen', 'Augustinsson', 'Helander', 'Sema', 'Cajuste', 'Elanga', 'Eriksen', 'Højbjerg', 'Andersen', 'Højlund', 'Schmeichel', 'Vestergaard', 'Christensen', 'Kristiansen', 'Damsgaard', 'Hjulmand', 'Isaksen', 'Skov', 'Wind', 'Dolberg', 'Ronnow', 'Hermansen']
  },
};

// Map team slug to name region
const SLUG_TO_REGION: Record<string, string> = {
  usa: 'anglo', can: 'anglo', eng: 'anglo', aus: 'anglo', nzl: 'anglo', sco: 'anglo', wal: 'anglo', jam: 'anglo',
  mex: 'spanish', col: 'spanish', ecu: 'spanish', arg: 'spanish', esp: 'spanish', chi: 'spanish', per: 'spanish', hon: 'spanish', crc: 'spanish', uru: 'spanish',
  fra: 'french', cmr: 'french', mli: 'french', sen: 'french', cpv: 'french', bel: 'french',
  por: 'portuguese', bra: 'portuguese',
  ger: 'german', sui: 'german',
  ned: 'dutch',
  ita: 'italian',
  pol: 'croatian_ukrainian', cro: 'croatian_ukrainian', ukr: 'croatian_ukrainian',
  alg: 'arabic', qat: 'arabic', ksa: 'arabic', egy: 'arabic', tun: 'arabic',
  kor: 'asian', jpn: 'asian', irn: 'asian',
  nga: 'african', rsa: 'african', gha: 'african',
};

// 48 teams grouped into 12 Groups (A to L)
export const SEED_GROUPS: Group[] = [
  { id: 'group_a', letter: 'A', nickname: 'The Host Pool', difficulty: 'Competitive' },
  { id: 'group_b', letter: 'B', nickname: 'The Transatlantic Draw', difficulty: 'Competitive' },
  { id: 'group_c', letter: 'C', nickname: 'La Albiceleste Territory', difficulty: 'Easy' },
  { id: 'group_d', letter: 'D', nickname: 'Group of Death', difficulty: 'Group of Death' },
  { id: 'group_e', letter: 'E', nickname: 'Iberian Dominance', difficulty: 'Competitive' },
  { id: 'group_f', letter: 'F', nickname: 'Samba Spotlight', difficulty: 'Competitive' },
  { id: 'group_g', letter: 'G', nickname: 'The Heavyweights Clash', difficulty: 'Group of Death' },
  { id: 'group_h', letter: 'H', nickname: 'Trident Alliance', difficulty: 'Group of Death' },
  { id: 'group_i', letter: 'I', nickname: 'European-African Duels', difficulty: 'Competitive' },
  { id: 'group_j', letter: 'J', nickname: 'Balkan Battlegrounds', difficulty: 'Easy' },
  { id: 'group_k', letter: 'K', nickname: 'The Desert Highlands', difficulty: 'Easy' },
  { id: 'group_l', letter: 'L', nickname: 'Atlantic-Pacific Crossroads', difficulty: 'Easy' },
];

export const SEED_TEAMS: Team[] = [
  // Group A
  {
    id: 'usa', name: 'United States', slug: 'usa', group_letter: 'A',
    coach_name: 'Mauricio Pochettino', coach_nationality: 'Argentina', confederation: 'CONCACAF',
    win_probability: 2.5, win_factors: 'Unified squad, massive home advantage, and extremely dynamic young wingers. However, issues in defensive depth could pose challenges under heavy counter-pressing teams.',
    fifa_ranking: 16, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇺🇸'
  },
  {
    id: 'mex', name: 'Mexico', slug: 'mex', group_letter: 'A',
    coach_name: 'Javier Aguirre', coach_nationality: 'Mexico', confederation: 'CONCACAF',
    win_probability: 1.8, win_factors: 'Passionate fan support and experienced tournament veterans. Tactical flexibility is high under Aguirre, but struggles to score against structured low blocks remains a critical concern.',
    fifa_ranking: 31, best_case: 'Round of 16', realistic_target: 'Round of 16', flag: '🇲🇽'
  },
  {
    id: 'can', name: 'Canada', slug: 'can', group_letter: 'A',
    coach_name: 'Jesse Marsch', coach_nationality: 'United States', confederation: 'CONCACAF',
    win_probability: 1.2, win_factors: 'Elite athleticism, intense pressing, and world-class speed in transition led by Alphonso Davies. Tactically ambitious, but vulnerable out of possession in central spaces.',
    fifa_ranking: 38, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇦'
  },
  {
    id: 'alg', name: 'Algeria', slug: 'alg', group_letter: 'A',
    coach_name: 'Vladimir Petković', coach_nationality: 'Switzerland', confederation: 'CAF',
    win_probability: 1.0, win_factors: 'Excellent tactical discipline, standard defensive organization, and dangerous creative playmakers. Tendency to concede late in matches is their biggest hurdle.',
    fifa_ranking: 42, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇩🇿'
  },

  // Group B
  {
    id: 'eng', name: 'England', slug: 'eng', group_letter: 'B',
    coach_name: 'Thomas Tuchel', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 12.0, win_factors: 'Unbelievable attacking depth, Ballon d\'Or-level midfielders, and a world-class penalty box striker in Harry Kane. Managed by an elite tactical designer, they are prime contenders.',
    fifa_ranking: 3, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
  },
  {
    id: 'kor', name: 'South Korea', slug: 'kor', group_letter: 'B',
    coach_name: 'Hong Myung-bo', coach_nationality: 'South Korea', confederation: 'AFC',
    win_probability: 2.0, win_factors: 'Relentless speed, high operational fitness, and world-class individual brilliance via Son Heung-min. Defensive organization in transition needs strict coordination.',
    fifa_ranking: 22, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇰🇷'
  },
  {
    id: 'ecu', name: 'Ecuador', slug: 'ecu', group_letter: 'B',
    coach_name: 'Sebastián Beccacece', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 1.8, win_factors: 'High altitude conditioning, incredible physical power, and young tactical marvels like Moisés Caicedo. Struggles with clinical finishing in tight setups.',
    fifa_ranking: 30, best_case: 'Round of 16', realistic_target: 'Round of 16', flag: '🇪🇨'
  },
  {
    id: 'mli', name: 'Mali', slug: 'mli', group_letter: 'B',
    coach_name: 'Tom Saintfiet', coach_nationality: 'Belgium', confederation: 'CAF',
    win_probability: 0.8, win_factors: 'Highly dense physical midfield and defensive stability. Lack of global championship experience might result in critical errors under heavy modern press.',
    fifa_ranking: 44, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇲🇱'
  },

  // Group C
  {
    id: 'arg', name: 'Argentina', slug: 'arg', group_letter: 'C',
    coach_name: 'Lionel Scaloni', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 14.5, win_factors: 'The defending world champions. Elite squad harmony, dynamic tactical flexibility, and the immortal threat of Lionel Messi. Their midfield controller network is unmatched.',
    fifa_ranking: 1, best_case: 'Winner', realistic_target: 'Final', flag: '🇦🇷'
  },
  {
    id: 'pol', name: 'Poland', slug: 'pol', group_letter: 'C',
    coach_name: 'Michał Probierz', coach_nationality: 'Poland', confederation: 'UEFA',
    win_probability: 1.5, win_factors: 'Relies heavily on Robert Lewandowski\'s penalty area efficiency and solid physical low block defenses. Midfield supply lines are often disconnected.',
    fifa_ranking: 26, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇵🇱'
  },
  {
    id: 'cmr', name: 'Cameroon', slug: 'cmr', group_letter: 'C',
    coach_name: 'Marc Brys', coach_nationality: 'Belgium', confederation: 'CAF',
    win_probability: 0.8, win_factors: 'Indomitable spirit, robust defensive duelists, and clinical aerial prowess. However, transition organization against quick counters is extremely vulnerable.',
    fifa_ranking: 51, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇲'
  },
  {
    id: 'aus', name: 'Australia', slug: 'aus', group_letter: 'C',
    coach_name: 'Tony Popovic', coach_nationality: 'Australia', confederation: 'AFC',
    win_probability: 1.1, win_factors: 'Resilient team culture, organized direct transition play, and elite set-piece defense. The squad lacks elite individual playmakers in the final third.',
    fifa_ranking: 24, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇦🇺'
  },

  // Group D
  {
    id: 'fra', name: 'France', slug: 'fra', group_letter: 'D',
    coach_name: 'Didier Deschamps', coach_nationality: 'France', confederation: 'UEFA',
    win_probability: 13.8, win_factors: 'A squad of supreme athletic power, featuring the absolute best player in the world, Kylian Mbappé. Double-layered blocks and lightning offensive transitional execution.',
    fifa_ranking: 2, best_case: 'Winner', realistic_target: 'Final', flag: '🇫🇷'
  },
  {
    id: 'sen', name: 'Senegal', slug: 'sen', group_letter: 'D',
    coach_name: 'Pape Thiaw', coach_nationality: 'Senegal', confederation: 'CAF',
    win_probability: 3.0, win_factors: 'Strong veteran base combined with extremely talented academy stars. Outstanding physical stature, dynamic wingers, and excellent defensive leadership. True dark horse.',
    fifa_ranking: 20, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇸🇳'
  },
  {
    id: 'col', name: 'Colombia', slug: 'col', group_letter: 'D',
    coach_name: 'Néstor Lorenzo', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 4.0, win_factors: 'High-energy pressing scheme, amazing creative genius of Luis Díaz, and elite defensive transition control. One of the strongest South American teams.',
    fifa_ranking: 12, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇨🇴'
  },
  {
    id: 'irq', name: 'Iraq', slug: 'irq', group_letter: 'D',
    coach_name: 'Jesús Casas', coach_nationality: 'Spain', confederation: 'AFC',
    win_probability: 0.5, win_factors: 'Well-drilled tactical mid-block and resilient team ethic. Serious concerns with tempo management against top-tier physical midfields.',
    fifa_ranking: 55, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇮🇶'
  },

  // Group E
  {
    id: 'esp', name: 'Spain', slug: 'esp', group_letter: 'E',
    coach_name: 'Luis de la Fuente', coach_nationality: 'Spain', confederation: 'UEFA',
    win_probability: 11.5, win_factors: 'The Euro champions. Incredible possession control combined with lethal, explosive wing wizards Lamine Yamal and Nico Williams. Extremely robust counter-press structures.',
    fifa_ranking: 4, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇪🇸'
  },
  {
    id: 'sui', name: 'Switzerland', slug: 'sui', group_letter: 'E',
    coach_name: 'Murat Yakin', coach_nationality: 'Switzerland', confederation: 'UEFA',
    win_probability: 2.2, win_factors: 'Tactically immaculate. Capable of building deep, resilient blocks and transitioning through Granit Xhaka\'s dictatorial passing. Lacks a high-volume clinical forward.',
    fifa_ranking: 15, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇨🇭'
  },
  {
    id: 'egy', name: 'Egypt', slug: 'egy', group_letter: 'E',
    coach_name: 'Hossam Hassan', coach_nationality: 'Egypt', confederation: 'CAF',
    win_probability: 1.5, win_factors: 'Anchored by the world-class superstar Mohamed Salah. Capable of clinical breakaway counters, but overall central midfield creativity is slightly limited.',
    fifa_ranking: 36, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇪🇬'
  },
  {
    id: 'hon', name: 'Honduras', slug: 'hon', group_letter: 'E',
    coach_name: 'Reinaldo Rueda', coach_nationality: 'Colombia', confederation: 'CONCACAF',
    win_probability: 0.3, win_factors: 'Highly committed defensive physical setup. Struggling heavily to keep possession under elite positional counter-press regimes.',
    fifa_ranking: 78, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇭🇳'
  },

  // Group F
  {
    id: 'bra', name: 'Brazil', slug: 'bra', group_letter: 'F',
    coach_name: 'Dorival Júnior', coach_nationality: 'Brazil', confederation: 'CONMEBOL',
    win_probability: 11.0, win_factors: 'Supreme individual skill, direct fast wings led by Vinicius Jr, and incredible goalkeeper confidence. Structural build-up consistency under Dorival can occasionally waver.',
    fifa_ranking: 5, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇧🇷'
  },
  {
    id: 'jpn', name: 'Japan', slug: 'jpn', group_letter: 'F',
    coach_name: 'Hajime Moriyasu', coach_nationality: 'Japan', confederation: 'AFC',
    win_probability: 3.5, win_factors: 'Superb organizational fluidity, supreme tactical discipline, and quick technical transitions. Their squad features a massive roster of European tier starters. Elite Dark Horse.',
    fifa_ranking: 17, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇯🇵'
  },
  {
    id: 'gha', name: 'Ghana', slug: 'gha', group_letter: 'F',
    coach_name: 'Otto Addo', coach_nationality: 'Ghana', confederation: 'CAF',
    win_probability: 0.7, win_factors: 'Excellent physical profile, highly combative runners, and dangerous direct playmakers. Struggles to sustain tactical focus across the full 90 minutes.',
    fifa_ranking: 64, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇬🇭'
  },
  {
    id: 'crc', name: 'Costa Rica', slug: 'crc', group_letter: 'F',
    coach_name: 'Claudio Vivas', coach_nationality: 'Argentina', confederation: 'CONCACAF',
    win_probability: 0.6, win_factors: 'Deep-lying defensive block built around historical World Cup resilience. Lack of fast transitional outlets is a notable weakness.',
    fifa_ranking: 52, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇨🇷'
  },

  // Group G
  {
    id: 'por', name: 'Portugal', slug: 'por', group_letter: 'G',
    coach_name: 'Roberto Martínez', coach_nationality: 'Spain', confederation: 'UEFA',
    win_probability: 9.0, win_factors: 'Amazing central creativity and unparalleled squad depth. Anchored by the experience of Cristiano Ronaldo paired with world-class playmakers. Defensively stable, but tactical setup can feel rigid at times.',
    fifa_ranking: 7, best_case: 'Winner', realistic_target: 'Quarterfinals', flag: '🇵🇹'
  },
  {
    id: 'ned', name: 'Netherlands', slug: 'ned', group_letter: 'G',
    coach_name: 'Ronald Koeman', coach_nationality: 'Netherlands', confederation: 'UEFA',
    win_probability: 8.5, win_factors: 'Strongest defensive line in the world led by Virgil van Dijk. Very dangerous wingback systems, but lacks a premium world-class striker to finish final-third entries.',
    fifa_ranking: 8, best_case: 'Winner', realistic_target: 'Quarterfinals', flag: '🇳🇱'
  },
  {
    id: 'mar', name: 'Morocco', slug: 'mar', group_letter: 'G',
    coach_name: 'Walid Regragui', coach_nationality: 'Morocco', confederation: 'CAF',
    win_probability: 4.5, win_factors: 'The historic semifinalists. Unmatched defensive synergy, elite fullbacks (Achraf Hakimi), and supreme transitional discipline. Excellent tactical engine, formidable block.',
    fifa_ranking: 13, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇲🇦'
  },
  {
    id: 'ukr', name: 'Ukraine', slug: 'ukr', group_letter: 'G',
    coach_name: 'Serhiy Rebrov', coach_nationality: 'Ukraine', confederation: 'UEFA',
    win_probability: 1.6, win_factors: 'Resilient and united group. Excellent wing creators and a clinical central goalscorer in Artem Dovbyk. Depth in midfield remains an issue under heavy fatigue.',
    fifa_ranking: 25, best_case: 'Round of 16', realistic_target: 'Round of 16', flag: '🇺🇦'
  },

  // Group H
  {
    id: 'ita', name: 'Italy', slug: 'ita', group_letter: 'H',
    coach_name: 'Luciano Spalletti', coach_nationality: 'Italy', confederation: 'UEFA',
    win_probability: 7.5, win_factors: 'Incredible midfield rotation and modern fluid tactical setups. Strong positional awareness under Spalletti, but lacks a high-volume reliable clinical target man.',
    fifa_ranking: 9, best_case: 'Winner', realistic_target: 'Quarterfinals', flag: '🇮🇹'
  },
  {
    id: 'uru', name: 'Uruguay', slug: 'uru', group_letter: 'H',
    coach_name: 'Marcelo Bielsa', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 6.5, win_factors: 'Relentless high-intensity man-pressing, supercharged transition sprints, and elite defensive warriors. High risk of exhaustion or tactical breaches if pressing trigger fails.',
    fifa_ranking: 11, best_case: 'Winner', realistic_target: 'Quarterfinals', flag: '🇺🇾'
  },
  {
    id: 'swe', name: 'Sweden', slug: 'swe', group_letter: 'H',
    coach_name: 'Jon Dahl Tomasson', coach_nationality: 'Denmark', confederation: 'UEFA',
    win_probability: 1.4, win_factors: 'Outstanding aerial threat, structured direct physical combinations, and solid central control. Struggles to matches pace against rapid transition runners.',
    fifa_ranking: 28, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇸🇪'
  },
  {
    id: 'tun', name: 'Tunisia', slug: 'tun', group_letter: 'H',
    coach_name: 'Kais Yaâkoubi', coach_nationality: 'Tunisia', confederation: 'CAF',
    win_probability: 0.6, win_factors: 'Highly dense defensive layout, physical engine, and organized set plays. Disconnected build-up options often leave forwards entirely isolated.',
    fifa_ranking: 47, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇹🇳'
  },

  // Group I
  {
    id: 'ger', name: 'Germany', slug: 'ger', group_letter: 'I',
    coach_name: 'Julian Nagelsmann', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 10.0, win_factors: 'Tactical masterpieces under Nagelsmann. Unbelievable dual playmaker threat in Wirtz and Musiala operating in the half-spaces. Prone to standard transitional defensive errors.',
    fifa_ranking: 6, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇩🇪'
  },
  {
    id: 'bel', name: 'Belgium', slug: 'bel', group_letter: 'I',
    coach_name: 'Domenico Tedesco', coach_nationality: 'Italy', confederation: 'UEFA',
    win_probability: 5.0, win_factors: 'Dangerous transitional elements powered by Kevin De Bruyne\'s vision. The defense is in a major transitional phase with young, untested profiles.',
    fifa_ranking: 10, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇧🇪'
  },
  {
    id: 'nga', name: 'Nigeria', slug: 'nga', group_letter: 'I',
    coach_name: 'Augustine Eguavoen', coach_nationality: 'Nigeria', confederation: 'CAF',
    win_probability: 1.8, win_factors: 'Boasts the most clinical striker in Africa, Victor Osimhen, supported by Ademola Lookman. Disconnect between defense and attacking lines frequently breaks their possession flow.',
    fifa_ranking: 40, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇳🇬'
  },
  {
    id: 'rsa', name: 'South Africa', slug: 'rsa', group_letter: 'I',
    coach_name: 'Hugo Broos', coach_nationality: 'Belgium', confederation: 'CAF',
    win_probability: 0.7, win_factors: 'Outstanding squad synergy based on domestic club chemistry. Technical ball retention is quite clean, but struggles severely with elite aerial threat duels.',
    fifa_ranking: 59, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇿🇦'
  },

  // Group J
  {
    id: 'cro', name: 'Croatia', slug: 'cro', group_letter: 'J',
    coach_name: 'Zlatko Dalić', coach_nationality: 'Croatia', confederation: 'UEFA',
    win_probability: 3.0, win_factors: 'Elite veteran midfield controllers led by the immortal Luka Modrić. Experience in critical high-pressure moments is unmatched, but aging legs are a liability.',
    fifa_ranking: 14, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇭🇷'
  },
  {
    id: 'den', name: 'Denmark', slug: 'den', group_letter: 'J',
    coach_name: 'Brian Riemer', coach_nationality: 'Denmark', confederation: 'UEFA',
    win_probability: 2.0, win_factors: 'Strong team harmony, elite set piece design, and a balanced midfield. Lack of a world-class finisher reduces their threat level.',
    fifa_ranking: 21, best_case: 'Round of 16', realistic_target: 'Round of 16', flag: '🇩🇰'
  },
  {
    id: 'irn', name: 'Iran', slug: 'irn', group_letter: 'J',
    coach_name: 'Amir Ghalenoei', coach_nationality: 'Iran', confederation: 'AFC',
    win_probability: 1.2, win_factors: 'Deadly forward partnership of Mehdi Taremi and Sardar Azmoun. Well-disciplined structural block, but struggles to maintain energy against physical midfields.',
    fifa_ranking: 19, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇮🇷'
  },
  {
    id: 'nzl', name: 'New Zealand', slug: 'nzl', group_letter: 'J',
    coach_name: 'Darren Bazeley', coach_nationality: 'England', confederation: 'OFC',
    win_probability: 0.2, win_factors: 'Highly physical defense and target-man output on direct balls. Lacks depth and high-level international championship experience.',
    fifa_ranking: 94, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇳🇿'
  },

  // Group K
  {
    id: 'chi', name: 'Chile', slug: 'chi', group_letter: 'K',
    coach_name: 'Ricardo Gareca', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 1.0, win_factors: 'Elite combative history and high tactical combativeness. Slow defensive pace under fast wing transition setups can be highly exposing.',
    fifa_ranking: 43, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇱'
  },
  {
    id: 'ksa', name: 'Saudi Arabia', slug: 'ksa', group_letter: 'K',
    coach_name: 'Roberto Mancini', coach_nationality: 'Italy', confederation: 'AFC',
    win_probability: 0.8, win_factors: 'High tactical integration and solid resources. Compact structure, but struggles to maintain shape away from regional conditions.',
    fifa_ranking: 56, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇸🇦'
  },
  {
    id: 'sco', name: 'Scotland', slug: 'sco', group_letter: 'K',
    coach_name: 'Steve Clarke', coach_nationality: 'Scotland', confederation: 'UEFA',
    win_probability: 1.1, win_factors: 'Incredible fan spirit and high work-rate. Outstanding fullbacks (Andy Robertson), but lacks high-volume offensive threat creators.',
    fifa_ranking: 50, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
  },
  {
    id: 'cpv', name: 'Cape Verde', slug: 'cpv', group_letter: 'K',
    coach_name: 'Bubista', coach_nationality: 'Cape Verde', confederation: 'CAF',
    win_probability: 0.5, win_factors: 'Technically fluid players with strong athletic profiles. Lack of tournament consistency weakens their overall knockout viability.',
    fifa_ranking: 65, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇨🇻'
  },

  // Group L
  {
    id: 'per', name: 'Peru', slug: 'per', group_letter: 'L',
    coach_name: 'Jorge Fossati', coach_nationality: 'Uruguay', confederation: 'CONMEBOL',
    win_probability: 1.0, win_factors: 'Strong veteran block and outstanding direct physical combinations. Lack of young technical talent leaves them vulnerable in quick-tempo matchups.',
    fifa_ranking: 35, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇵🇪'
  },
  {
    id: 'qat', name: 'Qatar', slug: 'qat', group_letter: 'L',
    coach_name: 'Tintín Márquez', coach_nationality: 'Spain', confederation: 'AFC',
    win_probability: 0.8, win_factors: 'Highly synchronized squad with excellent continental trophy success. Severe lack of global standard physical depth in central lines.',
    fifa_ranking: 46, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇶🇦'
  },
  {
    id: 'wal', name: 'Wales', slug: 'wal', group_letter: 'L',
    coach_name: 'Craig Bellamy', coach_nationality: 'Wales', confederation: 'UEFA',
    win_probability: 1.3, win_factors: 'Bellamy\'s intense modern transition systems and cohesive spirit. Strong reliance on young speedy wingers, but defensive depth is quite shallow.',
    fifa_ranking: 29, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
  },
  {
    id: 'jam', name: 'Jamaica', slug: 'jam', group_letter: 'L',
    coach_name: 'Steve McClaren', coach_nationality: 'England', confederation: 'CONCACAF',
    win_probability: 0.9, win_factors: 'Exciting Premier League talents (Leon Bailey, Michail Antonio) present high transitional threat. Low defensive tactical unity could be highly punishing against top European possession blocks.',
    fifa_ranking: 53, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇯🇲'
  },
];

// Defined super stars override list to guarantee realistic rosters and ratings
const STARS_OVERRIDE: Record<string, Array<{ name: string; pos: 'GK' | 'DF' | 'MF' | 'FW'; rating: number; club: string }>> = {
  arg: [
    { name: 'Lionel Messi', pos: 'FW', rating: 91, club: 'Inter Miami' },
    { name: 'Lautaro Martínez', pos: 'FW', rating: 89, club: 'Inter Milan' },
    { name: 'Alexis Mac Allister', pos: 'MF', rating: 87, club: 'Liverpool' },
    { name: 'Emiliano Martínez', pos: 'GK', rating: 89, club: 'Aston Villa' },
    { name: 'Enzo Fernández', pos: 'MF', rating: 85, club: 'Chelsea' },
  ],
  fra: [
    { name: 'Kylian Mbappé', pos: 'FW', rating: 93, club: 'Real Madrid' },
    { name: 'William Saliba', pos: 'DF', rating: 89, club: 'Arsenal' },
    { name: 'Mike Maignan', pos: 'GK', rating: 87, club: 'AC Milan' },
    { name: 'Antoine Griezmann', pos: 'FW', rating: 87, club: 'Atletico Madrid' },
    { name: 'Aurélien Tchouaméni', pos: 'MF', rating: 86, club: 'Real Madrid' },
  ],
  esp: [
    { name: 'Rodri', pos: 'MF', rating: 93, club: 'Manchester City' },
    { name: 'Lamine Yamal', pos: 'FW', rating: 91, club: 'Barcelona' },
    { name: 'Pedri', pos: 'MF', rating: 88, club: 'Barcelona' },
    { name: 'Nico Williams', pos: 'FW', rating: 88, club: 'Athletic Bilbao' },
    { name: 'Dani Carvajal', pos: 'DF', rating: 87, club: 'Real Madrid' },
  ],
  eng: [
    { name: 'Jude Bellingham', pos: 'MF', rating: 91, club: 'Real Madrid' },
    { name: 'Harry Kane', pos: 'FW', rating: 90, club: 'Bayern Munich' },
    { name: 'Bukayo Saka', pos: 'FW', rating: 89, club: 'Arsenal' },
    { name: 'Phil Foden', pos: 'MF', rating: 89, club: 'Manchester City' },
    { name: 'Declan Rice', pos: 'MF', rating: 88, club: 'Arsenal' },
    { name: 'John Stones', pos: 'DF', rating: 87, club: 'Manchester City' },
  ],
  bra: [
    { name: 'Vinicius Junior', pos: 'FW', rating: 92, club: 'Real Madrid' },
    { name: 'Alisson', pos: 'GK', rating: 88, club: 'Liverpool' },
    { name: 'Rodrygo', pos: 'FW', rating: 87, club: 'Real Madrid' },
    { name: 'Bruno Guimarães', pos: 'MF', rating: 86, club: 'Newcastle United' },
    { name: 'Marquinhos', pos: 'DF', rating: 86, club: 'Paris Saint-Germain' },
  ],
  por: [
    { name: 'Rúben Dias', pos: 'DF', rating: 89, club: 'Manchester City' },
    { name: 'Bruno Fernandes', pos: 'MF', rating: 89, club: 'Manchester United' },
    { name: 'Cristiano Ronaldo', pos: 'FW', rating: 88, club: 'Al Nassr' },
    { name: 'Bernardo Silva', pos: 'MF', rating: 88, club: 'Manchester City' },
    { name: 'Rafael Leão', pos: 'FW', rating: 88, club: 'AC Milan' },
  ],
  ger: [
    { name: 'Florian Wirtz', pos: 'MF', rating: 90, club: 'Bayer Leverkusen' },
    { name: 'Jamal Musiala', pos: 'MF', rating: 90, club: 'Bayern Munich' },
    { name: 'Marc-André ter Stegen', pos: 'GK', rating: 87, club: 'Barcelona' },
    { name: 'Antonio Rüdiger', pos: 'DF', rating: 87, club: 'Real Madrid' },
  ],
  egy: [
    { name: 'Mohamed Salah', pos: 'FW', rating: 90, club: 'Liverpool' },
  ],
  kor: [
    { name: 'Heung-min Son', pos: 'FW', rating: 88, club: 'Tottenham Hotspur' },
    { name: 'Min-jae Kim', pos: 'DF', rating: 86, club: 'Bayern Munich' },
  ],
  bel: [
    { name: 'Kevin De Bruyne', pos: 'MF', rating: 90, club: 'Manchester City' },
    { name: 'Romelu Lukaku', pos: 'FW', rating: 84, club: 'Napoli' },
  ],
  pol: [
    { name: 'Robert Lewandowski', pos: 'FW', rating: 88, club: 'Barcelona' },
  ],
  mar: [
    { name: 'Achraf Hakimi', pos: 'DF', rating: 88, club: 'Paris Saint-Germain' },
    { name: 'Yassine Bounou', pos: 'GK', rating: 84, club: 'Al Hilal' },
  ],
  nga: [
    { name: 'Victor Osimhen', pos: 'FW', rating: 88, club: 'Galatasaray' },
    { name: 'Ademola Lookman', pos: 'FW', rating: 84, club: 'Atalanta' },
  ],
  usa: [
    { name: 'Christian Pulisic', pos: 'FW', rating: 85, club: 'AC Milan' },
    { name: 'Weston McKennie', pos: 'MF', rating: 80, club: 'Juventus' },
  ],
  col: [
    { name: 'Luis Díaz', pos: 'FW', rating: 86, club: 'Liverpool' },
    { name: 'James Rodríguez', pos: 'MF', rating: 81, club: 'Rayo Vallecano' },
  ],
  cro: [
    { name: 'Luka Modrić', pos: 'MF', rating: 85, club: 'Real Madrid' },
    { name: 'Joško Gvardiol', pos: 'DF', rating: 87, club: 'Manchester City' },
  ]
};

// Procedural club database
const POP_CLUBS = [
  'Real Madrid', 'Manchester City', 'Barcelona', 'Arsenal', 'Liverpool', 'Bayern Munich',
  'Juventus', 'AC Milan', 'Inter Milan', 'Paris Saint-Germain', 'Atletico Madrid', 'Chelsea',
  'Manchester United', 'Tottenham Hotspur', 'Bayer Leverkusen', 'Borussia Dortmund',
  'Galatasaray', 'Al Hilal', 'Al Nassr', 'Sporting CP', 'Benfica', 'FC Porto', 'Lazio',
  'Aston Villa', 'Newcastle United', 'West Ham', 'Feyenoord', 'PSV Eindhoven', 'Ajax'
];

// Generate consistent squads for all teams
export function generateProceduralSquads(teams: Team[]): Player[] {
  const players: Player[] = [];
  
  teams.forEach((team) => {
    // Determine average rating based on FIFA rank and win probability
    // FIFA rank 1 is 87.5; rank 94 is 71.0
    const baseMean = 88 - (team.fifa_ranking * 0.16);
    const meanRating = Math.max(70, Math.min(92, baseMean));
    
    // Seed using ASCII code of the team slug
    let charSum = 0;
    for (let i = 0; i < team.slug.length; i++) charSum += team.slug.charCodeAt(i);
    const rng = new LCG(charSum + 2026);
    
    const regKey = SLUG_TO_REGION[team.slug] || 'anglo';
    const names = NAMES_DB[regKey];
    
    const overrides = STARS_OVERRIDE[team.slug] || [];
    
    // Roster distribution: 3 GK, 8 DF, 8 MF, 7 FW = 26 players
    const positions: Array<'GK' | 'DF' | 'MF' | 'FW'> = [
      'GK', 'GK', 'GK',
      'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
      'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF',
      'FW', 'FW', 'FW', 'FW', 'FW', 'FW', 'FW'
    ];
    
    // Shirt numbers
    const shirtNumbers = Array.from({ length: 26 }, (_, i) => i + 1);
    
    for (let index = 0; index < 26; index++) {
      const pos = positions[index];
      const shirt = shirtNumbers[index];
      
      // Determine if clean match available in overrides
      const overrideIndex = overrides.findIndex(o => o.pos === pos);
      let pName = '';
      let pRating = 0;
      let pClub = '';
      let pAge = rng.rangeInt(18, 35);
      
      if (overrideIndex !== -1) {
        const star = overrides[overrideIndex];
        pName = star.name;
        pRating = star.rating;
        pClub = star.club;
        overrides.splice(overrideIndex, 1); // remove so it is not reused
      } else {
        // Generate procedural player
        const firstName = rng.choice(names.first);
        const lastName = rng.choice(names.last);
        pName = `${firstName} ${lastName}`;
        pClub = rng.choice(POP_CLUBS);
        
        // Add rating variance
        const variance = rng.range(-4, 4);
        pRating = Math.round(meanRating + variance);
        pRating = Math.max(65, Math.min(94, pRating));
      }
      
      players.push({
        id: `${team.slug}_p_${index + 1}`,
        team_id: team.id,
        name: pName,
        position: pos,
        rating: pRating,
        club: pClub,
        age: pAge,
        shirt_number: shirt,
      });
    }
  });
  
  return players;
}

// Deterministically generate Group stage fixtures for a group letter
export function generateGroupFixtures(group_letter: string, groupTeams: Team[]): Match[] {
  if (groupTeams.length !== 4) return [];
  
  const [t1, t2, t3, t4] = groupTeams;
  
  // 6 standard matchups in a group
  // Matchday 1: T1 vs T2, T3 vs T4
  // Matchday 2: T1 vs T3, T2 vs T4
  // Matchday 3: T4 vs T1, T2 vs T3
  const pairs = [
    { home: t1, away: t2, daysOffset: 1, venue: 'MetLife Stadium, New York/New Jersey' },
    { home: t3, away: t4, daysOffset: 1, venue: 'SoFi Stadium, Los Angeles' },
    { home: t1, away: t3, daysOffset: 5, venue: 'Mercedes-Benz Stadium, Atlanta' },
    { home: t2, away: t4, daysOffset: 5, venue: 'Gillette Stadium, Boston' },
    { home: t4, away: t1, daysOffset: 9, venue: 'Hard Rock Stadium, Miami' },
    { home: t2, away: t3, daysOffset: 9, venue: 'AT&T Stadium, Dallas' },
  ];
  
  // Deterministic seed dates starting June 11, 2026
  return pairs.map((pair, idx) => {
    // Generate dates: Group stage is from June 11 to June 27
    const day = 11 + pair.daysOffset;
    const match_date = `2026-06-${day < 10 ? '0' + day : day}T18:00:00Z`;
    
    return {
      id: `match_g_${group_letter.toLowerCase()}_${idx + 1}`,
      group_letter,
      team_home_id: pair.home.id,
      team_away_id: pair.away.id,
      score_home: null,
      score_away: null,
      match_date,
      venue: pair.venue,
      stage: 'Group',
      played: false,
    };
  });
}

// The complete local/session database engine
export class WC26Database {
  public teams: Team[] = [];
  public players: Player[] = [];
  public groups: Group[] = [];
  public matches: Match[] = [];

  constructor() {
    this.reset();
  }

  public reset() {
    this.teams = [...SEED_TEAMS];
    this.groups = [...SEED_GROUPS];
    this.players = generateProceduralSquads(this.teams);
    
    // Seed fixtures for all 12 groups
    let allMatches: Match[] = [];
    this.groups.forEach((group) => {
      const groupTeams = this.teams.filter((t) => t.group_letter === group.letter);
      const groupMatches = generateGroupFixtures(group.letter, groupTeams);
      allMatches = [...allMatches, ...groupMatches];
    });
    
    this.matches = allMatches;
    
    // Pre-play 40% of the group stage matches for high realism
    const rng = new LCG(9999);
    this.matches.forEach((m, idx) => {
      if (idx % 3 === 0) { // Mark some matches as played
        const hTeam = this.teams.find(t => t.id === m.team_home_id);
        const aTeam = this.teams.find(t => t.id === m.team_away_id);
        if (hTeam && aTeam) {
          // Score distribution weighted by FIFA rank and probability
          const hRankFactor = 100 - hTeam.fifa_ranking;
          const aRankFactor = 100 - aTeam.fifa_ranking;
          
          let hGoalExpectancy = 1.3 + (hRankFactor - aRankFactor) * 0.015;
          let aGoalExpectancy = 1.3 + (aRankFactor - hRankFactor) * 0.015;
          
          hGoalExpectancy = Math.max(0.5, hGoalExpectancy);
          aGoalExpectancy = Math.max(0.5, aGoalExpectancy);
          
          const sHome = rng.rangeInt(0, Math.floor(hGoalExpectancy * 1.8));
          const sAway = rng.rangeInt(0, Math.floor(aGoalExpectancy * 1.8));
          
          m.score_home = sHome;
          m.score_away = sAway;
          m.played = true;
        }
      }
    });
    
    this.generateKnockoutPrereqs();
  }

  // Pre-seed some default elements for Round of 32/16/QF/SF brackets to make the interactive bracket look gorgeous
  private generateKnockoutPrereqs() {
    // Fill in remaining matches of bracket with placeholders to let users see the full tree structure
    const knockoutStages: Array<'Round of 32' | 'Round of 16' | 'Quarterfinals' | 'Semifinals' | 'Final'> = [
      'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'
    ];
    
    const countPerStage = {
      'Round of 32': 16,
      'Round of 16': 8,
      'Quarterfinals': 4,
      'Semifinals': 2,
      'Final': 1
    };

    const venues = [
      'BC Place, Vancouver', 'Lumen Field, Seattle', 'Levi Stadium, San Francisco',
      'SoFi Stadium, Los Angeles', 'Estadio Azteca, Mexico City', 'AT&T Stadium, Dallas',
      'NRG Stadium, Houston', 'Mercedes-Benz Stadium, Atlanta', 'Lincoln Financial Field, Philadelphia',
      'MetLife Stadium, NY/NJ', 'Gillette Stadium, Boston', 'Hard Rock Stadium, Miami'
    ];

    let rng = new LCG(22026);
    let day = 29; // Starts June 29 for KO
    
    knockoutStages.forEach(stage => {
      const count = countPerStage[stage];
      for (let i = 0; i < count; i++) {
        // Find dummy default teams
        const match_date = `2026-07-${day < 10 ? '0' + day : day}T20:00:00Z`;
        
        // Select some top teams dynamically as defaults for brackets
        const defHomeId = this.teams[i % this.teams.length].id;
        const defAwayId = this.teams[(i + 5) % this.teams.length].id;

        this.matches.push({
          id: `match_ko_${stage.replace(/\s+/g, '_').toLowerCase()}_${i + 1}`,
          team_home_id: defHomeId,
          team_away_id: defAwayId,
          score_home: null,
          score_away: null,
          match_date,
          venue: rng.choice(venues),
          stage,
          played: false,
        });
      }
      day += 3;
    });
  }

  // Compute standings for a given group letter
  public getGroupStandings(letter: string): GroupStandings[] {
    const groupTeams = this.teams.filter((t) => t.group_letter === letter);
    const standings: Record<string, GroupStandings> = {};
    
    groupTeams.forEach((team) => {
      standings[team.id] = {
        team,
        played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, points: 0
      };
    });
    
    // Process matches
    const groupMatches = this.matches.filter(m => m.group_letter === letter && m.played);
    
    groupMatches.forEach((m) => {
      const home = standings[m.team_home_id];
      const away = standings[m.team_away_id];
      const sh = m.score_home ?? 0;
      const sa = m.score_away ?? 0;
      
      if (home && away) {
        home.played++;
        away.played++;
        home.gf += sh;
        home.ga += sa;
        away.gf += sa;
        away.ga += sh;
        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;
        
        if (sh > sa) {
          home.won++;
          home.points += 3;
          away.lost++;
        } else if (sh < sa) {
          away.won++;
          away.points += 3;
          home.lost++;
        } else {
          home.drawn++;
          away.drawn++;
          home.points += 1;
          away.points += 1;
        }
      }
    });
    
    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.fifa_ranking - b.team.fifa_ranking; // lower rank (better rank number) goes up
    });
  }

  // Set match results and update standings
  public updateMatchScore(matchId: string, scoreHome: number, scoreAway: number, played = true) {
    const match = this.matches.find(m => m.id === matchId);
    if (match) {
      match.score_home = scoreHome;
      match.score_away = scoreAway;
      match.played = played;
      
      // If group match, we could automatically recalculate brackets,
      // but keeping it simple for the user edits and letting it dynamically recalculate upon standings query.
      this.recalculateKnockouts();
    }
  }

  // Populate qualified teams in bracket
  private recalculateKnockouts() {
    // Collect all Qualified Teams (1st and 2nd from each of 12 groups)
    // 12 Groups * 2 = 24 teams.
    // Plus 8 best third place out of 12 third places to make 32 teams.
    const firsts: Team[] = [];
    const seconds: Team[] = [];
    const thirds: Array<{ team: Team; points: number; gd: number; gf: number }> = [];

    this.groups.forEach((g) => {
      const std = this.getGroupStandings(g.letter);
      if (std[0]) firsts.push(std[0].team);
      if (std[1]) seconds.push(std[1].team);
      if (std[2]) {
        thirds.push({
          team: std[2].team,
          points: std[2].points,
          gd: std[2].gd,
          gf: std[2].gf
        });
      }
    });

    // Sort thirds
    const qualifiedThirds = thirds
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team.fifa_ranking - b.team.fifa_ranking;
      })
      .slice(0, 8)
      .map(t => t.team);

    // Merge of 32 teams
    const allQualified = [...firsts, ...seconds, ...qualifiedThirds];
    
    // Distribute into the 16 matches of Round of 32
    const r32Matches = this.matches.filter(m => m.stage === 'Round of 32');
    r32Matches.forEach((m, idx) => {
      // Pick deterministic index match-ups
      const hIdx = (idx * 2) % allQualified.length;
      const aIdx = (idx * 2 + 1) % allQualified.length;
      if (allQualified[hIdx] && allQualified[aIdx]) {
        m.team_home_id = allQualified[hIdx].id;
        m.team_away_id = allQualified[aIdx].id;
      }
    });
  }

  // Simulate complete Group stage randomly and realistically
  public simulateAllGroupStage() {
    const rng = new LCG(Math.floor(Math.random() * 100000));
    this.matches.forEach((m) => {
      if (m.stage === 'Group') {
        const hTeam = this.teams.find(t => t.id === m.team_home_id);
        const aTeam = this.teams.find(t => t.id === m.team_away_id);
        if (hTeam && aTeam) {
          const hRankFactor = 100 - hTeam.fifa_ranking;
          const aRankFactor = 100 - aTeam.fifa_ranking;
          
          let hGoalExpectancy = 1.35 + (hRankFactor - aRankFactor) * 0.015;
          let aGoalExpectancy = 1.35 + (aRankFactor - hRankFactor) * 0.015;
          
          hGoalExpectancy = Math.max(0.4, hGoalExpectancy);
          aGoalExpectancy = Math.max(0.4, aGoalExpectancy);
          
          m.score_home = rng.rangeInt(0, Math.floor(hGoalExpectancy * 1.8));
          m.score_away = rng.rangeInt(0, Math.floor(aGoalExpectancy * 1.8));
          m.played = true;
        }
      }
    });
    this.recalculateKnockouts();
  }
}

// Export singleton instance of database for local edits
export const dbInstance = new WC26Database();
