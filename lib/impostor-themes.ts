export type ImpostorThemeDefinition = {
  id: string;
  title: string;
  description: string;
  seededPicks: [{ rank: 1; playerName: string }, { rank: 2; playerName: string }];
  pool: string[];
};

export const IMPOSTOR_THEMES: ImpostorThemeDefinition[] = [
  {
    id: "atacantes-brasileiros",
    title: "Maiores atacantes brasileiros",
    description: "Craques que balançaram as redes com a amarelinha ou no Brasil.",
    seededPicks: [
      { rank: 1, playerName: "Pelé" },
      { rank: 2, playerName: "Ronaldo Nazário" },
    ],
    pool: [
      "Neymar",
      "Romário",
      "Ronaldinho Gaúcho",
      "Rivaldo",
      "Gabigol",
      "Adriano Imperador",
      "Vinícius Júnior",
      "Garrincha",
      "Zico",
      "Endrick",
      "Fred",
      "Calleri",
      "Hulk",
    ],
  },
  {
    id: "lendas-champions",
    title: "Lendas da Champions League",
    description: "Ícones que marcaram a maior competição de clubes do mundo.",
    seededPicks: [
      { rank: 1, playerName: "Lionel Messi" },
      { rank: 2, playerName: "Cristiano Ronaldo" },
    ],
    pool: [
      "Zinedine Zidane",
      "Raúl González",
      "Paolo Maldini",
      "Andrés Iniesta",
      "Xavi Hernández",
      "Luka Modrić",
      "Thierry Henry",
      "Andriy Shevchenko",
      "David Beckham",
      "Kaká",
      "Manuel Neuer",
      "Gianluigi Buffon",
      "Johan Cruyff",
    ],
  },
  {
    id: "craques-argentinos",
    title: "Craques argentinos históricos",
    description: "Da albiceleste às ligas do mundo — genialidade portenha e pampas.",
    seededPicks: [
      { rank: 1, playerName: "Diego Maradona" },
      { rank: 2, playerName: "Lionel Messi" },
    ],
    pool: [
      "Gabriel Batistuta",
      "Mario Kempes",
      "Javier Mascherano",
      "Sergio Agüero",
      "Ángel Di María",
      "Juan Román Riquelme",
      "Tevez",
      "Lautaro Martínez",
      "Hernán Crespo",
      "Juan Sebastián Verón",
      "Tevez",
      "Gonzalo Higuaín",
      "Ángel Di María",
      "Javier Mascherano",
      "Gabriel Batistuta",
    ],
  },
  {
    id: "idolos-brasileirao",
    title: "Ídolos do Brasileirão",
    description: "Lendas que fizeram história nos gramados do futebol nacional.",
    seededPicks: [
      { rank: 1, playerName: "Zico" },
      { rank: 2, playerName: "Romário" },
    ],
    pool: [
      "Gabigol",
      "Hulk",
      "Fred",
      "Calleri",
      "Arrascaeta",
      "Cafu",
      "Rivaldo",
      "Ronaldinho Gaúcho",
      "Adriano Imperador",
      "Endrick",
      "Sócrates",
      "Rivelino",
      "Taffarel",
    ],
  },
  {
    id: "meias-europeus",
    title: "Melhores meias europeus",
    description: "Maestros que ditavam o ritmo nos campos do Velho Continente.",
    seededPicks: [
      { rank: 1, playerName: "Zinedine Zidane" },
      { rank: 2, playerName: "Luka Modrić" },
    ],
    pool: [
      "Andrés Iniesta",
      "Xavi Hernández",
      "Kaká",
      "David Beckham",
      "Johan Cruyff",
      "Javi Martínez",
      "Kevin De Bruyne",
      "Toni Kroos",
      "Mesut Özil",
      "Frank Lampard",
      "Steven Gerrard",
      "Paul Pogba",
    ],
  },
  {
    id: "goleiros-historicos",
    title: "Goleiros históricos",
    description: "Muralhas lendárias que salvaram seus times por décadas.",
    seededPicks: [
      { rank: 1, playerName: "Gianluigi Buffon" },
      { rank: 2, playerName: "Manuel Neuer" },
    ],
    pool: [
      "Oliver Kahn",
      "Dida",
      "Taffarel",
      "Petr Čech",
      "Iker Casillas",
      "Ederson",
      "Alisson Becker",
      "Julio César",
      "Lev Yashin",
      "Kasper Schmeichel",
      "Oliver Kahn",
      "Gianluigi Buffon",
      "Manuel Neuer",
    ],
  },
  {
    id: "fenomenos-copa",
    title: "Fenômenos da Copa do Mundo",
    description: "Estrelas que brilharam (ou apagaram) no maior palco do futebol.",
    seededPicks: [
      { rank: 1, playerName: "Pelé" },
      { rank: 2, playerName: "Diego Maradona" },
    ],
    pool: [
      "Lionel Messi",
      "Ronaldo Nazário",
      "Zinedine Zidane",
      "Mario Kempes",
      "Garrincha",
      "Rivelino",
      "Sócrates",
      "Thierry Henry",
      "Andriy Shevchenko",
      "Luka Modrić",
      "Kylian Mbappé",
      "Lautaro Martínez",
      "Cafu",
    ],
  },
  {
    id: "lendas-futebol-ingles",
    title: "Lendas do futebol inglês",
    description: "Ícones da Premier League e da história da Inglaterra.",
    seededPicks: [
      { rank: 1, playerName: "David Beckham" },
      { rank: 2, playerName: "Thierry Henry" },
    ],
    pool: [
      "Steven Gerrard",
      "Frank Lampard",
      "Wayne Rooney",
      "Alan Shearer",
      "Eric Cantona",
      "Paul Scholes",
      "Ryan Giggs",
      "Kevin De Bruyne",
      "Mohamed Salah",
      "Harry Kane",
      "Bobby Charlton",
      "Gary Lineker",
      "John Terry",
    ],
  },
];

export function getImpostorTheme(id: string): ImpostorThemeDefinition | undefined {
  return IMPOSTOR_THEMES.find((theme) => theme.id === id);
}

export function listImpostorThemes() {
  return IMPOSTOR_THEMES.map(({ id, title, description }) => ({
    id,
    title,
    description,
  }));
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildRoundCardOptions(
  pool: string[],
  seededNames: string[],
  roundIndex: number
): string[] {
  const available = shuffleArray(
    pool.filter((name) => !seededNames.includes(name))
  );
  const start = roundIndex * 3;
  return available.slice(start, start + 3);
}
