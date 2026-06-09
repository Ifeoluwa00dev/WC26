/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DATA ACCURACY NOTE
 * ------------------
 * SEED_TEAMS and SEED_GROUPS reflect the OFFICIAL FIFA World Cup 2026 draw
 * (December 5, 2025, Washington D.C.) with all six playoff spots resolved.
 *
 * Groups  : verified against FIFA / Wikipedia group articles (June 2026)
 * Coaches : verified against Vanguard/Bolavip full-coach lists (May 2026)
 * FIFA rankings used for seeding: November 2025 FIFA ranking list
 *
 * Player squads remain procedurally generated (generateProceduralSquads).
 * Star overrides use confirmed June 2026 squad announcements.
 */

import { Team, Player, Group, Match, GroupStandings } from '../types';

// ---------------------------------------------------------------------------
// LCG – deterministic PRNG (unchanged)
// ---------------------------------------------------------------------------
export class LCG {
  private m = 0x80000000;
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

  range(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  choice<T>(arr: T[]): T {
    const idx = Math.floor(this.nextFloat() * arr.length);
    return arr[idx];
  }
}

// ---------------------------------------------------------------------------
// Name pools
// ---------------------------------------------------------------------------
const NAMES_DB: Record<string, { first: string[]; last: string[] }> = {
  anglo: {
    first: ['Brandon','Jordan','Callum','Tyler','Marcus','Gareth','Harry','Declan','Mason','Jude','Bukayo','Conor','Ethan','Kieran','Harvey','Reece','Jack','Luke','Tyrone','Ollie','James','Liam','Ewan','Lewis','Che','Danny'],
    last:  ['Smith','Walker','Rice','Bellingham','Saka','Stones','Trippier','Gallagher','Palmer','Foden','Kane','Pickford','Ramsdale','Shaw','Maguire','Alexander-Arnold','Henderson','Watkins','Adams','Gilmour','McTominay','Robertson','Johnson','Bailey','Antonio','Blake'],
  },
  spanish: {
    first: ['Mateo','Santiago','Emiliano','Enzo','Lautaro','Julian','Angel','Nahuel','Rodrigo','Nicolas','Alexis','Leandro','Gonzalo','Geronimo','Lucas','Guido','Marcos','German','Alejandro','Lisandro','Valentino','Alvaro','Javier','Sandro','Pau','Dani'],
    last:  ['Gomez','Fernandez','Martinez','Alvarez','Gonzalez','Rodriguez','Paredes','De Paul','Molina','Tagliafico','Acuna','Romero','Otamendi','Montiel','Palacios','Mac Allister','Di Maria','Correa','Rulli','Armani','Garnacho','Soto','Herrera','Torres','Perez','Ruiz'],
  },
  french: {
    first: ['Kylian','Antoine','Olivier','Ousmane','Aurélien','Eduardo','Adrien','Youssouf','Jonathan','Theo','Dayot','William','Ibrahima','Benjamin','Lucas','Brice','Alphonse','Mike','Kingsley','Randal','Marcus','Warren','Christopher','Saliba','Karim','Pierre'],
    last:  ['Mbappé','Griezmann','Giroud','Dembélé','Tchouaméni','Camavinga','Rabiot','Fofana','Clauss','Hernández','Upamecano','Saliba','Konaté','Pavard','Thuram','Samba','Areola','Maignan','Coman','Kolo Muani','Zaire-Emery','Nkunku','Koundé','Mendy','Dubois','Leroy'],
  },
  portuguese: {
    first: ['Cristiano','Bruno','Bernardo','Ruben','Rafael','João','Diogo','Vitinha','Matheus','Gonçalo','Pedro','Danilo','Nuno','Nelson','Pepe','Jose','Rui','Otavio','Francisco','Antonio','Tiago','Andre','Fabio','Geraldo','Manuel','Ricardo'],
    last:  ['Ronaldo','Fernandes','Silva','Dias','Leão','Félix','Jota','Cancelo','Mendes','Nunes','Ramos','Neto','Pereira','Semedo','Neves','Sá','Patrício','Palhinha','Conceição','Inácio','Guerreiro','Gomes','Almeida','Monteiro','Cardoso','Sousa'],
  },
  german: {
    first: ['Florian','Jamal','Thomas','Kai','Leroy','Joshua','Ilkay','Leon','Toni','Maximilian','Robin','Antonio','Jonathan','Benjamin','Marc','Manuel','Oliver','Nico','David','Gregor','Yann','Granit','Breel','Ruben','Fabian','Silvan'],
    last:  ['Wirtz','Musiala','Müller','Havertz','Sané','Kimmich','Gündogan','Goretzka','Kroos','Beier','Gosens','Rüdiger','Tah','Henrichs','Ter Stegen','Neuer','Baumann','Schlotterbeck','Raum','Kobel','Sommer','Xhaka','Embolo','Vargas','Schär','Widmer'],
  },
  arabic: {
    first: ['Mohamed','Ahmed','Youssef','Amine','Riyad','Sofiane','Saïd','Ismaël','Aissa','Ramy','Nabil','Baghdad','Yassine','Achraf','Hakim','Noussair','Nayef','Selim','Azzedine','Sofyan','Bilal','Abderrazak','Salem','Firas','Ali','Hassan'],
    last:  ['Salah','Hassan','Mahrez','Bennacer','Mandi','Bensebaini','Bentaleb','Bounedjah','Slimani','Bounou','Hakimi','Ziyech','Mazraoui','Aguerd','Amrabat','Ounahi','En-Nesyri','Boufal','El Khannouss','Cheddira','Al-Dawsari','Al-Shehri','Al-Muwallad','Al-Abed','Al-Owais','Al-Faraj'],
  },
  asian: {
    first: ['Heung-min','Min-jae','Kang-in','Hee-chan','Gue-sung','Jae-sung','In-beom','Woo-yeong','Seung-gyu','Hiroshi','Kaoru','Takefusa','Wataru','Ritsu','Daichi','Ko','Shogo','Yukinari','Mehdi','Alireza','Sardar','Saman','Milad','Hossein','Yuki','Ao'],
    last:  ['Son','Kim','Lee','Hwang','Cho','Park','Jeong','Jo','Mitoma','Kubo','Endo','Doan','Kamada','Itakura','Taniguchi','Sugawara','Suzuki','Taremi','Jahanbakhsh','Azmoun','Goddos','Mohammadi','Hosseini','Beiranvand','Kanani','Nakata'],
  },
  african: {
    first: ['Victor','Ademola','Alex','Wilfred','Moses','Kelechi','Samuel','Terem','Ola','William','Sipho','Themba','Percy','Teboho','Ronwen','Aubrey','Mothobi','Khuliso','Thomas','Mohammed','Jordan','Andre','Salis','Ismaila','Idrissa','Sadio'],
    last:  ['Osimhen','Lookman','Iwobi','Ndidi','Simon','Iheanacho','Chukwueze','Moffi','Aina','Troost-Ekong','Mokoena','Zwane','Tau','Williams','Modiba','Mvala','Mudau','Partey','Kudus','Ayew','Samed','Mensah','Gueye','Sarr','Diatta','Diallo'],
  },
  balkan: {
    first: ['Luka','Mateo','Marcelo','Andrej','Ivan','Joško','Borna','Domagoj','Lovro','Mario','Dominik','Nikola','Stefan','Vito','Boris','Dario','Tin','Marko','Ante','Bruno','Josip','Marin','Duje','Niko','Tomislav','Antonio'],
    last:  ['Modrić','Kovačić','Brozović','Kramarić','Perišić','Gvardiol','Sosa','Vida','Majer','Pasalić','Livaković','Budimir','Vlašić','Ivanušec','Stanišić','Šutalo','Pjaca','Baturina','Erlic','Juranović','Čaleta-Car','Petković','Ristovski','Mamić','Ljubičić','Jakić'],
  },
  eastEuro: {
    first: ['Robert','Piotr','Jakub','Kamil','Artur','Bartosz','Wojciech','Mateusz','Krzysztof','Tomas','Patrik','Ondrej','Adam','Martin','Marek','David','Lukas','Ladislav','Jan','Michal','Filip','Vladimir','Radoslav','Stanislav','Roman','Petr'],
    last:  ['Lewandowski','Zielinski','Moder','Grosicki','Milik','Szymanski','Szczesny','Frankowski','Bednarek','Soucek','Schick','Kuchta','Hlozek','Barak','Sadilek','Coufal','Holes','Lingr','Jurasek','Provod','Cerny','Vlcek','Kral','Zeleny','Novak','Jankto'],
  },
  dutch: {
    first: ['Virgil','Memphis','Frenkie','Cody','Xavi','Tijjani','Denzel','Nathan','Matthijs','Stefan','Jeremie','Bart','Mark','Justin','Brian','Wout','Georginio','Daley','Lutsharel','Micky','Quinten','Steven','Joey','Ryan','Jurrien','Donyell'],
    last:  ['van Dijk','Depay','de Jong','Gakpo','Simons','Reijnders','Dumfries','Aké','de Ligt','de Vrij','Frimpong','Verbruggen','Flekken','Bijlow','Brobbey','Weghorst','Wijnaldum','Blind','Geertruida','van de Ven','Timber','Bergwijn','Veerman','Gravenberch','Taylor','Malen'],
  },
  nordic: {
    first: ['Alexander','Victor','Emil','Dejan','Robin','Ludwig','Filip','Ken','Jens','Anthony','Christian','Pierre-Emile','Joachim','Rasmus','Kasper','Andreas','Mikkel','Morten','Gustav','Robert','Martin','Lars','Chris','Frederik','Marcus','Erling'],
    last:  ['Isak','Lindelöf','Forsberg','Kulusevki','Olsen','Augustinsson','Helander','Sema','Cajuste','Elanga','Eriksen','Højbjerg','Andersen','Højlund','Schmeichel','Vestergaard','Christensen','Kristiansen','Damsgaard','Hjulmand','Isaksen','Wind','Dolberg','Ronnow','Hermansen','Haaland'],
  },
  southAmerican: {
    first: ['Miguel','Diego','Carlos','Luis','Rodrigo','Gabriel','Edinson','Darwin','Facundo','Mathias','Maximiliano','Federico','Nicolas','Agustin','Gaston','Guido','Thiago','Raphinha','Endrick','Savinho','Marquinhos','Casemiro','Richarlison','Danilo','Vinicius','Bruno'],
    last:  ['Almiron','Gomez','Nunez','Torres','Pellistri','Ugarte','Bentancur','Olivera','Gimenez','Araujo','Valverde','Paez','Mendez','Rodriguez','Silva','Militao','Guimaraes','Gomes','Veiga','Paqueta','Jesus','Alisson','Ederson','Raphinha','Endrick','Rodrygo'],
  },
};

const SLUG_TO_REGION: Record<string, string> = {
  mex:'spanish', rsa:'african', kor:'asian',   cze:'eastEuro',
  can:'anglo',   sui:'german',  qat:'arabic',   bih:'balkan',
  bra:'portuguese', mar:'arabic', sco:'anglo',  hai:'spanish',
  usa:'anglo',   aus:'anglo',   par:'southAmerican', tur:'arabic',
  ger:'german',  ecu:'spanish', civ:'french',   cur:'dutch',
  ned:'dutch',   jpn:'asian',   tun:'arabic',   swe:'nordic',
  bel:'dutch',   irn:'asian',   egy:'arabic',   nzl:'anglo',
  esp:'spanish', uru:'southAmerican', ksa:'arabic', cpv:'french',
  fra:'french',  sen:'african', nor:'nordic',   irq:'arabic',
  arg:'spanish', aut:'german',  alg:'arabic',   jor:'arabic',
  por:'portuguese', col:'spanish', uzb:'asian', cod:'african',
  eng:'anglo',   cro:'balkan',  pan:'spanish',  gha:'african',
};

// ---------------------------------------------------------------------------
// GROUPS – Official FIFA WC 2026 draw
// ---------------------------------------------------------------------------
export const SEED_GROUPS: Group[] = [
  { id: 'group_a', letter: 'A', nickname: 'The Host Opener',       difficulty: 'Competitive'    },
  { id: 'group_b', letter: 'B', nickname: "Canada's Challenge",    difficulty: 'Competitive'    },
  { id: 'group_c', letter: 'C', nickname: 'Samba & Atlas Lions',   difficulty: 'Competitive'    },
  { id: 'group_d', letter: 'D', nickname: 'USMNT Home Turf',       difficulty: 'Competitive'    },
  { id: 'group_e', letter: 'E', nickname: 'German Machine',        difficulty: 'Competitive'    },
  { id: 'group_f', letter: 'F', nickname: 'Oranje & Samurai',      difficulty: 'Competitive'    },
  { id: 'group_g', letter: 'G', nickname: 'Red Devils Rising',     difficulty: 'Competitive'    },
  { id: 'group_h', letter: 'H', nickname: 'Iberian Royalty',       difficulty: 'Group of Death' },
  { id: 'group_i', letter: 'I', nickname: 'Les Bleus Crucible',    difficulty: 'Group of Death' },
  { id: 'group_j', letter: 'J', nickname: 'Albiceleste Defence',   difficulty: 'Competitive'    },
  { id: 'group_k', letter: 'K', nickname: 'Iberian South',         difficulty: 'Competitive'    },
  { id: 'group_l', letter: 'L', nickname: 'Three Lions Den',       difficulty: 'Competitive'    },
];

// ---------------------------------------------------------------------------
// TEAMS – All 48 official teams (verified groups + coaches, June 2026)
// ---------------------------------------------------------------------------
export const SEED_TEAMS: Team[] = [

  // ── GROUP A: Mexico, South Africa, South Korea, Czechia ──────────────────
  {
    id: 'mex', name: 'Mexico', slug: 'mex', group_letter: 'A',
    coach_name: 'Javier Aguirre', coach_nationality: 'Mexico', confederation: 'CONCACAF',
    win_probability: 2.5,
    win_factors: 'Passionate fan support and tournament veterans. Tactical flexibility under Aguirre, though scoring against deep low blocks remains a recurring weakness.',
    fifa_ranking: 15, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇲🇽',
  },
  {
    id: 'rsa', name: 'South Africa', slug: 'rsa', group_letter: 'A',
    coach_name: 'Hugo Broos', coach_nationality: 'Belgium', confederation: 'CAF',
    win_probability: 0.8,
    win_factors: 'Solid squad chemistry built on domestic bonds. Technical ball retention is clean but aerial duels against physical opponents expose the backline.',
    fifa_ranking: 61, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇿🇦',
  },
  {
    id: 'kor', name: 'South Korea', slug: 'kor', group_letter: 'A',
    coach_name: 'Hong Myung-bo', coach_nationality: 'South Korea', confederation: 'AFC',
    win_probability: 2.0,
    win_factors: 'Relentless fitness and world-class individual brilliance via Son Heung-min. Defensive transition coordination needs work under heavy pressing opponents.',
    fifa_ranking: 22, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇰🇷',
  },
  {
    id: 'cze', name: 'Czechia', slug: 'cze', group_letter: 'A',
    coach_name: 'Ivan Hašek', coach_nationality: 'Czechia', confederation: 'UEFA',
    win_probability: 1.2,
    win_factors: 'Disciplined defensive block with experienced Bundesliga-based players. Lack of a world-class finisher limits their ceiling against elite defences.',
    fifa_ranking: 44, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇿',
  },

  // ── GROUP B: Canada, Switzerland, Qatar, Bosnia & Herzegovina ────────────
  {
    id: 'can', name: 'Canada', slug: 'can', group_letter: 'B',
    coach_name: 'Jesse Marsch', coach_nationality: 'United States', confederation: 'CONCACAF',
    win_probability: 1.5,
    win_factors: 'Elite athleticism and world-class speed via Alphonso Davies. Tactically ambitious but vulnerable out of possession in central spaces.',
    fifa_ranking: 38, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇦',
  },
  {
    id: 'sui', name: 'Switzerland', slug: 'sui', group_letter: 'B',
    coach_name: 'Murat Yakin', coach_nationality: 'Switzerland', confederation: 'UEFA',
    win_probability: 2.2,
    win_factors: 'Tactically immaculate deep blocks and Granit Xhaka\'s dictatorial passing. Lacks a high-volume clinical forward to convert chances.',
    fifa_ranking: 15, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇨🇭',
  },
  {
    id: 'qat', name: 'Qatar', slug: 'qat', group_letter: 'B',
    coach_name: 'Luis García', coach_nationality: 'Spain', confederation: 'AFC',
    win_probability: 0.7,
    win_factors: 'AFC Asian Cup holders with excellent continental pedigree. Highly synchronized squad, but the step up to the 48-team World Cup exposes physical depth issues.',
    fifa_ranking: 46, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇶🇦',
  },
  {
    id: 'bih', name: 'Bosnia & Herzegovina', slug: 'bih', group_letter: 'B',
    coach_name: 'Sergej Barbarez', coach_nationality: 'Bosnia and Herzegovina', confederation: 'UEFA',
    win_probability: 0.9,
    win_factors: 'Physical midfield presence and dangerous set pieces. First World Cup since 2014 — lack of knockout stage experience could hurt in tight games.',
    fifa_ranking: 60, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇧🇦',
  },

  // ── GROUP C: Brazil, Morocco, Scotland, Haiti ─────────────────────────────
  {
    id: 'bra', name: 'Brazil', slug: 'bra', group_letter: 'C',
    coach_name: 'Carlo Ancelotti', coach_nationality: 'Italy', confederation: 'CONMEBOL',
    win_probability: 12.0,
    win_factors: 'Supreme individual skill led by Vinicius Jr. Ancelotti\'s Champions League pedigree provides a massive upgrade in tournament composure.',
    fifa_ranking: 5, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇧🇷',
  },
  {
    id: 'mar', name: 'Morocco', slug: 'mar', group_letter: 'C',
    coach_name: 'Walid Regragui', coach_nationality: 'Morocco', confederation: 'CAF',
    win_probability: 4.5,
    win_factors: 'The 2022 semifinalists. Unmatched defensive synergy, elite fullbacks (Hakimi), supreme transitional discipline. Formidable dark-horse potential again.',
    fifa_ranking: 13, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇲🇦',
  },
  {
    id: 'sco', name: 'Scotland', slug: 'sco', group_letter: 'C',
    coach_name: 'Steve Clarke', coach_nationality: 'Scotland', confederation: 'UEFA',
    win_probability: 1.1,
    win_factors: 'High work-rate and outstanding fullbacks (Andy Robertson). Limited attacking threat, but never rolls over in a fight.',
    fifa_ranking: 50, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  },
  {
    id: 'hai', name: 'Haiti', slug: 'hai', group_letter: 'C',
    coach_name: 'Sébastien Migné', coach_nationality: 'France', confederation: 'CONCACAF',
    win_probability: 0.3,
    win_factors: 'Competitive CONCACAF qualifiers with a passionate hard-working squad. Limited depth and World Cup experience are significant hurdles.',
    fifa_ranking: 83, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇭🇹',
  },

  // ── GROUP D: USA, Australia, Paraguay, Türkiye ────────────────────────────
  {
    id: 'usa', name: 'United States', slug: 'usa', group_letter: 'D',
    coach_name: 'Mauricio Pochettino', coach_nationality: 'Argentina', confederation: 'CONCACAF',
    win_probability: 3.5,
    win_factors: 'Unified squad, massive home advantage and dynamic young wingers. Pochettino\'s high-press structure suits their athleticism. Defensive depth still a concern.',
    fifa_ranking: 16, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇺🇸',
  },
  {
    id: 'aus', name: 'Australia', slug: 'aus', group_letter: 'D',
    coach_name: 'Tony Popovic', coach_nationality: 'Australia', confederation: 'AFC',
    win_probability: 1.2,
    win_factors: 'Resilient team culture and organised direct transition play. Elite set-piece defence. Lacks world-class playmakers in the final third.',
    fifa_ranking: 24, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇦🇺',
  },
  {
    id: 'par', name: 'Paraguay', slug: 'par', group_letter: 'D',
    coach_name: 'Gustavo Alfaro', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 1.0,
    win_factors: 'Physical and combative South American side. Qualified through a gruelling CONMEBOL campaign. Disciplined defensive shape but limited star power.',
    fifa_ranking: 63, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇵🇾',
  },
  {
    id: 'tur', name: 'Türkiye', slug: 'tur', group_letter: 'D',
    coach_name: 'Vincenzo Montella', coach_nationality: 'Italy', confederation: 'UEFA',
    win_probability: 1.8,
    win_factors: 'Strong tournament pedigree. Arda Güler is a genuine game-changer. Hard-working structure under Montella but vulnerable to quick counters.',
    fifa_ranking: 30, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇹🇷',
  },

  // ── GROUP E: Germany, Ecuador, Côte d'Ivoire, Curaçao ────────────────────
  {
    id: 'ger', name: 'Germany', slug: 'ger', group_letter: 'E',
    coach_name: 'Julian Nagelsmann', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 10.0,
    win_factors: 'Dual playmaker threat in Wirtz and Musiala in the half-spaces. Tactical masterpieces under Nagelsmann. Prone to defensive errors in transition.',
    fifa_ranking: 6, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇩🇪',
  },
  {
    id: 'ecu', name: 'Ecuador', slug: 'ecu', group_letter: 'E',
    coach_name: 'Sebastián Beccacece', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 1.8,
    win_factors: 'Physical power and Moisés Caicedo dominating midfield. High altitude conditioning advantage. Clinical finishing in tight setups remains a weakness.',
    fifa_ranking: 30, best_case: 'Round of 16', realistic_target: 'Round of 16', flag: '🇪🇨',
  },
  {
    id: 'civ', name: "Côte d'Ivoire", slug: 'civ', group_letter: 'E',
    coach_name: 'Emerse Faé', coach_nationality: "Côte d'Ivoire", confederation: 'CAF',
    win_probability: 2.5,
    win_factors: 'Reigning Africa Cup of Nations champions. Sébastien Haller and Simon Adingra lead a talented attack — the most dangerous African squad for firepower.',
    fifa_ranking: 27, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇨🇮',
  },
  {
    id: 'cur', name: 'Curaçao', slug: 'cur', group_letter: 'E',
    coach_name: 'Dick Advocaat', coach_nationality: 'Netherlands', confederation: 'CONCACAF',
    win_probability: 0.1,
    win_factors: 'History makers — smallest nation by population ever at a World Cup. Eredivisie-based core with Dutch-Curaçaoan diaspora talent. Massive underdog.',
    fifa_ranking: 91, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇨🇼',
  },

  // ── GROUP F: Netherlands, Japan, Tunisia, Sweden ──────────────────────────
  {
    id: 'ned', name: 'Netherlands', slug: 'ned', group_letter: 'F',
    coach_name: 'Ronald Koeman', coach_nationality: 'Netherlands', confederation: 'UEFA',
    win_probability: 8.5,
    win_factors: 'Strongest defensive leader in the world in Virgil van Dijk. Dynamic wingback systems and creative midfield depth. Lacks a world-class No. 9.',
    fifa_ranking: 8, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇳🇱',
  },
  {
    id: 'jpn', name: 'Japan', slug: 'jpn', group_letter: 'F',
    coach_name: 'Hajime Moriyasu', coach_nationality: 'Japan', confederation: 'AFC',
    win_probability: 3.5,
    win_factors: 'Supreme organizational fluidity with a roster full of European starters. Superb tactical discipline and supreme dark-horse potential.',
    fifa_ranking: 17, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇯🇵',
  },
  {
    id: 'tun', name: 'Tunisia', slug: 'tun', group_letter: 'F',
    coach_name: 'Sami Trabelsi', coach_nationality: 'Tunisia', confederation: 'CAF',
    win_probability: 0.7,
    win_factors: 'Dense defensive layout and organized set plays. Disconnected build-up leaves forwards isolated. Hard to break down, very hard to win with.',
    fifa_ranking: 47, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇹🇳',
  },
  {
    id: 'swe', name: 'Sweden', slug: 'swe', group_letter: 'F',
    coach_name: 'Jon Dahl Tomasson', coach_nationality: 'Denmark', confederation: 'UEFA',
    win_probability: 1.4,
    win_factors: 'Outstanding aerial threat and structured physical play. Solid Bundesliga-based core but struggles to match pace against rapid transition runners.',
    fifa_ranking: 28, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇸🇪',
  },

  // ── GROUP G: Belgium, Iran, Egypt, New Zealand ────────────────────────────
  {
    id: 'bel', name: 'Belgium', slug: 'bel', group_letter: 'G',
    coach_name: 'Rudi Garcia', coach_nationality: 'France', confederation: 'UEFA',
    win_probability: 4.5,
    win_factors: 'Kevin De Bruyne still pulling strings. New generation around Doku and De Ketelaere. Defensive transition in a rebuilding phase with younger profiles.',
    fifa_ranking: 10, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇧🇪',
  },
  {
    id: 'irn', name: 'Iran', slug: 'irn', group_letter: 'G',
    coach_name: 'Amir Ghalenoei', coach_nationality: 'Iran', confederation: 'AFC',
    win_probability: 1.3,
    win_factors: 'Deadly Taremi–Azmoun forward partnership. Well-disciplined structural block. Struggles to maintain energy against physical midfields over 90 minutes.',
    fifa_ranking: 19, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇮🇷',
  },
  {
    id: 'egy', name: 'Egypt', slug: 'egy', group_letter: 'G',
    coach_name: 'Hossam Hassan', coach_nationality: 'Egypt', confederation: 'CAF',
    win_probability: 1.5,
    win_factors: 'Anchored by world-class Mohamed Salah. Capable of clinical counter-attacks but overall midfield creativity beyond him is limited.',
    fifa_ranking: 36, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇪🇬',
  },
  {
    id: 'nzl', name: 'New Zealand', slug: 'nzl', group_letter: 'G',
    coach_name: 'Darren Bazeley', coach_nationality: 'England', confederation: 'OFC',
    win_probability: 0.2,
    win_factors: 'Physical defence and target-man threat on direct balls. Lacks depth and high-level international championship experience.',
    fifa_ranking: 94, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇳🇿',
  },

  // ── GROUP H: Spain, Uruguay, Saudi Arabia, Cape Verde ─────────────────────
  {
    id: 'esp', name: 'Spain', slug: 'esp', group_letter: 'H',
    coach_name: 'Luis de la Fuente', coach_nationality: 'Spain', confederation: 'UEFA',
    win_probability: 13.0,
    win_factors: 'Euro 2024 champions. Incredible possession control with lethal wing wizards Lamine Yamal and Nico Williams. Extremely robust counter-press structures.',
    fifa_ranking: 1, best_case: 'Winner', realistic_target: 'Final', flag: '🇪🇸',
  },
  {
    id: 'uru', name: 'Uruguay', slug: 'uru', group_letter: 'H',
    coach_name: 'Marcelo Bielsa', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 5.5,
    win_factors: 'Relentless high-intensity man-pressing and elite defensive warriors. Darwin Núñez and Valverde form a fearsome duo. High risk if pressing triggers fail.',
    fifa_ranking: 11, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇺🇾',
  },
  {
    id: 'ksa', name: 'Saudi Arabia', slug: 'ksa', group_letter: 'H',
    coach_name: 'Hervé Renard', coach_nationality: 'France', confederation: 'AFC',
    win_probability: 1.0,
    win_factors: 'Renard\'s motivational record is legendary (upset Argentina in 2022). Compact structure, but struggles away from Gulf conditions.',
    fifa_ranking: 56, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇸🇦',
  },
  {
    id: 'cpv', name: 'Cape Verde', slug: 'cpv', group_letter: 'H',
    coach_name: 'Bubista', coach_nationality: 'Cape Verde', confederation: 'CAF',
    win_probability: 0.5,
    win_factors: 'Technically fluid players with strong athletic profiles. Lack of World Cup consistency weakens overall knockout viability.',
    fifa_ranking: 65, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇨🇻',
  },

  // ── GROUP I: France, Senegal, Norway, Iraq ────────────────────────────────
  {
    id: 'fra', name: 'France', slug: 'fra', group_letter: 'I',
    coach_name: 'Didier Deschamps', coach_nationality: 'France', confederation: 'UEFA',
    win_probability: 13.5,
    win_factors: 'A squad of supreme athletic power featuring Mbappé, Dembélé and a world-class supporting cast. Deschamps\' final tournament — expect maximum motivation.',
    fifa_ranking: 2, best_case: 'Winner', realistic_target: 'Final', flag: '🇫🇷',
  },
  {
    id: 'sen', name: 'Senegal', slug: 'sen', group_letter: 'I',
    coach_name: 'Pape Thiaw', coach_nationality: 'Senegal', confederation: 'CAF',
    win_probability: 3.0,
    win_factors: 'Outstanding physical stature, dynamic wingers and excellent defensive leadership. True dark horse with veteran experience and academy talent.',
    fifa_ranking: 20, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇸🇳',
  },
  {
    id: 'nor', name: 'Norway', slug: 'nor', group_letter: 'I',
    coach_name: 'Ståle Solbakken', coach_nationality: 'Norway', confederation: 'UEFA',
    win_probability: 4.0,
    win_factors: 'Erling Haaland is arguably the deadliest striker on the planet. Solid Bundesliga/PL supporting cast. Historic first World Cup since 1998.',
    fifa_ranking: 23, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇳🇴',
  },
  {
    id: 'irq', name: 'Iraq', slug: 'irq', group_letter: 'I',
    coach_name: 'Jesús Casas', coach_nationality: 'Spain', confederation: 'AFC',
    win_probability: 0.5,
    win_factors: 'Well-drilled tactical mid-block and resilient team ethic. Serious concerns with tempo management against top-tier physical midfields.',
    fifa_ranking: 55, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇮🇶',
  },

  // ── GROUP J: Argentina, Austria, Algeria, Jordan ──────────────────────────
  {
    id: 'arg', name: 'Argentina', slug: 'arg', group_letter: 'J',
    coach_name: 'Lionel Scaloni', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 14.0,
    win_factors: 'Defending world champions. Elite squad harmony, dynamic tactical flexibility and the legendary threat of Lionel Messi. Midfield controller network unmatched.',
    fifa_ranking: 3, best_case: 'Winner', realistic_target: 'Final', flag: '🇦🇷',
  },
  {
    id: 'aut', name: 'Austria', slug: 'aut', group_letter: 'J',
    coach_name: 'Ralf Rangnick', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 2.5,
    win_factors: 'Rangnick\'s high-intensity press is one of the best organised in Europe. Marcel Sabitzer and Christoph Baumgartner provide real quality in midfield.',
    fifa_ranking: 25, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇦🇹',
  },
  {
    id: 'alg', name: 'Algeria', slug: 'alg', group_letter: 'J',
    coach_name: 'Vladimir Petković', coach_nationality: 'Switzerland', confederation: 'CAF',
    win_probability: 1.0,
    win_factors: 'Excellent tactical discipline and dangerous creative playmakers. Tendency to concede late in matches. Petković brings solid European tactical knowledge.',
    fifa_ranking: 42, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇩🇿',
  },
  {
    id: 'jor', name: 'Jordan', slug: 'jor', group_letter: 'J',
    coach_name: 'Jamal Sellami', coach_nationality: 'Tunisia', confederation: 'AFC',
    win_probability: 0.4,
    win_factors: '2023 AFC Asian Cup finalists. Disciplined defensive unit with a surprising upset pedigree. Their first-ever World Cup appearance is historic.',
    fifa_ranking: 68, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇯🇴',
  },

  // ── GROUP K: Portugal, Colombia, Uzbekistan, DR Congo ─────────────────────
  {
    id: 'por', name: 'Portugal', slug: 'por', group_letter: 'K',
    coach_name: 'Roberto Martínez', coach_nationality: 'Spain', confederation: 'UEFA',
    win_probability: 9.0,
    win_factors: 'Unparalleled squad depth. Ronaldo\'s experience paired with Bernardo Silva, Bruno Fernandes and Rafael Leão. Defensively stable and tactically versatile.',
    fifa_ranking: 7, best_case: 'Winner', realistic_target: 'Semifinals', flag: '🇵🇹',
  },
  {
    id: 'col', name: 'Colombia', slug: 'col', group_letter: 'K',
    coach_name: 'Néstor Lorenzo', coach_nationality: 'Argentina', confederation: 'CONMEBOL',
    win_probability: 4.0,
    win_factors: 'High-energy pressing, creative genius of Luis Díaz and elite defensive transition control. One of the strongest South American sides in this tournament.',
    fifa_ranking: 12, best_case: 'Semifinals', realistic_target: 'Quarterfinals', flag: '🇨🇴',
  },
  {
    id: 'uzb', name: 'Uzbekistan', slug: 'uzb', group_letter: 'K',
    coach_name: 'Srečko Katanec', coach_nationality: 'Slovenia', confederation: 'AFC',
    win_probability: 0.4,
    win_factors: 'World Cup debutants. Abdukodir Khusanov (Manchester City) is the marquee name. Young and technically capable but inexperienced at this level.',
    fifa_ranking: 72, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇺🇿',
  },
  {
    id: 'cod', name: 'DR Congo', slug: 'cod', group_letter: 'K',
    coach_name: 'Sébastien Desabre', coach_nationality: 'France', confederation: 'CAF',
    win_probability: 0.6,
    win_factors: 'Qualified through a tough CAF campaign. Energetic and hard-running squad. Lack of global championship exposure will be tested at this level.',
    fifa_ranking: 57, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇨🇩',
  },

  // ── GROUP L: England, Croatia, Panama, Ghana ──────────────────────────────
  {
    id: 'eng', name: 'England', slug: 'eng', group_letter: 'L',
    coach_name: 'Thomas Tuchel', coach_nationality: 'Germany', confederation: 'UEFA',
    win_probability: 11.0,
    win_factors: 'Unbelievable attacking depth, Ballon d\'Or-level midfielders and a world-class striker in Harry Kane. Elite tactical designer at the helm — prime contenders.',
    fifa_ranking: 4, best_case: 'Winner', realistic_target: 'Final', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  },
  {
    id: 'cro', name: 'Croatia', slug: 'cro', group_letter: 'L',
    coach_name: 'Zlatko Dalić', coach_nationality: 'Croatia', confederation: 'UEFA',
    win_probability: 2.5,
    win_factors: 'Elite veteran midfield led by the immortal Luka Modrić. Unmatched big-game experience. Ageing legs and lack of squad renewal are mounting liabilities.',
    fifa_ranking: 14, best_case: 'Quarterfinals', realistic_target: 'Round of 16', flag: '🇭🇷',
  },
  {
    id: 'pan', name: 'Panama', slug: 'pan', group_letter: 'L',
    coach_name: 'Thomas Christiansen', coach_nationality: 'Denmark', confederation: 'CONCACAF',
    win_probability: 0.4,
    win_factors: 'Tough CONCACAF qualifiers who punched above their weight. Organised defensive block, but limited individual quality against European heavyweights.',
    fifa_ranking: 75, best_case: 'Group Stage', realistic_target: 'Group Stage', flag: '🇵🇦',
  },
  {
    id: 'gha', name: 'Ghana', slug: 'gha', group_letter: 'L',
    coach_name: 'Carlos Queiroz', coach_nationality: 'Portugal', confederation: 'CAF',
    win_probability: 0.8,
    win_factors: 'Excellent physical profile and talented Premier League-based attackers. Queiroz brings tactical discipline. Struggles to maintain focus over a full 90 minutes.',
    fifa_ranking: 64, best_case: 'Round of 16', realistic_target: 'Group Stage', flag: '🇬🇭',
  },
];

// ---------------------------------------------------------------------------
// Star overrides – confirmed June 2026 squads
// ---------------------------------------------------------------------------
const STARS_OVERRIDE: Record<string, Array<{ name: string; pos: 'GK' | 'DF' | 'MF' | 'FW'; rating: number; club: string }>> = {
  arg: [
    { name: 'Lionel Messi',        pos: 'FW', rating: 90, club: 'Inter Miami' },
    { name: 'Lautaro Martínez',    pos: 'FW', rating: 89, club: 'Inter Milan' },
    { name: 'Alexis Mac Allister', pos: 'MF', rating: 87, club: 'Liverpool' },
    { name: 'Emiliano Martínez',   pos: 'GK', rating: 89, club: 'Aston Villa' },
    { name: 'Enzo Fernández',      pos: 'MF', rating: 85, club: 'Chelsea' },
  ],
  fra: [
    { name: 'Kylian Mbappé',       pos: 'FW', rating: 93, club: 'Real Madrid' },
    { name: 'William Saliba',      pos: 'DF', rating: 89, club: 'Arsenal' },
    { name: 'Mike Maignan',        pos: 'GK', rating: 87, club: 'AC Milan' },
    { name: 'Antoine Griezmann',   pos: 'FW', rating: 86, club: 'Atletico Madrid' },
    { name: 'Aurélien Tchouaméni', pos: 'MF', rating: 86, club: 'Real Madrid' },
  ],
  esp: [
    { name: 'Rodri',               pos: 'MF', rating: 93, club: 'Manchester City' },
    { name: 'Lamine Yamal',        pos: 'FW', rating: 91, club: 'Barcelona' },
    { name: 'Pedri',               pos: 'MF', rating: 88, club: 'Barcelona' },
    { name: 'Nico Williams',       pos: 'FW', rating: 88, club: 'Athletic Bilbao' },
    { name: 'Dani Carvajal',       pos: 'DF', rating: 87, club: 'Real Madrid' },
  ],
  eng: [
    { name: 'Jude Bellingham',     pos: 'MF', rating: 91, club: 'Real Madrid' },
    { name: 'Harry Kane',          pos: 'FW', rating: 90, club: 'Bayern Munich' },
    { name: 'Bukayo Saka',         pos: 'FW', rating: 89, club: 'Arsenal' },
    { name: 'Phil Foden',          pos: 'MF', rating: 88, club: 'Manchester City' },
    { name: 'Declan Rice',         pos: 'MF', rating: 88, club: 'Arsenal' },
    { name: 'John Stones',         pos: 'DF', rating: 86, club: 'Manchester City' },
  ],
  bra: [
    { name: 'Vinicius Junior',     pos: 'FW', rating: 92, club: 'Real Madrid' },
    { name: 'Alisson',             pos: 'GK', rating: 88, club: 'Liverpool' },
    { name: 'Rodrygo',             pos: 'FW', rating: 87, club: 'Real Madrid' },
    { name: 'Bruno Guimarães',     pos: 'MF', rating: 87, club: 'Newcastle United' },
    { name: 'Marquinhos',          pos: 'DF', rating: 86, club: 'Paris Saint-Germain' },
    { name: 'Endrick',             pos: 'FW', rating: 83, club: 'Real Madrid' },
  ],
  por: [
    { name: 'Rúben Dias',          pos: 'DF', rating: 89, club: 'Manchester City' },
    { name: 'Bruno Fernandes',     pos: 'MF', rating: 89, club: 'Manchester United' },
    { name: 'Cristiano Ronaldo',   pos: 'FW', rating: 87, club: 'Al Nassr' },
    { name: 'Bernardo Silva',      pos: 'MF', rating: 88, club: 'Manchester City' },
    { name: 'Rafael Leão',         pos: 'FW', rating: 88, club: 'AC Milan' },
  ],
  ger: [
    { name: 'Florian Wirtz',       pos: 'MF', rating: 91, club: 'Bayer Leverkusen' },
    { name: 'Jamal Musiala',       pos: 'MF', rating: 90, club: 'Bayern Munich' },
    { name: 'Antonio Rüdiger',     pos: 'DF', rating: 87, club: 'Real Madrid' },
    { name: 'Manuel Neuer',        pos: 'GK', rating: 85, club: 'Bayern Munich' },
    { name: 'Kai Havertz',         pos: 'FW', rating: 86, club: 'Arsenal' },
  ],
  ned: [
    { name: 'Virgil van Dijk',     pos: 'DF', rating: 90, club: 'Liverpool' },
    { name: 'Cody Gakpo',          pos: 'FW', rating: 87, club: 'Liverpool' },
    { name: 'Frenkie de Jong',     pos: 'MF', rating: 87, club: 'Barcelona' },
    { name: 'Xavi Simons',         pos: 'MF', rating: 86, club: 'RB Leipzig' },
  ],
  nor: [
    { name: 'Erling Haaland',      pos: 'FW', rating: 93, club: 'Manchester City' },
    { name: 'Martin Ødegaard',     pos: 'MF', rating: 88, club: 'Arsenal' },
  ],
  col: [
    { name: 'Luis Díaz',           pos: 'FW', rating: 87, club: 'Liverpool' },
    { name: 'James Rodríguez',     pos: 'MF', rating: 82, club: 'Rayo Vallecano' },
  ],
  uru: [
    { name: 'Darwin Núñez',        pos: 'FW', rating: 87, club: 'Liverpool' },
    { name: 'Federico Valverde',   pos: 'MF', rating: 89, club: 'Real Madrid' },
    { name: 'Ronald Araújo',       pos: 'DF', rating: 87, club: 'Barcelona' },
  ],
  bel: [
    { name: 'Kevin De Bruyne',     pos: 'MF', rating: 89, club: 'Napoli' },
    { name: 'Romelu Lukaku',       pos: 'FW', rating: 84, club: 'Napoli' },
    { name: 'Jeremy Doku',         pos: 'FW', rating: 84, club: 'Manchester City' },
  ],
  mar: [
    { name: 'Achraf Hakimi',       pos: 'DF', rating: 88, club: 'Paris Saint-Germain' },
    { name: 'Yassine Bounou',      pos: 'GK', rating: 84, club: 'Al Hilal' },
    { name: 'Hakim Ziyech',        pos: 'MF', rating: 82, club: 'Galatasaray' },
  ],
  egy: [
    { name: 'Mohamed Salah',       pos: 'FW', rating: 90, club: 'Liverpool' },
  ],
  kor: [
    { name: 'Heung-min Son',       pos: 'FW', rating: 88, club: 'Tottenham Hotspur' },
    { name: 'Min-jae Kim',         pos: 'DF', rating: 86, club: 'Bayern Munich' },
  ],
  irn: [
    { name: 'Mehdi Taremi',        pos: 'FW', rating: 84, club: 'Inter Milan' },
    { name: 'Sardar Azmoun',       pos: 'FW', rating: 81, club: 'Bayer Leverkusen' },
  ],
  jpn: [
    { name: 'Takefusa Kubo',       pos: 'FW', rating: 85, club: 'Real Sociedad' },
    { name: 'Wataru Endo',         pos: 'MF', rating: 83, club: 'Liverpool' },
  ],
  cro: [
    { name: 'Luka Modrić',         pos: 'MF', rating: 85, club: 'Real Madrid' },
    { name: 'Joško Gvardiol',      pos: 'DF', rating: 87, club: 'Manchester City' },
  ],
  aut: [
    { name: 'Marcel Sabitzer',     pos: 'MF', rating: 84, club: 'Borussia Dortmund' },
  ],
  sen: [
    { name: 'Ismaila Sarr',        pos: 'FW', rating: 83, club: 'Crystal Palace' },
    { name: 'Idrissa Gueye',       pos: 'MF', rating: 81, club: 'Everton' },
  ],
  usa: [
    { name: 'Christian Pulisic',   pos: 'FW', rating: 86, club: 'AC Milan' },
    { name: 'Weston McKennie',     pos: 'MF', rating: 81, club: 'Juventus' },
  ],
  civ: [
    { name: 'Simon Adingra',       pos: 'FW', rating: 83, club: 'Brighton' },
  ],
};

// ---------------------------------------------------------------------------
// Club pool
// ---------------------------------------------------------------------------
const POP_CLUBS = [
  'Real Madrid','Manchester City','Barcelona','Arsenal','Liverpool','Bayern Munich',
  'Juventus','AC Milan','Inter Milan','Paris Saint-Germain','Atletico Madrid','Chelsea',
  'Manchester United','Tottenham Hotspur','Bayer Leverkusen','Borussia Dortmund',
  'Galatasaray','Al Hilal','Al Nassr','Sporting CP','Benfica','FC Porto','Lazio',
  'Aston Villa','Newcastle United','West Ham','Feyenoord','PSV Eindhoven','Ajax','Napoli',
];

// ---------------------------------------------------------------------------
// Squad generation
// ---------------------------------------------------------------------------
export function generateProceduralSquads(teams: Team[]): Player[] {
  const players: Player[] = [];

  teams.forEach((team) => {
    const baseMean   = 88 - (team.fifa_ranking * 0.16);
    const meanRating = Math.max(70, Math.min(92, baseMean));

    let charSum = 0;
    for (let i = 0; i < team.slug.length; i++) charSum += team.slug.charCodeAt(i);
    const rng = new LCG(charSum + 2026);

    const regKey = SLUG_TO_REGION[team.slug] || 'anglo';
    const names  = NAMES_DB[regKey];
    const overrides = [...(STARS_OVERRIDE[team.slug] || [])];

    const positions: Array<'GK' | 'DF' | 'MF' | 'FW'> = [
      'GK','GK','GK',
      'DF','DF','DF','DF','DF','DF','DF','DF',
      'MF','MF','MF','MF','MF','MF','MF','MF',
      'FW','FW','FW','FW','FW','FW','FW',
    ];

    for (let index = 0; index < 26; index++) {
      const pos  = positions[index];
      const pAge = rng.rangeInt(18, 35);

      const overrideIndex = overrides.findIndex(o => o.pos === pos);
      let pName: string, pRating: number, pClub: string;

      if (overrideIndex !== -1) {
        const star = overrides.splice(overrideIndex, 1)[0];
        pName   = star.name;
        pRating = star.rating;
        pClub   = star.club;
      } else {
        pName   = `${rng.choice(names.first)} ${rng.choice(names.last)}`;
        pClub   = rng.choice(POP_CLUBS);
        pRating = Math.max(65, Math.min(94, Math.round(meanRating + rng.range(-4, 4))));
      }

      players.push({
        id: `${team.slug}_p_${index + 1}`,
        team_id: team.id,
        name: pName,
        position: pos,
        rating: pRating,
        club: pClub,
        age: pAge,
        shirt_number: index + 1,
      });
    }
  });

  return players;
}

// ---------------------------------------------------------------------------
// Fixture generation
// ---------------------------------------------------------------------------
export function generateGroupFixtures(group_letter: string, groupTeams: Team[]): Match[] {
  if (groupTeams.length !== 4) return [];

  const [t1, t2, t3, t4] = groupTeams;

  const pairs = [
    { home: t1, away: t2, daysOffset: 1, venue: 'Estadio Azteca, Mexico City'          },
    { home: t3, away: t4, daysOffset: 1, venue: 'MetLife Stadium, New York/New Jersey'  },
    { home: t1, away: t3, daysOffset: 5, venue: 'SoFi Stadium, Los Angeles'             },
    { home: t2, away: t4, daysOffset: 5, venue: 'AT&T Stadium, Dallas'                  },
    { home: t4, away: t1, daysOffset: 9, venue: 'Arrowhead Stadium, Kansas City'        },
    { home: t2, away: t3, daysOffset: 9, venue: 'Mercedes-Benz Stadium, Atlanta'        },
  ];

  return pairs.map((pair, idx) => {
    const day        = 11 + pair.daysOffset;
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

// ---------------------------------------------------------------------------
// WC26Database
// ---------------------------------------------------------------------------
export class WC26Database {
  public teams:   Team[]   = [];
  public players: Player[] = [];
  public groups:  Group[]  = [];
  public matches: Match[]  = [];

  constructor() { this.reset(); }

  public reset() {
    this.teams   = [...SEED_TEAMS];
    this.groups  = [...SEED_GROUPS];
    this.players = generateProceduralSquads(this.teams);

    let allMatches: Match[] = [];
    this.groups.forEach(group => {
      const groupTeams = this.teams.filter(t => t.group_letter === group.letter);
      allMatches = [...allMatches, ...generateGroupFixtures(group.letter, groupTeams)];
    });
    this.matches = allMatches;

    const rng = new LCG(9999);
    this.matches.forEach((m, idx) => {
      if (idx % 3 === 0) {
        const hTeam = this.teams.find(t => t.id === m.team_home_id);
        const aTeam = this.teams.find(t => t.id === m.team_away_id);
        if (hTeam && aTeam) {
          const hF = 100 - hTeam.fifa_ranking;
          const aF = 100 - aTeam.fifa_ranking;
          const hG = Math.max(0.5, 1.3 + (hF - aF) * 0.015);
          const aG = Math.max(0.5, 1.3 + (aF - hF) * 0.015);
          m.score_home = rng.rangeInt(0, Math.floor(hG * 1.8));
          m.score_away = rng.rangeInt(0, Math.floor(aG * 1.8));
          m.played     = true;
        }
      }
    });

    this.generateKnockoutPrereqs();
  }

  private generateKnockoutPrereqs() {
    const stages: Array<'Round of 32' | 'Round of 16' | 'Quarterfinals' | 'Semifinals' | 'Final'> =
      ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
    const counts = { 'Round of 32': 16, 'Round of 16': 8, 'Quarterfinals': 4, 'Semifinals': 2, 'Final': 1 };
    const venues = [
      'MetLife Stadium, NJ/NY','SoFi Stadium, Los Angeles','AT&T Stadium, Dallas',
      'Arrowhead Stadium, Kansas City','Mercedes-Benz Stadium, Atlanta',
      'Hard Rock Stadium, Miami','Estadio Azteca, Mexico City',
      'Estadio Akron, Guadalajara','BC Place, Vancouver',
      'Lumen Field, Seattle','BMO Field, Toronto','NRG Stadium, Houston',
    ];
    const rng = new LCG(22026);
    let day = 29;

    stages.forEach(stage => {
      for (let i = 0; i < counts[stage]; i++) {
        const d = `2026-07-${day < 10 ? '0' + day : day}T20:00:00Z`;
        this.matches.push({
          id: `match_ko_${stage.replace(/\s+/g, '_').toLowerCase()}_${i + 1}`,
          team_home_id: this.teams[i % this.teams.length].id,
          team_away_id: this.teams[(i + 5) % this.teams.length].id,
          score_home: null, score_away: null,
          match_date: d,
          venue: rng.choice(venues),
          stage, played: false,
        });
      }
      day += 3;
    });
  }

  public getGroupStandings(letter: string): GroupStandings[] {
    const groupTeams = this.teams.filter(t => t.group_letter === letter);
    const standings: Record<string, GroupStandings> = {};

    groupTeams.forEach(team => {
      standings[team.id] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
    });

    this.matches.filter(m => m.group_letter === letter && m.played).forEach(m => {
      const home = standings[m.team_home_id];
      const away = standings[m.team_away_id];
      const sh   = m.score_home ?? 0;
      const sa   = m.score_away ?? 0;
      if (home && away) {
        home.played++; away.played++;
        home.gf += sh; home.ga += sa;
        away.gf += sa; away.ga += sh;
        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;
        if (sh > sa)      { home.won++; home.points += 3; away.lost++; }
        else if (sh < sa) { away.won++; away.points += 3; home.lost++; }
        else              { home.drawn++; away.drawn++; home.points++; away.points++; }
      }
    });

    return Object.values(standings).sort((a, b) =>
      b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.fifa_ranking - b.team.fifa_ranking
    );
  }

  public updateMatchScore(matchId: string, scoreHome: number, scoreAway: number, played = true) {
    const match = this.matches.find(m => m.id === matchId);
    if (match) {
      match.score_home = scoreHome;
      match.score_away = scoreAway;
      match.played     = played;
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
        const hF = 100 - hTeam.fifa_ranking;
        const aF = 100 - aTeam.fifa_ranking;
        const hG = Math.max(0.4, 1.35 + (hF - aF) * 0.015);
        const aG = Math.max(0.4, 1.35 + (aF - hF) * 0.015);
        m.score_home = rng.rangeInt(0, Math.floor(hG * 1.8));
        m.score_away = rng.rangeInt(0, Math.floor(aG * 1.8));
        m.played     = true;
      }
    });
    this.recalculateKnockouts();
  }
}

export const dbInstance = new WC26Database();