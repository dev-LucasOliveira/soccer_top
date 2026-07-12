import { randomInt } from "crypto";
import type { SessionFilters } from "@/lib/types";
import type { SlotHint } from "@/lib/guess-top-hints";

export const GUESS_TOP_MAX_ERRORS = 5;
export const GUESS_TOP_SLOTS = 5;
export const GUESS_TOP_DRAW_COUNT = 5;

export type GuessTopChallengeDefinition = {
  id: string;
  title: string;
  description: string;
  searchFilters?: SessionFilters;
  pool: string[];
};

export type PoolPlayerResolved = {
  playerId: string;
  playerName: string;
  nationality: string;
  position: string;
  hint: SlotHint;
};

export type GuessTopChallengeResolved = {
  id: string;
  title: string;
  description: string;
  searchFilters?: SessionFilters;
  pool: PoolPlayerResolved[];
};

export const GUESS_TOP_CHALLENGES: GuessTopChallengeDefinition[] = [
  {
    id: "atacantes-bra",
    title: "Maiores atacantes brasileiros",
    description:
      "5 atacantes secretos sorteados do pool — acerte quem jogou em cada clube.",
    searchFilters: {
      nationalities: ["BRA"],
      positions: ["Atacante"],
    },
    pool: [
      "Ronaldo Nazário",
      "Romário",
      "Rivaldo",
      "Neymar",
      "Garrincha",
      "Vinícius Júnior",
      "Jairzinho",
      "Bebeto",
      "Careca",
      "Deyverson",
      "Edmundo",
      "Alexandre Pato",
      "Evair",
      "Luís Fabiano",
      "Raphinha",
      "Rodrygo",
      "Roberto Dinamite",
      "Túlio Maravilha",
      "Gabigol",
      "Hulk",
    ],
  },
  {
    id: "lendas-champions",
    title: "Lendas da Champions League",
    description:
      "Ícones com títulos, atuações decisivas e legado na maior competição de clubes.",
    pool: [
      "Cristiano Ronaldo",
      "Lionel Messi",
      "Karim Benzema",
      "Raúl González",
      "Paolo Maldini",
      "Luka Modrić",
      "Andrés Iniesta",
      "Xavi Hernández",
      "Toni Kroos",
      "Robert Lewandowski",
      "Iker Casillas",
      "Manuel Neuer",
      "Gianluigi Buffon",
      "Thierry Henry",
      "Andriy Shevchenko",
      "David Beckham",
      "Kaká",
      "Zinedine Zidane",
      "Thomas Müller",
      "Mohamed Salah",
    ],
  },
  {
    id: "craques-argentinos",
    title: "Craques argentinos históricos",
    description:
      "Estrelas da albiceleste e do futebol argentino que brilharam em clubes e seleção.",
    searchFilters: {
      nationalities: ["ARG"],
    },
    pool: [
      "Diego Maradona",
      "Lionel Messi",
      "Gabriel Batistuta",
      "Juan Román Riquelme",
      "Sergio Agüero",
      "Ángel Di María",
      "Mario Kempes",
      "Javier Mascherano",
      "Carlos Tévez",
      "Gonzalo Higuaín",
      "Hernán Crespo",
      "Juan Sebastián Verón",
      "Lautaro Martínez",
      "Fernando Redondo",
      "Diego Simeone",
      "Javier Pastore",
      "Esteban Cambiasso",
      "Ezequiel Lavezzi",
      "Diego Milito",
      "Fernando Cavenaghi",
    ],
  },
  {
    id: "idolos-brasileirao",
    title: "Ídolos do Brasileirão",
    description:
      "Jogadores que se tornaram símbolos de clubes e da história do campeonato nacional.",
    searchFilters: {
      nationalities: ["BRA"],
    },
    pool: [
      "Zico",
      "Romário",
      "Gabigol",
      "Hulk",
      "Fred",
      "Cafu",
      "Rivaldo",
      "Ronaldinho",
      "Adriano Imperador",
      "Endrick",
      "Sócrates",
      "Rivelino",
      "Taffarel",
      "Falcão",
      "Éder Aleixo",
      "Leonardo",
      "Dida",
      "Renato Gaúcho",
      "Robinho",
      "Paulinho",
    ],
  },
  {
    id: "meias-brasileiros",
    title: "Meias brasileiros históricos",
    description:
      "Armadores e meias que ditaram o ritmo na seleção e nos grandes clubes do Brasil.",
    searchFilters: {
      nationalities: ["BRA"],
      positions: ["Meia"],
    },
    pool: [
      "Zico",
      "Sócrates",
      "Rivelino",
      "Ronaldinho",
      "Kaká",
      "Casemiro",
      "Diego Ribas",
      "Falcão",
      "Djalminha",
      "Gilberto Silva",
      "Oscar",
      "Paulinho",
      "Raí",
      "Renato Gaúcho",
      "Juninho Paulista",
      "Leonardo",
      "Clodoaldo",
      "Everton Ribeiro",
      "Elano",
      "Dirceu Lopes",
    ],
  },
  {
    id: "defensores-bra",
    title: "Defensores brasileiros históricos",
    description:
      "Zagueiros e laterais com títulos mundiais, liberta e trajetória na Europa.",
    searchFilters: {
      nationalities: ["BRA"],
      positions: ["Defensor"],
    },
    pool: [
      "Cafu",
      "Roberto Carlos",
      "Dani Alves",
      "Djalma Santos",
      "David Luiz",
      "Thiago Silva",
      "Lucio",
      "Nilton Santos",
      "Carlos Alberto Torres",
      "Bellini",
      "Aldair",
      "Filipe Luís",
      "Marcelo",
      "Miranda",
      "Maicon",
      "Branco",
      "Serginho",
      "Andrade",
      "Ademir da Guia",
      "Dante",
    ],
  },
  {
    id: "goleiros-bra",
    title: "Goleiros brasileiros históricos",
    description:
      "Muralhas que defenderam a seleção e clubes brasileiros em gerações diferentes.",
    searchFilters: {
      nationalities: ["BRA"],
      positions: ["Goleiro"],
    },
    pool: [
      "Taffarel",
      "Dida",
      "Marcos",
      "Cássio",
      "Alisson Becker",
      "Ederson",
      "Julio César",
      "Rogério Ceni",
      "Weverton",
      "Leão",
      "Victor",
      "Jefferson",
      "Gilmar",
      "Manga",
      "Castilho",
      "Índio",
      "Mineiro",
      "Zetti",
      "Aranha",
      "Gatti",
    ],
  },
  {
    id: "fenomenos-copa",
    title: "Fenômenos da Copa do Mundo",
    description:
      "Estrelas que definiram edições da Copa — gols, títulos e momentos inesquecíveis.",
    pool: [
      "Pelé",
      "Diego Maradona",
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
      "Paolo Maldini",
      "Franz Beckenbauer",
      "Bobby Charlton",
      "Geoff Hurst",
      "Johan Cruyff",
    ],
  },
  {
    id: "artilheiros-champions",
    title: "Artilheiros da Champions",
    description:
      "Goleadores históricos da Champions — artilharia, finais e noites mágicas.",
    pool: [
      "Cristiano Ronaldo",
      "Lionel Messi",
      "Karim Benzema",
      "Robert Lewandowski",
      "Raúl González",
      "Mohamed Salah",
      "Thomas Müller",
      "Andriy Shevchenko",
      "Ruud van Nistelrooy",
      "Marco van Basten",
      "Thierry Henry",
      "David Villa",
      "Sergio Agüero",
      "Neymar",
      "Ronaldo Nazário",
      "Filippo Inzaghi",
      "Samuel Eto'o",
      "Didier Drogba",
      "Kylian Mbappé",
      "Harry Kane",
    ],
  },
  {
    id: "lendas-espanholas",
    title: "Lendas espanholas",
    description:
      "Ícones da Roja e do futebol espanhol em seleção e clubes históricos.",
    searchFilters: {
      nationalities: ["ESP"],
    },
    pool: [
      "Andrés Iniesta",
      "Xavi Hernández",
      "David Villa",
      "Fernando Hierro",
      "Raúl González",
      "Iker Casillas",
      "Carles Puyol",
      "Sergio Ramos",
      "Cesc Fàbregas",
      "David Silva",
      "Fernando Torres",
      "Luis Enrique",
      "Emilio Butragueño",
      "Dani Olmo",
      "Luis Suárez Miramontes",
      "Amancio Amaro",
      "César Rodríguez",
      "Andoni Zubizarreta",
      "Dani Parejo",
      "Álvaro Morata",
    ],
  },
  {
    id: "lendas-francesas",
    title: "Lendas francesas",
    description:
      "Estrelas da seleção francesa e do futebol hexagonal em diferentes gerações.",
    searchFilters: {
      nationalities: ["FRA"],
    },
    pool: [
      "Zinedine Zidane",
      "Thierry Henry",
      "Michel Platini",
      "Karim Benzema",
      "Kylian Mbappé",
      "Patrick Vieira",
      "Lilian Thuram",
      "Bernard Lama",
      "Hugo Lloris",
      "Antoine Griezmann",
      "David Trezeguet",
      "Sylvain Wiltord",
      "Laurent Blanc",
      "Marcel Desailly",
      "Eric Cantona",
      "Alain Giresse",
      "Jean-Pierre Papin",
      "Bixente Lizarazu",
      "Claude Makélélé",
      "N'Golo Kanté",
    ],
  },
  {
    id: "lendas-italianas",
    title: "Lendas italianas",
    description:
      "Ícones da Azzurra e do calcio — defesa, meio-campo e ataque de elite.",
    searchFilters: {
      nationalities: ["ITA"],
    },
    pool: [
      "Paolo Maldini",
      "Franco Baresi",
      "Alessandro Nesta",
      "Andrea Pirlo",
      "Roberto Baggio",
      "Francesco Totti",
      "Alessandro Del Piero",
      "Gianluigi Buffon",
      "Fabio Cannavaro",
      "Gianni Rivera",
      "Dino Zoff",
      "Marco Materazzi",
      "Gennaro Gattuso",
      "Antonio Cassano",
      "Filippo Inzaghi",
      "Christian Vieri",
      "Giuseppe Meazza",
      "Sandro Mazzola",
      "Gianluca Vialli",
      "Claudio Gentile",
    ],
  },
  {
    id: "lendas-alemas",
    title: "Lendas alemãs",
    description:
      "Campeões mundiais e ícones do futebol alemão em clubes e seleção.",
    searchFilters: {
      nationalities: ["GER"],
    },
    pool: [
      "Franz Beckenbauer",
      "Gerd Müller",
      "Lothar Matthäus",
      "Manuel Neuer",
      "Bastian Schweinsteiger",
      "Thomas Müller",
      "Miroslav Klose",
      "Philipp Lahm",
      "Oliver Kahn",
      "Jürgen Klinsmann",
      "Karl-Heinz Rummenigge",
      "Andreas Brehme",
      "Bernd Schuster",
      "Michael Ballack",
      "Toni Kroos",
      "Marco Reus",
      "Joshua Kimmich",
      "Florian Wirtz",
      "Fritz Walter",
      "Sepp Maier",
    ],
  },
  {
    id: "lendas-portuguesas",
    title: "Lendas portuguesas",
    description:
      "Estrelas de Portugal que brilharam na Europa e em Copas do Mundo.",
    searchFilters: {
      nationalities: ["POR"],
    },
    pool: [
      "Cristiano Ronaldo",
      "Eusébio",
      "Luis Figo",
      "Rui Costa",
      "Deco",
      "Pepe",
      "João Moutinho",
      "Bernardo Silva",
      "Bruno Fernandes",
      "Pauleta",
      "Ricardo Carvalho",
      "João Félix",
      "Renato Sanches",
      "Rúben Dias",
      "Vitinha",
      "Paulo Futre",
      "Paulo Sousa",
      "José Fonte",
      "João Neves",
      "Nuno Mendes",
    ],
  },
  {
    id: "lendas-holandesas",
    title: "Lendas holandesas",
    description:
      "Geração de ouro e ícones do futebol total — seleção e clubes europeus.",
    searchFilters: {
      nationalities: ["NED"],
    },
    pool: [
      "Johan Cruyff",
      "Marco van Basten",
      "Ruud Gullit",
      "Frank Rijkaard",
      "Dennis Bergkamp",
      "Clarence Seedorf",
      "Edwin van der Sar",
      "Patrick Kluivert",
      "Ruud van Nistelrooy",
      "Arjen Robben",
      "Robin van Persie",
      "Ronald Koeman",
      "Jaap Stam",
      "Edgar Davids",
      "Marc Overmars",
      "Jimmy Floyd Hasselbaink",
      "Roy Makaay",
      "Ruud Krol",
      "Frenkie de Jong",
      "Memphis Depay",
    ],
  },
  {
    id: "lendas-inglaterra",
    title: "Lendas da Inglaterra",
    description:
      "Ícones da Three Lions e da Premier League ao longo das décadas.",
    searchFilters: {
      nationalities: ["ENG"],
    },
    pool: [
      "Bobby Charlton",
      "Bobby Moore",
      "Geoff Hurst",
      "David Beckham",
      "Frank Lampard",
      "Steven Gerrard",
      "Wayne Rooney",
      "Alan Shearer",
      "Harry Kane",
      "Gary Lineker",
      "Paul Scholes",
      "John Terry",
      "Ashley Cole",
      "David Seaman",
      "Glenn Hoddle",
      "Bryan Robson",
      "Dixie Dean",
      "Emlyn Hughes",
      "Chris Sutton",
      "Cole Palmer",
    ],
  },
  {
    id: "goleiros-historicos",
    title: "Goleiros históricos",
    description:
      "Muralhas lendárias que salvaram seus times por décadas em clubes e seleções.",
    searchFilters: {
      positions: ["Goleiro"],
    },
    pool: [
      "Gianluigi Buffon",
      "Manuel Neuer",
      "Iker Casillas",
      "Oliver Kahn",
      "Dida",
      "Taffarel",
      "Petr Čech",
      "Ederson",
      "Alisson Becker",
      "Julio César",
      "Lev Yashin",
      "Dino Zoff",
      "Peter Schmeichel",
      "Bernard Lama",
      "Hugo Lloris",
      "David de Gea",
      "Kasper Schmeichel",
      "Andoni Zubizarreta",
      "Rogério Ceni",
      "Walter Zenga",
    ],
  },
  {
    id: "meias-historicos",
    title: "Meias históricos",
    description:
      "Maestros que ditavam o ritmo nos maiores campeonatos e seleções do mundo.",
    searchFilters: {
      positions: ["Meia"],
    },
    pool: [
      "Zinedine Zidane",
      "Luka Modrić",
      "Andrés Iniesta",
      "Xavi Hernández",
      "Kaká",
      "David Beckham",
      "Johan Cruyff",
      "Kevin De Bruyne",
      "Toni Kroos",
      "Andrea Pirlo",
      "Frank Lampard",
      "Steven Gerrard",
      "Paul Pogba",
      "Mesut Özil",
      "Ronaldinho",
      "Zico",
      "Juan Román Riquelme",
      "Rui Costa",
      "Clarence Seedorf",
      "Deco",
    ],
  },
  {
    id: "defensores-historicos",
    title: "Defensores históricos",
    description:
      "Zagueiros e laterais com títulos mundiais, europeus e legado defensivo.",
    searchFilters: {
      positions: ["Defensor"],
    },
    pool: [
      "Paolo Maldini",
      "Franco Baresi",
      "Alessandro Nesta",
      "Carles Puyol",
      "Sergio Ramos",
      "Fabio Cannavaro",
      "Cafu",
      "Roberto Carlos",
      "Franz Beckenbauer",
      "Bobby Moore",
      "Lilian Thuram",
      "Marcel Desailly",
      "Jaap Stam",
      "Rio Ferdinand",
      "John Terry",
      "Ashley Cole",
      "Philipp Lahm",
      "Thiago Silva",
      "Virgil van Dijk",
      "Dani Alves",
    ],
  },
  {
    id: "atacantes-historicos",
    title: "Atacantes históricos",
    description:
      "Artilheiros e centroavantes que definiram eras em clubes e seleções.",
    searchFilters: {
      positions: ["Atacante"],
    },
    pool: [
      "Lionel Messi",
      "Cristiano Ronaldo",
      "Ronaldo Nazário",
      "Gabriel Batistuta",
      "Thierry Henry",
      "Karim Benzema",
      "Robert Lewandowski",
      "Marco van Basten",
      "Ruud van Nistelrooy",
      "Andriy Shevchenko",
      "Romário",
      "Neymar",
      "Kylian Mbappé",
      "Harry Kane",
      "Sergio Agüero",
      "Filippo Inzaghi",
      "Samuel Eto'o",
      "Didier Drogba",
      "Gonzalo Higuaín",
      "David Villa",
    ],
  },
  {
    id: "lendas-barcelona",
    title: "Lendas do Barcelona",
    description:
      "Ícones que vestiram o blaugrana e marcaram a história do Camp Nou.",
    searchFilters: {
      teams: ["Barcelona"],
    },
    pool: [
      "Lionel Messi",
      "Andrés Iniesta",
      "Xavi Hernández",
      "Carles Puyol",
      "Johan Cruyff",
      "Ronaldinho",
      "Samuel Eto'o",
      "David Villa",
      "Luis Suárez",
      "Neymar",
      "Dani Alves",
      "Sergio Busquets",
      "Gerard Piqué",
      "Cesc Fàbregas",
      "Rivaldo",
      "Romário",
      "Hristo Stoichkov",
      "Diego Maradona",
      "Deco",
      "Frenkie de Jong",
    ],
  },
  {
    id: "lendas-real-madrid",
    title: "Lendas do Real Madrid",
    description:
      "Estrelas que brilharam no Santiago Bernabéu e na história merengue.",
    searchFilters: {
      teams: ["Real Madrid"],
    },
    pool: [
      "Cristiano Ronaldo",
      "Raúl González",
      "Iker Casillas",
      "Sergio Ramos",
      "Karim Benzema",
      "Luka Modrić",
      "Toni Kroos",
      "Zinedine Zidane",
      "Roberto Carlos",
      "Fernando Redondo",
      "Claude Makélélé",
      "Casemiro",
      "Gareth Bale",
      "Marcelo",
      "Ferenc Puskás",
      "Alfredo Di Stéfano",
      "Ronaldo Nazário",
      "David Beckham",
      "Kaká",
      "Ruud van Nistelrooy",
    ],
  },
  {
    id: "lendas-milan",
    title: "Lendas do Milan",
    description:
      "Ícones rossoneri — Scudetti, Champions e a era dos grandes títulos.",
    searchFilters: {
      teams: ["AC Milan"],
    },
    pool: [
      "Paolo Maldini",
      "Franco Baresi",
      "Alessandro Nesta",
      "Andrea Pirlo",
      "Kaká",
      "Roberto Baggio",
      "Marco van Basten",
      "Ruud Gullit",
      "Frank Rijkaard",
      "Cafu",
      "Clarence Seedorf",
      "Filippo Inzaghi",
      "Andriy Shevchenko",
      "Gianni Rivera",
      "Gennaro Gattuso",
      "Hernán Crespo",
      "Rivaldo",
      "Ronaldinho",
      "Zlatan Ibrahimović",
      "Leonardo Bonucci",
    ],
  },
  {
    id: "lendas-manchester-united",
    title: "Lendas do Manchester United",
    description:
      "Ídolos do Old Trafford que definiram a história do clube inglês.",
    searchFilters: {
      teams: ["Manchester United"],
    },
    pool: [
      "George Best",
      "Bobby Charlton",
      "Eric Cantona",
      "David Beckham",
      "Ryan Giggs",
      "Paul Scholes",
      "Cristiano Ronaldo",
      "Wayne Rooney",
      "Ruud van Nistelrooy",
      "Dimitar Berbatov",
      "Roy Keane",
      "Peter Schmeichel",
      "Gary Neville",
      "Rio Ferdinand",
      "Nemanja Vidić",
      "Patrice Evra",
      "Edwin van der Sar",
      "Robin van Persie",
      "Carlos Tévez",
      "Ole Gunnar Solskjær",
    ],
  },
  {
    id: "lendas-bayern",
    title: "Lendas do Bayern",
    description:
      "Estrelas bávaras que construíram a hegemonia do clube na Alemanha e Europa.",
    searchFilters: {
      teams: ["Bayern"],
    },
    pool: [
      "Franz Beckenbauer",
      "Gerd Müller",
      "Oliver Kahn",
      "Manuel Neuer",
      "Philipp Lahm",
      "Bastian Schweinsteiger",
      "Thomas Müller",
      "Robert Lewandowski",
      "Arjen Robben",
      "Franck Ribéry",
      "Mario Gómez",
      "Karl-Heinz Rummenigge",
      "Lothar Matthäus",
      "Joshua Kimmich",
      "Kingsley Coman",
      "Leon Goretzka",
      "Harry Kane",
      "Alphonso Davies",
      "Claudio Pizarro",
      "Dante",
    ],
  },
];

export function getGuessTopChallengeById(
  id: string
): GuessTopChallengeDefinition | undefined {
  return GUESS_TOP_CHALLENGES.find((challenge) => challenge.id === id);
}

export function getGuessTopSearchFilters(
  challengeId: string
): SessionFilters | undefined {
  return getGuessTopChallengeById(challengeId)?.searchFilters;
}

export function shuffleChallengeIds(ids: string[]): string[] {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawRoundPlayers(
  poolPlayerIds: string[],
  count = GUESS_TOP_DRAW_COUNT
): string[] {
  if (poolPlayerIds.length < count) {
    throw new Error(
      `Pool precisa ter pelo menos ${count} jogadores (tem ${poolPlayerIds.length})`
    );
  }

  const copy = [...poolPlayerIds];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
