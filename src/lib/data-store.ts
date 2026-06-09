/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * data-store.ts — World Cup 2026 Edition
 * All team data reflects the official FIFA draw (December 5, 2025)
 * and confirmed squads/coaches as of June 2, 2026.
 *
 * Sources:
 *  - FIFA official squad lists (fdp.fifa.org)
 *  - worldcuppass.com FIFA rankings (April 1, 2026 update)
 *  - ESPN / worldcupwiki.com confirmed coaches & squads
 */

import { Team, Player, Group, Match, GroupStandings } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Simple seeded random (LCG) – unchanged; keep for procedural generation
// ─────────────────────────────────────────────────────────────────────────────
export class LCG {
  private m = 0x80000000;
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: number) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }
  nextInt(): number { this.state = (this.a * this.state + this.c) % this.m; return this.state; }
  nextFloat(): number { return this.nextInt() / (this.m - 1); }
  range(min: number, max: number): number { return min + this.nextFloat() * (max - min); }
  rangeInt(min: number, max: number): number { return Math.floor(this.range(min, max + 1)); }
  choice<T>(arr: T[]): T { return arr[Math.floor(this.nextFloat() * arr.length)]; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Procedural name pools (kept for non-star squad generation)
// ─────────────────────────────────────────────────────────────────────────────
const NAMES_DB: Record<string, { first: string[]; last: string[] }> = {
  anglo: {
    first: ['Brandon','Jordan','Callum','Tyler','Marcus','Gareth','Harry','Declan','Mason','Jude','Bukayo','Conor','Ethan','Kieran','Harvey','Reece','Jack','Luke','Tyrone','Ollie','James','Liam','Lewis','Che','Danny','Cole'],
    last:  ['Smith','Walker','Rice','Bellingham','Saka','Stones','Trippier','Gallagher','Palmer','Foden','Kane','Pickford','Ramsdale','Shaw','Maguire','Alexander-Arnold','Henderson','Watkins','Adams','Gilmour','McTominay','Robertson','Johnson','Bailey','Antonio','Blake']
  },
  spanish: {
    first: ['Mateo','Santiago','Emiliano','Enzo','Lautaro','Julian','Angel','Nahuel','Rodrigo','Nicolas','Alexis','Leandro','Gonzalo','Geronimo','Lucas','Guido','Marcos','Alejandro','Lisandro','Valentino','Alvaro','Javier','Sandro','Pau','Dani','Facundo'],
    last:  ['Gomez','Fernandez','Martinez','Alvarez','Gonzalez','Rodriguez','Paredes','De Paul','Molina','Tagliafico','Acuna','Romero','Otamendi','Montiel','Palacios','Mac Allister','Di Maria','Correa','Rulli','Armani','Garnacho','Soto','Herrera','Torres','Perez','Ruiz']
  },
  french: {
    first: ['Kylian','Antoine','Olivier','Ousmane','Aurélien','Eduardo','Adrien','Youssouf','Jonathan','Theo','Dayot','William','Ibrahima','Benjamin','Lucas','Brice','Alphonse','Mike','Kingsley','Randal','Marcus','Warren','Christopher','Saliba','Pierre','Bradley'],
    last:  ['Mbappé','Griezmann','Giroud','Dembélé','Tchouaméni','Camavinga','Rabiot','Fofana','Clauss','Hernández','Upamecano','Saliba','Konaté','Pavard','Thuram','Samba','Areola','Maignan','Coman','Kolo Muani','Zaire-Emery','Nkunku','Koundé','Mendy','Dubois','Leroy']
  },
  portuguese: {
    first: ['Cristiano','Bruno','Bernardo','Ruben','Rafael','João','Diogo','Vitinha','Matheus','Gonçalo','Pedro','Danilo','Nuno','Nelson','Pepe','Jose','Rui','Otavio','Francisco','Antonio','Tiago','Andre','Fabio','Geraldo','Manuel','Ricardo'],
    last:  ['Ronaldo','Fernandes','Silva','Dias','Leão','Félix','Jota','Cancelo','Mendes','Nunes','Ramos','Neto','Pereira','Semedo','Neves','Sá','Patrício','Palhinha','Conceição','Inácio','Guerreiro','Gomes','Almeida','Monteiro','Cardoso','Sousa']
  },
  german: {
    first: ['Florian','Jamal','Thomas','Kai','Leroy','Joshua','Ilkay','Leon','Toni','Maximilian','Robin','Antonio','Jonathan','Benjamin','Marc','Manuel','Oliver','Nico','David','Gregor','Yann','Pascal','Chris','Niclas','Tim','Serge'],
    last:  ['Wirtz','Musiala','Müller','Havertz','Sané','Kimmich','Gündoğan','Goretzka','Kroos','Beier','Gosens','Rüdiger','Tah','Henrichs','Ter Stegen','Neuer','Baumann','Schlotterbeck','Raum','Kobel','Füllkrug','Undav','Nmecha','Adeyemi','Burkardt','Gnabry']
  },
  arabic: {
    first: ['Mohamed','Ahmed','Youssef','Amine','Riyad','Sofiane','Saïd','Ismaël','Aissa','Ramy','Nabil','Baghdad','Yassine','Achraf','Hakim','Noussair','Nayef','Selim','Azzedine','Sofyan','Bilal','Abderrazak','Salem','Firas','Ali','Houssem'],
    last:  ['Salah','Hassan','Mahrez','Bennacer','Mandi','Bensebaini','Bentaleb','Bounedjah','Slimani','Bounou','Hakimi','Ziyech','Mazraoui','Aguerd','Amrabat','Ounahi','En-Nesyri','Boufal','El Khannouss','Cheddira','Al-Dawsari','Al-Shehri','Al-Owais','Aouar','Boudaoui','Gouiri']
  },
  asian: {
    first: ['Heung-min','Min-jae','Kang-in','Hee-chan','Gue-sung','Jae-sung','In-beom','Woo-yeong','Seung-gyu','Hiroshi','Kaoru','Takefusa','Wataru','Ritsu','Daichi','Ko','Shogo','Yukinari','Mehdi','Alireza','Sardar','Saman','Milad','Hossein','Takumi','Junya'],
    last:  ['Son','Kim','Lee','Hwang','Cho','Park','Jeong','Jo','Mitoma','Kubo','Endo','Doan','Kamada','Itakura','Taniguchi','Sugawara','Suzuki','Taremi','Jahanbakhsh','Azmoun','Goddos','Mohammadi','Hoszeini','Beiranvand','Ito','Maeda']
  },
  african: {
    first: ['Victor','Ademola','Alex','Wilfred','Moses','Kelechi','Samuel','Terem','Ola','William','Semi','Stanley','Sipho','Themba','Percy','Teboho','Ronwen','Aubrey','Mothobi','Khuliso','Thomas','Inaki','Mohammed','Jordan','Andre','Salis'],
    last:  ['Osimhen','Lookman','Iwobi','Ndidi','Simon','Iheanacho','Chukwueze','Moffi','Aina','Troost-Ekong','Ajayi','Nwabali','Mokoena','Zwane','Tau','Williams','Modiba','Mvala','Mudau','Partey','Kudus','Ayew','Samed','Mensah','Foster','Makgopa']
  },
  slavic: {
    first: ['Luka','Mateo','Marcelo','Andrej','Ivan','Joško','Borna','Domagoj','Lovro','Mario','Dominik','Edin','Sead','Amar','Benjamin','Samed','Haris','Nikola','Stefan','Sergej','Tarik','Igor','Denis','Alen','Miralem','Zlatan'],
    last:  ['Modrić','Kovačić','Brozović','Kramarić','Perišić','Gvardiol','Sosa','Vida','Majer','Pasalić','Livaković','Džeko','Kolašinac','Hadžiahmetović','Tahirović','Demirović','Tabaković','Vasilj','Mujakić','Muharemović','Dedić','Burnić','Bašić','Gigović','Bajraktarević','Šunjić']
  },
  nordic: {
    first: ['Erling','Martin','Alexander','Victor','Emil','Robin','Ludwig','Filip','Ken','Jens','Anthony','Christian','Pierre-Emile','Joachim','Rasmus','Kasper','Andreas','Mikkel','Morten','Gustav','Robert','Martin','Lars','Chris','Fredrik','Jesper'],
    last:  ['Haaland','Ødegaard','Isak','Lindelöf','Forsberg','Kulusevski','Olsen','Augustinsson','Helander','Sema','Cajuste','Elanga','Eriksen','Højbjerg','Andersen','Højlund','Schmeichel','Vestergaard','Christensen','Kristiansen','Damsgaard','Hjulmand','Isaksen','Skov','Wind','Dolberg']
  },
};

const SLUG_TO_REGION: Record<string, string> = {
  // Group A
  mex: 'spanish', rsa: 'african', kor: 'asian', cze: 'slavic',
  // Group B
  can: 'anglo', bih: 'slavic', qat: 'arabic', sui: 'german',
  // Group C
  bra: 'portuguese', mar: 'arabic', hai: 'spanish', sco: 'anglo',
  // Group D
  usa: 'anglo', par: 'spanish', aus: 'anglo', tur: 'arabic',
  // Group E
  ger: 'german', cur: 'dutch', civ: 'french', ecu: 'spanish',
  // Group F
  ned: 'dutch', jpn: 'asian', swe: 'nordic', tun: 'arabic',
  // Group G
  bel: 'french', egy: 'arabic', irn: 'asian', nzl: 'anglo',
  // Group H
  esp: 'spanish', cpv: 'portuguese', ksa: 'arabic', uru: 'spanish',
  // Group I
  fra: 'french', sen: 'french', irq: 'arabic', nor: 'nordic',
  // Group J
  arg: 'spanish', alg: 'arabic', aut: 'german', jor: 'arabic',
  // Group K
  por: 'portuguese', cod: 'french', uzb: 'asian', col: 'spanish',
  // Group L
  eng: 'anglo', cro: 'slavic', gha: 'african', pan: 'spanish',
};

// ─────────────────────────────────────────────────────────────────────────────
// Dutch name pool (needed for NED / CUR)
// ─────────────────────────────────────────────────────────────────────────────
NAMES_DB['dutch'] = {
  first: ['Virgil','Memphis','Frenkie','Cody','Xavi','Tijjani','Denzel','Nathan','Matthijs','Stefan','Jeremie','Bart','Mark','Justin','Brian','Wout','Georginio','Daley','Micky','Quinten','Ryan','Jurrien','Armando','Juninho','Leandro'],
  last:  ['van Dijk','Depay','de Jong','Gakpo','Simons','Reijnders','Dumfries','Aké','de Ligt','de Vrij','Frimpong','Verbruggen','Flekken','Brobbey','Weghorst','Wijnaldum','Blind','Geertruida','van de Ven','Timber','Bergwijn','Veerman','Gravenberch','Obispo','Bacuna']
};

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL 12 GROUPS  (December 5, 2025 FIFA Draw + March 2026 playoffs)
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_GROUPS: Group[] = [
  { id: 'group_a', letter: 'A', nickname: 'The Host Pool',             difficulty: 'Competitive' },
  { id: 'group_b', letter: 'B', nickname: 'The Atlantic Draw',         difficulty: 'Competitive' },
  { id: 'group_c', letter: 'C', nickname: 'Samba & Atlas',             difficulty: 'Competitive' },
  { id: 'group_d', letter: 'D', nickname: 'Stars & Stripes',           difficulty: 'Competitive' },
  { id: 'group_e', letter: 'E', nickname: 'German Efficiency',         difficulty: 'Competitive' },
  { id: 'group_f', letter: 'F', nickname: 'European-Asian Showdown',   difficulty: 'Competitive' },
  { id: 'group_g', letter: 'G', nickname: 'Red Devils & Pharaohs',     difficulty: 'Easy' },
  { id: 'group_h', letter: 'H', nickname: 'Iberian Dominance',         difficulty: 'Competitive' },
  { id: 'group_i', letter: 'I', nickname: 'Les Bleus Zone',            difficulty: 'Group of Death' },
  { id: 'group_j', letter: 'J', nickname: 'The Defenders\' Den',       difficulty: 'Group of Death' },
  { id: 'group_k', letter: 'K', nickname: 'Ronaldo\'s Stage',          difficulty: 'Competitive' },
  { id: 'group_l', letter: 'L', nickname: 'Three Lions Roar',          difficulty: 'Competitive' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ALL 48 TEAMS — corrected with real groups, coaches, FIFA rankings (Apr 2026)
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_TEAMS: Team[] = [

  // ── GROUP A ──────────────────────────────────────────────────────────────
  {
    id: 'mex', name: 'Mexico', slug: 'mex', group_letter: 'A',
    coach_name: 'Javier Aguirre', coach_nationality: 'Mexico', confederation: 'CONCACAF',
    win_probability: 2.5,
    win_factors: 'Passionate home support, tournament experience, and creative midfielders. Struggles to break down structured low blocks, and forward depth is inconsistent.',
    fifa_ranking: 15, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇲🇽'
  },
  {
    id: 'rsa', name: 'South Africa', slug: 'rsa', group_letter: 'A',
    coach_name: 'Hugo Broos', coach_nationality: 'Belgium', confederation: 'CAF',
    win_probability: 0.6,
    win_factors: 'Strong domestic club chemistry and organized defensive blocks. Limited elite individual quality and struggles aerially against physical sides.',
    fifa_ranking: 60, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇿🇦'
  },
  {
    id: 'kor', name: 'South Korea', slug: 'kor', group_letter: 'A',
    coach_name: 'Hong Myung-bo', coach_nationality: 'South Korea', confederation: 'AFC',
    win_probability: 2.0,
    win_factors: 'Relentless pressing, world-class individual quality via Son Heung-min (LAFC), and a physically demanding squad. Defensive organization in open play must hold up.',
    fifa_ranking: 25, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇰🇷'
  },
  {
    id: 'cze', name: 'Czechia', slug: 'cze', group_letter: 'A',
    coach_name: 'Ivan Hašek', coach_nationality: 'Czech Republic', confederation: 'UEFA',
    win_probability: 1.4,
    win_factors: 'Set-piece specialists with physicality and organisational discipline. Qualified via playoff (beat Denmark on penalties). Striker depth via Patrik Schick is key.',
    fifa_ranking: 41, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇿'
  },

  // ── GROUP B ──────────────────────────────────────────────────────────────
  {
    id: 'can', name: 'Canada', slug: 'can', group_letter: 'B',
    coach_name: 'Jesse Marsch', coach_nationality: 'United States', confederation: 'CONCACAF',
    win_probability: 2.2,
    win_factors: 'Co-hosts with immense home advantage. Alphonso Davies (Bayern Munich) provides elite pace and creativity on the left. Jonathan David (Juventus) is a reliable scorer.',
    fifa_ranking: 30, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇨🇦'
  },
  {
    id: 'bih', name: 'Bosnia & Herzegovina', slug: 'bih', group_letter: 'B',
    coach_name: 'Sergej Barbarez', coach_nationality: 'Bosnia & Herzegovina', confederation: 'UEFA',
    win_probability: 1.0,
    win_factors: 'Qualified dramatically by beating Italy on penalties in the UEFA playoff final. Led by 40-year-old captain Edin Džeko (Schalke). Physical and experienced in tight games.',
    fifa_ranking: 52, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇧🇦'
  },
  {
    id: 'qat', name: 'Qatar', slug: 'qat', group_letter: 'B',
    coach_name: 'Carlos Queiroz', coach_nationality: 'Portugal', confederation: 'AFC',
    win_probability: 0.8,
    win_factors: 'Strong continental record and synchronized squad. Severe lack of global-standard depth in central lines. Host of 2022, returning with experience.',
    fifa_ranking: 35, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇶🇦'
  },
  {
    id: 'sui', name: 'Switzerland', slug: 'sui', group_letter: 'B',
    coach_name: 'Murat Yakin', coach_nationality: 'Switzerland', confederation: 'UEFA',
    win_probability: 2.0,
    win_factors: 'Tactically disciplined, capable of resilient blocks and quick transitions. Granit Xhaka provides elite midfield leadership. Lacks a truly clinical finisher up front.',
    fifa_ranking: 19, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇨🇭'
  },

  // ── GROUP C ──────────────────────────────────────────────────────────────
  {
    id: 'bra', name: 'Brazil', slug: 'bra', group_letter: 'C',
    coach_name: 'Carlo Ancelotti', coach_nationality: 'Italy', confederation: 'CONMEBOL',
    win_probability: 10.0,
    win_factors: 'Ancelotti\'s first World Cup with Brazil. Vinícius Júnior (Real Madrid) leads the attack. Neymar returned after a long absence. Marquinhos captains a solid defense. Wesley injured before the tournament.',
    fifa_ranking: 6, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇧🇷'
  },
  {
    id: 'mar', name: 'Morocco', slug: 'mar', group_letter: 'C',
    coach_name: 'Walid Regragui', coach_nationality: 'Morocco', confederation: 'CAF',
    win_probability: 4.5,
    win_factors: 'The 2022 semifinalists. Unmatched defensive discipline, elite fullbacks led by Achraf Hakimi (PSG), and a world-class goalkeeper. True dark-horse contenders.',
    fifa_ranking: 8, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇲🇦'
  },
  {
    id: 'hai', name: 'Haiti', slug: 'hai', group_letter: 'C',
    coach_name: 'Marc Collat', coach_nationality: 'France', confederation: 'CONCACAF',
    win_probability: 0.2,
    win_factors: 'Historic first World Cup since 1974. Qualified via CONCACAF Round 3. Overachieving squad with limited depth against elite opposition.',
    fifa_ranking: 83, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇭🇹'
  },
  {
    id: 'sco', name: 'Scotland', slug: 'sco', group_letter: 'C',
    coach_name: 'Steve Clarke', coach_nationality: 'Scotland', confederation: 'UEFA',
    win_probability: 1.1,
    win_factors: 'High work-rate, strong set pieces, and elite fullbacks (Andy Robertson). Back at the World Cup for first time since 1998. Lacks a reliable world-class forward threat.',
    fifa_ranking: 47, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
  },

  // ── GROUP D ──────────────────────────────────────────────────────────────
  {
    id: 'usa', name: 'United States', slug: 'usa', group_letter: 'D',
    coach_name: 'Mauricio Pochettino', coach_nationality: 'Argentina', confederation: 'CONCACAF',
    win_probability: 3.5,
    win_factors: 'Co-hosts with massive home advantage. Pulisic (AC Milan) leads a dynamic young squad. The USMNT have publicly targeted winning the whole tournament on home soil.',
    fifa_ranking: 16, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇺🇸'
  },
  {
    id: 'par', name: 'Paraguay', slug: 'par', group_letter: 'D',
    coach_name: 'Gustavo Alfaro', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 1.2,
    win_factors: 'Physical and combative CONMEBOL side. Finished 6th in South American qualifying. Relies on collective organization rather than individual stars.',
    fifa_ranking: 64, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇵🇾'
  },
  {
    id: 'aus', name: 'Australia', slug: 'aus', group_letter: 'D',
    coach_name: 'Tony Popovic', coach_nationality: 'Australia', confederation: 'AFC',
    win_probability: 1.1,
    win_factors: 'Resilient team culture, well-organized defensive blocks. Captain Mathew Ryan leads at his fourth World Cup. Limited elite individual quality in the final third.',
    fifa_ranking: 26, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇦🇺'
  },
  {
    id: 'tur', name: 'Türkiye', slug: 'tur', group_letter: 'D',
    coach_name: 'Vincenzo Montella', coach_nationality: 'Italy', confederation: 'UEFA',
    win_probability: 1.8,
    win_factors: 'Qualified via playoff (beat Kosovo). Athletic, high-tempo team with creative midfielders. Third place in 2002 represents the ceiling this generation is chasing.',
    fifa_ranking: 42, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇹🇷'
  },

  // ── GROUP E ──────────────────────────────────────────────────────────────
  {
    id: 'ger', name: 'Germany', slug: 'ger', group_letter: 'E',
    coach_name: 'Julian Nagelsmann', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 9.0,
    win_factors: 'Wirtz and Musiala are among the best young players in the world. Nagelsmann\'s tactical flexibility and attacking depth make Germany perennial contenders.',
    fifa_ranking: 10, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇩🇪'
  },
  {
    id: 'cur', name: 'Curaçao', slug: 'cur', group_letter: 'E',
    coach_name: 'Dick Advocaat', coach_nationality: 'Netherlands', confederation: 'CONCACAF',
    win_probability: 0.1,
    win_factors: 'Historic World Cup debut. The smallest nation by population (156,000) ever to qualify. 78-year-old Advocaat is the oldest coach in World Cup history. Eredivisie-heavy roster.',
    fifa_ranking: 81, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇨🇼'
  },
  {
    id: 'civ', name: 'Ivory Coast', slug: 'civ', group_letter: 'E',
    coach_name: 'Emerse Faé', coach_nationality: 'Ivory Coast', confederation: 'CAF',
    win_probability: 1.5,
    win_factors: 'AFCON 2023 champions. Physically strong, dangerous wingers, and emerging young talent. Nicolas Pépé and Franck Kessié-era core has transitioned to new generation.',
    fifa_ranking: 33, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇮'
  },
  {
    id: 'ecu', name: 'Ecuador', slug: 'ecu', group_letter: 'E',
    coach_name: 'Sebastián Beccacece', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 1.8,
    win_factors: 'High altitude conditioning, physical power, and the world-class midfield engine of Moisés Caicedo. Struggles with clinical finishing in tight defensive setups.',
    fifa_ranking: 24, best_case: 'Round of 16', realistic_target: 'Round of 16', flag: '🇪🇨'
  },

  // ── GROUP F ──────────────────────────────────────────────────────────────
  {
    id: 'ned', name: 'Netherlands', slug: 'ned', group_letter: 'F',
    coach_name: 'Ronald Koeman', coach_nationality: 'Netherlands', confederation: 'UEFA',
    win_probability: 8.0,
    win_factors: 'Virgil van Dijk leads arguably the world\'s best defensive unit. Dangerous attacking width and pace. Remains without a truly elite striker to finish high-quality chances.',
    fifa_ranking: 7, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇳🇱'
  },
  {
    id: 'jpn', name: 'Japan', slug: 'jpn', group_letter: 'F',
    coach_name: 'Hajime Moriyasu', coach_nationality: 'Japan', confederation: 'AFC',
    win_probability: 3.5,
    win_factors: 'Supreme tactical discipline, elite pressing intensity, and a deep squad of European starters. A genuine dark horse. Kaoru Mitoma (Brighton) and Junya Ito are devastating on the wings.',
    fifa_ranking: 18, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇯🇵'
  },
  {
    id: 'swe', name: 'Sweden', slug: 'swe', group_letter: 'F',
    coach_name: 'Jon Dahl Tomasson', coach_nationality: 'Denmark', confederation: 'UEFA',
    win_probability: 1.8,
    win_factors: 'Qualified via UEFA Playoff Path B (beat Poland 3-2). Alexander Isak (Newcastle) leads a direct and physically imposing side. Dejan Kulusevski provides craft in midfield.',
    fifa_ranking: 39, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇸🇪'
  },
  {
    id: 'tun', name: 'Tunisia', slug: 'tun', group_letter: 'F',
    coach_name: 'Jalel Kadri', coach_nationality: 'Tunisia', confederation: 'CAF',
    win_probability: 0.6,
    win_factors: 'Dense defensive organisation and organised set plays. Hannibal Mejbri provides creative spark. Disconnected build-up tends to isolate forwards against elite opposition.',
    fifa_ranking: 40, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇹🇳'
  },

  // ── GROUP G ──────────────────────────────────────────────────────────────
  {
    id: 'bel', name: 'Belgium', slug: 'bel', group_letter: 'G',
    coach_name: 'Rudi Garcia', coach_nationality: 'France', confederation: 'UEFA',
    win_probability: 5.0,
    win_factors: 'Kevin De Bruyne (Napoli) and Thibaut Courtois (Real Madrid) headline. Romelu Lukaku leads the attack. The Golden Generation\'s final chance to win a major trophy.',
    fifa_ranking: 9, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇧🇪'
  },
  {
    id: 'egy', name: 'Egypt', slug: 'egy', group_letter: 'G',
    coach_name: 'Hossam Hassan', coach_nationality: 'Egypt', confederation: 'CAF',
    win_probability: 1.5,
    win_factors: 'Mohamed Salah (Liverpool) is the sole world-class threat but is among the best players in the world. Creative midfield is limited beyond him. Counter-attacking is their best route.',
    fifa_ranking: 29, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇪🇬'
  },
  {
    id: 'irn', name: 'Iran', slug: 'irn', group_letter: 'G',
    coach_name: 'Amir Ghalenoei', coach_nationality: 'Iran', confederation: 'AFC',
    win_probability: 1.2,
    win_factors: 'Disciplined mid-block, physical midfield, and the Mehdi Taremi–Sardar Azmoun partnership up front. Struggles to maintain intensity against elite teams in the second half.',
    fifa_ranking: 21, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇮🇷'
  },
  {
    id: 'nzl', name: 'New Zealand', slug: 'nzl', group_letter: 'G',
    coach_name: 'Darren Bazeley', coach_nationality: 'England', confederation: 'OFC',
    win_probability: 0.2,
    win_factors: 'Physical and direct play. Qualified as OFC champions. Limited depth and no elite individual talent at this level. Focus will be on maximising the experience.',
    fifa_ranking: 95, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇳🇿'
  },

  // ── GROUP H ──────────────────────────────────────────────────────────────
  {
    id: 'esp', name: 'Spain', slug: 'esp', group_letter: 'H',
    coach_name: 'Luis de la Fuente', coach_nationality: 'Spain', confederation: 'UEFA',
    win_probability: 12.5,
    win_factors: 'Euro 2024 champions and tournament favourites. Rodri, Lamine Yamal (fitness doubt), Pedri and Nico Williams form a breathtaking core. Dominant possession and elite press-resistance.',
    fifa_ranking: 2, best_case: 'Winner', realistic_target: 'Final', flag: '🇪🇸'
  },
  {
    id: 'cpv', name: 'Cape Verde', slug: 'cpv', group_letter: 'H',
    coach_name: 'Bubista', coach_nationality: 'Cape Verde', confederation: 'CAF',
    win_probability: 0.3,
    win_factors: 'World Cup debut. Smallest African nation (525,000 population) ever to qualify. Logan Costa (Villarreal) and Steven Moreira (Columbus Crew) headline. Huge achievement to be here.',
    fifa_ranking: 70, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇨🇻'
  },
  {
    id: 'ksa', name: 'Saudi Arabia', slug: 'ksa', group_letter: 'H',
    coach_name: 'Georgios Donis', coach_nationality: 'Greece', confederation: 'AFC',
    win_probability: 0.8,
    win_factors: 'New coach Georgios Donis appointed April 24, replacing Hervé Renard. Salem Al-Dawsari leads the attack. Faces Spain and Uruguay in first two games — a very tough draw.',
    fifa_ranking: 57, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇸🇦'
  },
  {
    id: 'uru', name: 'Uruguay', slug: 'uru', group_letter: 'H',
    coach_name: 'Marcelo Bielsa', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 6.0,
    win_factors: 'Bielsa\'s relentless high-press and tactical intensity. Former winners (1930, 1950) with elite defensive grit. Risk of over-exertion if pressing trigger is disconnected against top sides.',
    fifa_ranking: 17, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇺🇾'
  },

  // ── GROUP I ──────────────────────────────────────────────────────────────
  {
    id: 'fra', name: 'France', slug: 'fra', group_letter: 'I',
    coach_name: 'Didier Deschamps', coach_nationality: 'France', confederation: 'UEFA',
    win_probability: 13.0,
    win_factors: 'FIFA ranked #1. Kylian Mbappé (Real Madrid) is the world\'s best player. William Saliba anchors a world-class defence. This is Deschamps\' final tournament — both motivated and experienced.',
    fifa_ranking: 1, best_case: 'Winner', realistic_target: 'Final', flag: '🇫🇷'
  },
  {
    id: 'sen', name: 'Senegal', slug: 'sen', group_letter: 'I',
    coach_name: 'Pape Thiaw', coach_nationality: 'Senegal', confederation: 'CAF',
    win_probability: 2.5,
    win_factors: 'Physical, dynamic, and dangerous in transition. Genuine dark horse with AFCON pedigree. Faces France and Norway — a tough test to escape the group.',
    fifa_ranking: 14, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇸🇳'
  },
  {
    id: 'irq', name: 'Iraq', slug: 'irq', group_letter: 'I',
    coach_name: 'Jesús Casas', coach_nationality: 'Spain', confederation: 'AFC',
    win_probability: 0.4,
    win_factors: 'Qualified via inter-confederation playoff. Well-drilled tactical mid-block under Spanish coach. No prior World Cup experience for most of this generation.',
    fifa_ranking: 61, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇮🇶'
  },
  {
    id: 'nor', name: 'Norway', slug: 'nor', group_letter: 'I',
    coach_name: 'Ståle Solbakken', coach_nationality: 'Norway', confederation: 'UEFA',
    win_probability: 3.5,
    win_factors: 'Erling Haaland is the most dangerous striker in world football. Martin Ødegaard provides elite creative vision. Strong defensive organisation. Can be the tournament\'s chaos agent.',
    fifa_ranking: 44, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇳🇴'
  },

  // ── GROUP J ──────────────────────────────────────────────────────────────
  {
    id: 'arg', name: 'Argentina', slug: 'arg', group_letter: 'J',
    coach_name: 'Lionel Scaloni', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 13.5,
    win_factors: 'Defending World Champions. Messi confirmed his sixth and likely final World Cup at 38. Elite squad harmony, tactical flexibility, and the deepest attacking pool in the world.',
    fifa_ranking: 3, best_case: 'Winner', realistic_target: 'Final', flag: '🇦🇷'
  },
  {
    id: 'alg', name: 'Algeria', slug: 'alg', group_letter: 'J',
    coach_name: 'Vladimir Petković', coach_nationality: 'Bosnia & Herzegovina', confederation: 'CAF',
    win_probability: 1.0,
    win_factors: 'Riyad Mahrez (Al-Ahli) leads a French-based squad with continental ambition. Opens against defending champions Argentina on June 16. Defensive discipline is their greatest asset.',
    fifa_ranking: 36, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇩🇿'
  },
  {
    id: 'aut', name: 'Austria', slug: 'aut', group_letter: 'J',
    coach_name: 'Ralf Rangnick', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 2.5,
    win_factors: 'David Alaba (Real Madrid) leads. Rangnick\'s high-pressing system is technically demanding but highly effective. Strong Bundesliga core. Carney Chukwuemeka chose Austria over England.',
    fifa_ranking: 23, best_case: 'Round of 16', realistic_target: 'Round of 16', flag: '🇦🇹'
  },
  {
    id: 'jor', name: 'Jordan', slug: 'jor', group_letter: 'J',
    coach_name: 'Jamal Sellami', coach_nationality: 'Tunisia', confederation: 'AFC',
    win_probability: 0.3,
    win_factors: 'Historic World Cup debut. Asian Cup runners-up in 2023. Organised and disciplined, but lack of experience at this level will be their main challenge.',
    fifa_ranking: 68, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇯🇴'
  },

  // ── GROUP K ──────────────────────────────────────────────────────────────
  {
    id: 'por', name: 'Portugal', slug: 'por', group_letter: 'K',
    coach_name: 'Roberto Martínez', coach_nationality: 'Spain', confederation: 'UEFA',
    win_probability: 9.5,
    win_factors: 'Cristiano Ronaldo plays his record-breaking sixth World Cup at 41. Bruno Fernandes, Bernardo Silva, and Rúben Dias make this squad stacked with world-class talent throughout.',
    fifa_ranking: 5, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇵🇹'
  },
  {
    id: 'cod', name: 'DR Congo', slug: 'cod', group_letter: 'K',
    coach_name: 'Sébastien Desabre', coach_nationality: 'France', confederation: 'CAF',
    win_probability: 0.5,
    win_factors: 'Qualified via inter-confederation playoff, beating Nigeria on penalties. Physical and combative squad. First World Cup since 1974 as Zaire. Huge continental significance.',
    fifa_ranking: 51, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇨🇩'
  },
  {
    id: 'uzb', name: 'Uzbekistan', slug: 'uzb', group_letter: 'K',
    coach_name: 'Srecko Katanec', coach_nationality: 'Slovenia', confederation: 'AFC',
    win_probability: 0.5,
    win_factors: 'World Cup debut. AFC group stage winners. Improving nation with a technically gifted generation. Limited experience at the very top level.',
    fifa_ranking: 62, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇺🇿'
  },
  {
    id: 'col', name: 'Colombia', slug: 'col', group_letter: 'K',
    coach_name: 'Néstor Lorenzo', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 4.5,
    win_factors: 'Luis Díaz joined Bayern Munich in the summer. James Rodríguez (34, Minnesota United) plays his likely final World Cup. Reached Copa América 2024 final. A genuine contender.',
    fifa_ranking: 13, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇨🇴'
  },

  // ── GROUP L ──────────────────────────────────────────────────────────────
  {
    id: 'eng', name: 'England', slug: 'eng', group_letter: 'L',
    coach_name: 'Thomas Tuchel', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 11.5,
    win_factors: 'Jude Bellingham, Harry Kane, Bukayo Saka, and Phil Foden form a terrifying attacking core. Tuchel\'s tactical precision could finally end England\'s 60-year wait for a major trophy.',
    fifa_ranking: 4, best_case: 'Winner', realistic_target: 'Final', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
  },
  {
    id: 'cro', name: 'Croatia', slug: 'cro', group_letter: 'L',
    coach_name: 'Zlatko Dalić', coach_nationality: 'Croatia', confederation: 'UEFA',
    win_probability: 3.0,
    win_factors: 'Luka Modrić (Real Madrid) plays on at 40. Joško Gvardiol (Manchester City) anchors the defence. Elite tournament pedigree with a 2018 runner-up and 2022 third-place finish.',
    fifa_ranking: 11, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇭🇷'
  },
  {
    id: 'gha', name: 'Ghana', slug: 'gha', group_letter: 'L',
    coach_name: 'Otto Addo', coach_nationality: 'Ghana', confederation: 'CAF',
    win_probability: 0.8,
    win_factors: 'Mohammed Kudus (West Ham) leads an exciting young squad. Kamaldeen Sulemana and Antoine Semenyo add pace and directness. Inconsistent over 90 minutes is the key weakness.',
    fifa_ranking: 65, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇬🇭'
  },
  {
    id: 'pan', name: 'Panama', slug: 'pan', group_letter: 'L',
    coach_name: 'Thomas Christiansen', coach_nationality: 'Denmark', confederation: 'CONCACAF',
    win_probability: 0.5,
    win_factors: 'Qualified via CONCACAF Round 3. Second World Cup appearance (first was 2018). Disciplined defensive setup and strong aerial game. Limited quality for sustained pressure.',
    fifa_ranking: 53, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇵🇦'
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAR PLAYER OVERRIDES — real confirmed squad members, correct clubs
// ─────────────────────────────────────────────────────────────────────────────
const STARS_OVERRIDE: Record<string, Array<{ name: string; pos: 'GK' | 'DF' | 'MF' | 'FW'; rating: number; club: string }>> = {
  arg: [
    { name: 'Lionel Messi',         pos: 'FW', rating: 90, club: 'Inter Miami' },
    { name: 'Lautaro Martínez',     pos: 'FW', rating: 89, club: 'Inter Milan' },
    { name: 'Alexis Mac Allister',  pos: 'MF', rating: 87, club: 'Liverpool' },
    { name: 'Enzo Fernández',       pos: 'MF', rating: 85, club: 'Chelsea' },
    { name: 'Emiliano Martínez',    pos: 'GK', rating: 89, club: 'Aston Villa' },
    { name: 'Cristian Romero',      pos: 'DF', rating: 87, club: 'Tottenham Hotspur' },
  ],
  fra: [
    { name: 'Kylian Mbappé',        pos: 'FW', rating: 93, club: 'Real Madrid' },
    { name: 'William Saliba',       pos: 'DF', rating: 89, club: 'Arsenal' },
    { name: 'Antoine Griezmann',    pos: 'FW', rating: 87, club: 'Atlético Madrid' },
    { name: 'Aurélien Tchouaméni',  pos: 'MF', rating: 86, club: 'Real Madrid' },
    { name: 'Mike Maignan',         pos: 'GK', rating: 87, club: 'AC Milan' },
  ],
  esp: [
    { name: 'Rodri',                pos: 'MF', rating: 93, club: 'Manchester City' },
    { name: 'Lamine Yamal',         pos: 'FW', rating: 91, club: 'Barcelona' },
    { name: 'Pedri',                pos: 'MF', rating: 88, club: 'Barcelona' },
    { name: 'Nico Williams',        pos: 'FW', rating: 88, club: 'Athletic Bilbao' },
    { name: 'Dani Carvajal',        pos: 'DF', rating: 86, club: 'Real Madrid' },
  ],
  eng: [
    { name: 'Jude Bellingham',      pos: 'MF', rating: 91, club: 'Real Madrid' },
    { name: 'Harry Kane',           pos: 'FW', rating: 90, club: 'Bayern Munich' },
    { name: 'Bukayo Saka',          pos: 'FW', rating: 89, club: 'Arsenal' },
    { name: 'Phil Foden',           pos: 'MF', rating: 89, club: 'Manchester City' },
    { name: 'Declan Rice',          pos: 'MF', rating: 88, club: 'Arsenal' },
  ],
  bra: [
    { name: 'Vinícius Júnior',      pos: 'FW', rating: 92, club: 'Real Madrid' },
    { name: 'Alisson',              pos: 'GK', rating: 88, club: 'Liverpool' },
    { name: 'Raphinha',             pos: 'FW', rating: 87, club: 'Barcelona' },
    { name: 'Bruno Guimarães',      pos: 'MF', rating: 86, club: 'Newcastle United' },
    { name: 'Marquinhos',           pos: 'DF', rating: 86, club: 'Paris Saint-Germain' },
    { name: 'Neymar',               pos: 'FW', rating: 85, club: 'Santos' },
  ],
  por: [
    { name: 'Cristiano Ronaldo',    pos: 'FW', rating: 86, club: 'Al Nassr' },
    { name: 'Rúben Dias',           pos: 'DF', rating: 89, club: 'Manchester City' },
    { name: 'Bruno Fernandes',      pos: 'MF', rating: 88, club: 'Manchester United' },
    { name: 'Bernardo Silva',       pos: 'MF', rating: 88, club: 'Manchester City' },
    { name: 'Rafael Leão',          pos: 'FW', rating: 88, club: 'AC Milan' },
  ],
  ger: [
    { name: 'Florian Wirtz',        pos: 'MF', rating: 91, club: 'Bayer Leverkusen' },
    { name: 'Jamal Musiala',        pos: 'MF', rating: 90, club: 'Bayern Munich' },
    { name: 'Marc-André ter Stegen', pos: 'GK', rating: 87, club: 'Barcelona' },
    { name: 'Antonio Rüdiger',      pos: 'DF', rating: 87, club: 'Real Madrid' },
    { name: 'Kai Havertz',          pos: 'FW', rating: 86, club: 'Arsenal' },
  ],
  ned: [
    { name: 'Virgil van Dijk',      pos: 'DF', rating: 89, club: 'Liverpool' },
    { name: 'Cody Gakpo',           pos: 'FW', rating: 86, club: 'Liverpool' },
    { name: 'Xavi Simons',          pos: 'MF', rating: 87, club: 'Paris Saint-Germain' },
    { name: 'Frenkie de Jong',      pos: 'MF', rating: 87, club: 'Barcelona' },
    { name: 'Bart Verbruggen',      pos: 'GK', rating: 83, club: 'Brighton' },
  ],
  bel: [
    { name: 'Kevin De Bruyne',      pos: 'MF', rating: 90, club: 'Napoli' },
    { name: 'Thibaut Courtois',     pos: 'GK', rating: 90, club: 'Real Madrid' },
    { name: 'Romelu Lukaku',        pos: 'FW', rating: 84, club: 'Napoli' },
    { name: 'Jérémy Doku',          pos: 'FW', rating: 85, club: 'Manchester City' },
  ],
  kor: [
    { name: 'Son Heung-min',        pos: 'FW', rating: 87, club: 'LAFC' },
    { name: 'Kim Min-jae',          pos: 'DF', rating: 86, club: 'Bayern Munich' },
    { name: 'Lee Kang-in',          pos: 'MF', rating: 84, club: 'Paris Saint-Germain' },
  ],
  jpn: [
    { name: 'Kaoru Mitoma',         pos: 'FW', rating: 86, club: 'Brighton' },
    { name: 'Wataru Endo',          pos: 'MF', rating: 83, club: 'Liverpool' },
    { name: 'Takefusa Kubo',        pos: 'MF', rating: 85, club: 'Real Sociedad' },
  ],
  mar: [
    { name: 'Achraf Hakimi',        pos: 'DF', rating: 88, club: 'Paris Saint-Germain' },
    { name: 'Yassine Bounou',       pos: 'GK', rating: 84, club: 'Al-Hilal' },
    { name: 'Hakim Ziyech',         pos: 'MF', rating: 83, club: 'Galatasaray' },
  ],
  col: [
    { name: 'Luis Díaz',            pos: 'FW', rating: 88, club: 'Bayern Munich' },
    { name: 'James Rodríguez',      pos: 'MF', rating: 82, club: 'Minnesota United' },
    { name: 'Davinson Sánchez',     pos: 'DF', rating: 82, club: 'Galatasaray' },
  ],
  uru: [
    { name: 'Federico Valverde',    pos: 'MF', rating: 89, club: 'Real Madrid' },
    { name: 'Darwin Núñez',         pos: 'FW', rating: 85, club: 'Liverpool' },
    { name: 'Rodrigo Bentancur',    pos: 'MF', rating: 83, club: 'Tottenham Hotspur' },
  ],
  cro: [
    { name: 'Luka Modrić',          pos: 'MF', rating: 85, club: 'Real Madrid' },
    { name: 'Joško Gvardiol',       pos: 'DF', rating: 88, club: 'Manchester City' },
    { name: 'Mateo Kovačić',        pos: 'MF', rating: 85, club: 'Manchester City' },
  ],
  egy: [
    { name: 'Mohamed Salah',        pos: 'FW', rating: 90, club: 'Liverpool' },
  ],
  nor: [
    { name: 'Erling Haaland',       pos: 'FW', rating: 93, club: 'Manchester City' },
    { name: 'Martin Ødegaard',      pos: 'MF', rating: 88, club: 'Arsenal' },
  ],
  usa: [
    { name: 'Christian Pulisic',    pos: 'FW', rating: 85, club: 'AC Milan' },
    { name: 'Weston McKennie',      pos: 'MF', rating: 80, club: 'Juventus' },
  ],
  can: [
    { name: 'Alphonso Davies',      pos: 'DF', rating: 87, club: 'Bayern Munich' },
    { name: 'Jonathan David',       pos: 'FW', rating: 85, club: 'Juventus' },
  ],
  aut: [
    { name: 'David Alaba',          pos: 'DF', rating: 85, club: 'Real Madrid' },
    { name: 'Marcel Sabitzer',      pos: 'MF', rating: 82, club: 'Borussia Dortmund' },
  ],
  sui: [
    { name: 'Granit Xhaka',         pos: 'MF', rating: 83, club: 'Bayer Leverkusen' },
    { name: 'Yann Sommer',          pos: 'GK', rating: 84, club: 'Inter Milan' },
  ],
  alg: [
    { name: 'Riyad Mahrez',         pos: 'FW', rating: 84, club: 'Al-Ahli' },
    { name: 'Houssem Aouar',        pos: 'MF', rating: 80, club: 'Al-Ittihad' },
  ],
  swe: [
    { name: 'Alexander Isak',       pos: 'FW', rating: 87, club: 'Newcastle United' },
    { name: 'Dejan Kulusevski',     pos: 'MF', rating: 84, club: 'Tottenham Hotspur' },
  ],
  irn: [
    { name: 'Mehdi Taremi',         pos: 'FW', rating: 84, club: 'Inter Milan' },
    { name: 'Sardar Azmoun',        pos: 'FW', rating: 82, club: 'AS Roma' },
  ],
  ecu: [
    { name: 'Moisés Caicedo',       pos: 'MF', rating: 86, club: 'Chelsea' },
    { name: 'Enner Valencia',       pos: 'FW', rating: 79, club: 'Internacional' },
  ],
  sen: [
    { name: 'Sadio Mané',           pos: 'FW', rating: 83, club: 'Al Nassr' },
    { name: 'Idrissa Gueye',        pos: 'MF', rating: 80, club: 'Everton' },
  ],
  gha: [
    { name: 'Mohammed Kudus',       pos: 'MF', rating: 84, club: 'West Ham United' },
    { name: 'Jordan Ayew',          pos: 'FW', rating: 76, club: 'Leicester City' },
  ],
  mex: [
    { name: 'Hirving Lozano',       pos: 'FW', rating: 82, club: 'PSV Eindhoven' },
    { name: 'Edson Álvarez',        pos: 'MF', rating: 82, club: 'West Ham United' },
    { name: 'Guillermo Ochoa',      pos: 'GK', rating: 79, club: 'Club América' },
  ],
  bih: [
    { name: 'Edin Džeko',           pos: 'FW', rating: 79, club: 'Schalke 04' },
    { name: 'Ermedin Demirović',    pos: 'FW', rating: 81, club: 'VfB Stuttgart' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Procedural clubs (for non-star players)
// ─────────────────────────────────────────────────────────────────────────────
const POP_CLUBS = [
  'Real Madrid','Manchester City','Barcelona','Arsenal','Liverpool','Bayern Munich',
  'Juventus','AC Milan','Inter Milan','Paris Saint-Germain','Atlético Madrid','Chelsea',
  'Manchester United','Tottenham Hotspur','Bayer Leverkusen','Borussia Dortmund',
  'Galatasaray','Al-Hilal','Al Nassr','Sporting CP','Benfica','FC Porto','Lazio',
  'Aston Villa','Newcastle United','West Ham United','Feyenoord','PSV Eindhoven','Ajax',
  'Brighton','Napoli','Atalanta','Sevilla','Real Betis','Villarreal','Celtic','Rangers'
];

// ─────────────────────────────────────────────────────────────────────────────
// Squad generation (unchanged logic, corrected inputs)
// ─────────────────────────────────────────────────────────────────────────────
export function generateProceduralSquads(teams: Team[]): Player[] {
  const players: Player[] = [];

  teams.forEach((team) => {
    const baseMean = 88 - (team.fifa_ranking * 0.16);
    const meanRating = Math.max(70, Math.min(92, baseMean));

    let charSum = 0;
    for (let i = 0; i < team.slug.length; i++) charSum += team.slug.charCodeAt(i);
    const rng = new LCG(charSum + 2026);

    const regKey = SLUG_TO_REGION[team.slug] || 'anglo';
    const names = NAMES_DB[regKey];

    const overrides = [...(STARS_OVERRIDE[team.slug] || [])];

    const positions: Array<'GK' | 'DF' | 'MF' | 'FW'> = [
      'GK','GK','GK',
      'DF','DF','DF','DF','DF','DF','DF','DF',
      'MF','MF','MF','MF','MF','MF','MF','MF',
      'FW','FW','FW','FW','FW','FW','FW'
    ];

    for (let index = 0; index < 26; index++) {
      const pos = positions[index];
      const shirt = index + 1;
      const pAge = rng.rangeInt(18, 35);

      const overrideIndex = overrides.findIndex(o => o.pos === pos);
      let pName: string, pRating: number, pClub: string;

      if (overrideIndex !== -1) {
        const star = overrides.splice(overrideIndex, 1)[0];
        pName = star.name;
        pRating = star.rating;
        pClub = star.club;
      } else {
        const firstName = rng.choice(names.first);
        const lastName  = rng.choice(names.last);
        pName = `${firstName} ${lastName}`;
        pClub = rng.choice(POP_CLUBS);
        const variance = rng.range(-4, 4);
        pRating = Math.max(65, Math.min(93, Math.round(meanRating + variance)));
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

// ─────────────────────────────────────────────────────────────────────────────
// Fixture generation — real venue assignments per group
// ─────────────────────────────────────────────────────────────────────────────

// Official WC 2026 venues
const VENUES_BY_GROUP: Record<string, string[]> = {
  A: ['Estadio Azteca, Mexico City',     'Estadio Akron, Guadalajara',         'Mercedes-Benz Stadium, Atlanta'],
  B: ['BMO Field, Toronto',              'BC Place, Vancouver',                'Levi\'s Stadium, San Francisco'],
  C: ['Gillette Stadium, Boston',        'MetLife Stadium, New York/New Jersey','Lincoln Financial Field, Philadelphia'],
  D: ['SoFi Stadium, Los Angeles',       'BC Place, Vancouver',                'SoFi Stadium, Los Angeles'],
  E: ['NRG Stadium, Houston',            'AT&T Stadium, Dallas',               'NRG Stadium, Houston'],
  F: ['Lumen Field, Seattle',            'Arrowhead Stadium, Kansas City',     'Lumen Field, Seattle'],
  G: ['Lumen Field, Seattle',            'Levi\'s Stadium, San Francisco',     'Soldier Field, Chicago'],
  H: ['Mercedes-Benz Stadium, Atlanta',  'Estadio Azteca, Mexico City',        'Estadio Akron, Guadalajara'],
  I: ['Hard Rock Stadium, Miami',        'MetLife Stadium, New York/New Jersey','Hard Rock Stadium, Miami'],
  J: ['Arrowhead Stadium, Kansas City',  'Levi\'s Stadium, San Francisco',     'AT&T Stadium, Dallas'],
  K: ['Estadio Akron, Guadalajara',      'Estadio Akron, Guadalajara',         'SoFi Stadium, Los Angeles'],
  L: ['MetLife Stadium, New York/New Jersey','Lincoln Financial Field, Philadelphia','Gillette Stadium, Boston'],
};

export function generateGroupFixtures(group_letter: string, groupTeams: Team[]): Match[] {
  if (groupTeams.length !== 4) return [];
  const [t1, t2, t3, t4] = groupTeams;
  const venues = VENUES_BY_GROUP[group_letter] || [
    'MetLife Stadium, New York/New Jersey',
    'SoFi Stadium, Los Angeles',
    'AT&T Stadium, Dallas',
  ];

  // Group stage: June 11–27. Spread matchdays across 3 windows.
  // MD1: days 0–4, MD2: days 5–9, MD3: days 14–16 (June 25-27)
  const pairs = [
    { home: t1, away: t2, daysOffset: 1,  venue: venues[0] },
    { home: t3, away: t4, daysOffset: 2,  venue: venues[1] },
    { home: t1, away: t3, daysOffset: 7,  venue: venues[2] },
    { home: t2, away: t4, daysOffset: 8,  venue: venues[0] },
    { home: t4, away: t1, daysOffset: 14, venue: venues[1] },
    { home: t2, away: t3, daysOffset: 14, venue: venues[2] },
  ];

  return pairs.map((pair, idx) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// Database class (logic unchanged, data corrected above)
// ─────────────────────────────────────────────────────────────────────────────
export class WC26Database {
  public teams: Team[]    = [];
  public players: Player[]= [];
  public groups: Group[]  = [];
  public matches: Match[] = [];

  constructor() { this.reset(); }

  public reset() {
    this.teams   = [...SEED_TEAMS];
    this.groups  = [...SEED_GROUPS];
    this.players = generateProceduralSquads(this.teams);

    let allMatches: Match[] = [];
    this.groups.forEach((group) => {
      const groupTeams = this.teams.filter((t) => t.group_letter === group.letter);
      allMatches = [...allMatches, ...generateGroupFixtures(group.letter, groupTeams)];
    });
    this.matches = allMatches;

    // Pre-play ~33% of group stage matches for bracket demo realism
    const rng = new LCG(9999);
    this.matches.forEach((m, idx) => {
      if (idx % 3 === 0) {
        const hTeam = this.teams.find(t => t.id === m.team_home_id);
        const aTeam = this.teams.find(t => t.id === m.team_away_id);
        if (hTeam && aTeam) {
          const hFactor = Math.max(0.5, 1.3 + (100 - hTeam.fifa_ranking - (100 - aTeam.fifa_ranking)) * 0.015);
          const aFactor = Math.max(0.5, 1.3 + (100 - aTeam.fifa_ranking - (100 - hTeam.fifa_ranking)) * 0.015);
          m.score_home = rng.rangeInt(0, Math.floor(hFactor * 1.8));
          m.score_away = rng.rangeInt(0, Math.floor(aFactor * 1.8));
          m.played = true;
        }
      }
    });

    this.generateKnockoutPrereqs();
  }

  private generateKnockoutPrereqs() {
    const knockoutStages: Array<'Round of 32' | 'Round of 16' | 'Quarterfinals' | 'Semifinals' | 'Final'> = [
      'Round of 32','Round of 16','Quarterfinals','Semifinals','Final'
    ];
    const countPerStage = { 'Round of 32': 16, 'Round of 16': 8, 'Quarterfinals': 4, 'Semifinals': 2, 'Final': 1 };
    const venues = [
      'BC Place, Vancouver',           'Lumen Field, Seattle',
      'Levi\'s Stadium, San Francisco','SoFi Stadium, Los Angeles',
      'Estadio Azteca, Mexico City',   'AT&T Stadium, Dallas',
      'NRG Stadium, Houston',          'Mercedes-Benz Stadium, Atlanta',
      'Lincoln Financial Field, Philadelphia', 'MetLife Stadium, NY/NJ',
      'Gillette Stadium, Boston',      'Hard Rock Stadium, Miami'
    ];

    const rng   = new LCG(22026);
    let day = 28; // KO starts June 28

    knockoutStages.forEach(stage => {
      const count = countPerStage[stage];
      for (let i = 0; i < count; i++) {
        const month = day <= 30 ? '06' : '07';
        const dayStr = day <= 30 ? day : day - 30;
        const match_date = `2026-${month}-${String(dayStr).padStart(2,'0')}T20:00:00Z`;
        this.matches.push({
          id: `match_ko_${stage.replace(/\s+/g,'_').toLowerCase()}_${i + 1}`,
          team_home_id: this.teams[i % this.teams.length].id,
          team_away_id: this.teams[(i + 5) % this.teams.length].id,
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

  public getGroupStandings(letter: string): GroupStandings[] {
    const standings: Record<string, GroupStandings> = {};
    this.teams.filter(t => t.group_letter === letter).forEach(team => {
      standings[team.id] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
    });

    this.matches.filter(m => m.group_letter === letter && m.played).forEach(m => {
      const home = standings[m.team_home_id];
      const away = standings[m.team_away_id];
      const sh = m.score_home ?? 0;
      const sa = m.score_away ?? 0;
      if (home && away) {
        home.played++; away.played++;
        home.gf += sh; home.ga += sa; home.gd = home.gf - home.ga;
        away.gf += sa; away.ga += sh; away.gd = away.gf - away.ga;
        if (sh > sa)      { home.won++; home.points += 3; away.lost++; }
        else if (sh < sa) { away.won++; away.points += 3; home.lost++; }
        else              { home.drawn++; away.drawn++; home.points++; away.points++; }
      }
    });

    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd     !== a.gd)     return b.gd - a.gd;
      if (b.gf     !== a.gf)     return b.gf - a.gf;
      return a.team.fifa_ranking - b.team.fifa_ranking;
    });
  }

  public updateMatchScore(matchId: string, scoreHome: number, scoreAway: number, played = true) {
    const match = this.matches.find(m => m.id === matchId);
    if (match) {
      match.score_home = scoreHome;
      match.score_away = scoreAway;
      match.played = played;
      this.recalculateKnockouts();
    }
  }

  private recalculateKnockouts() {
    const firsts: Team[] = [], seconds: Team[] = [];
    const thirds: Array<{ team: Team; points: number; gd: number; gf: number }> = [];

    this.groups.forEach(g => {
      const std = this.getGroupStandings(g.letter);
      if (std[0]) firsts.push(std[0].team);
      if (std[1]) seconds.push(std[1].team);
      if (std[2]) thirds.push({ team: std[2].team, points: std[2].points, gd: std[2].gd, gf: std[2].gf });
    });

    const qualifiedThirds = thirds
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.fifa_ranking - b.team.fifa_ranking)
      .slice(0, 8).map(t => t.team);

    const allQualified = [...firsts, ...seconds, ...qualifiedThirds];
    this.matches.filter(m => m.stage === 'Round of 32').forEach((m, idx) => {
      const h = allQualified[(idx * 2)     % allQualified.length];
      const a = allQualified[(idx * 2 + 1) % allQualified.length];
      if (h && a) { m.team_home_id = h.id; m.team_away_id = a.id; }
    });
  }

  public simulateAllGroupStage() {
    const rng = new LCG(Math.floor(Math.random() * 100000));
    this.matches.filter(m => m.stage === 'Group').forEach(m => {
      const hTeam = this.teams.find(t => t.id === m.team_home_id);
      const aTeam = this.teams.find(t => t.id === m.team_away_id);
      if (hTeam && aTeam) {
        const hFactor = Math.max(0.4, 1.35 + (100 - hTeam.fifa_ranking - (100 - aTeam.fifa_ranking)) * 0.015);
        const aFactor = Math.max(0.4, 1.35 + (100 - aTeam.fifa_ranking - (100 - hTeam.fifa_ranking)) * 0.015);
        m.score_home = rng.rangeInt(0, Math.floor(hFactor * 1.8));
        m.score_away = rng.rangeInt(0, Math.floor(aFactor * 1.8));
        m.played = true;
      }
    });
    this.recalculateKnockouts();
  }
}

export const dbInstance = new WC26Database();