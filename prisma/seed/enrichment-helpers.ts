import type { Position } from "../../lib/types";

export const LEAGUE_CLUBS: Record<string, string[]> = {
  Inglaterra: [
    "Manchester United",
    "Liverpool",
    "Arsenal",
    "Chelsea",
    "Manchester City",
    "Tottenham",
    "Newcastle",
    "West Ham",
    "Everton",
    "Leeds United",
  ],
  Espanha: [
    "Real Madrid",
    "Barcelona",
    "Atlético Madrid",
    "Sevilla",
    "Valencia",
    "Villarreal",
    "Real Sociedad",
    "Athletic Bilbao",
  ],
  Itália: [
    "Juventus",
    "AC Milan",
    "Inter Milan",
    "Napoli",
    "Roma",
    "Lazio",
    "Fiorentina",
    "Atalanta",
  ],
  Alemanha: [
    "Bayern Munich",
    "Borussia Dortmund",
    "RB Leipzig",
    "Bayer Leverkusen",
    "Eintracht Frankfurt",
    "Wolfsburg",
    "Borussia Mönchengladbach",
  ],
  França: [
    "PSG",
    "Marseille",
    "Lyon",
    "Monaco",
    "Lille",
    "Nice",
    "Rennes",
    "Lens",
  ],
  Brasil: [
    "Flamengo",
    "Palmeiras",
    "Corinthians",
    "São Paulo",
    "Santos",
    "Grêmio",
    "Internacional",
    "Atlético Mineiro",
    "Botafogo",
    "Fluminense",
  ],
};

const GOALKEEPER_QIDS = new Set(["Q201330", "Q662729"]);
const DEFENDER_QIDS = new Set([
  "Q336286",
  "Q268258",
  "Q2859788",
  "Q703705",
  "Q90173132",
  "Q28065833",
]);
const MIDFIELDER_QIDS = new Set([
  "Q193592",
  "Q28065835",
  "Q28065834",
  "Q193592",
]);
const FORWARD_QIDS = new Set([
  "Q28065836",
  "Q2730732",
  "Q18581305",
  "Q28065837",
]);

export function positionFromText(text: string): Position | null {
  const d = text.toLowerCase();
  if (
    d.includes("goalkeeper") ||
    d.includes("goleiro") ||
    d.includes("guardameta") ||
    d.includes("portero") ||
    d.includes("guarda-redes") ||
    d.includes("guarda redes")
  ) {
    return "Goleiro";
  }
  if (
    d.includes("defender") ||
    d.includes("defensor") ||
    d.includes("defesa") ||
    d.includes("zagueiro") ||
    d.includes("lateral") ||
    d.includes("centre-back") ||
    d.includes("center-back") ||
    d.includes("full-back") ||
    d.includes("defensa")
  ) {
    return "Defensor";
  }
  if (
    d.includes("forward") ||
    d.includes("striker") ||
    d.includes("atacante") ||
    d.includes("centre-forward") ||
    d.includes("center forward") ||
    d.includes("winger") ||
    d.includes("ponta") ||
    d.includes("delantero")
  ) {
    return "Atacante";
  }
  if (
    d.includes("midfield") ||
    d.includes("meio-campo") ||
    d.includes("meio campo") ||
    d.includes("meia") ||
    d.includes("volante") ||
    d.includes("mediocampista")
  ) {
    return "Meia";
  }
  return null;
}

export function mapWikidataPosition(qid: string | undefined, label: string): Position {
  if (qid && GOALKEEPER_QIDS.has(qid)) return "Goleiro";
  if (qid && DEFENDER_QIDS.has(qid)) return "Defensor";
  if (qid && FORWARD_QIDS.has(qid)) return "Atacante";
  if (qid && MIDFIELDER_QIDS.has(qid)) return "Meia";

  const fromLabel = positionFromText(label);
  if (fromLabel) return fromLabel;

  return "Meia";
}

export function pickFallbackClub(leagues: string[], name: string): string {
  const league = leagues[0] ?? "Inglaterra";
  const clubs = LEAGUE_CLUBS[league] ?? LEAGUE_CLUBS.Inglaterra;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % clubs.length;
  }
  return clubs[hash];
}

export function inferPositionFromName(name: string): Position | null {
  const knownGoalkeepers = [
    "buffon",
    "casillas",
    "neuer",
    "taffarel",
    "yashin",
    "cech",
    "schmeichel",
    "kahn",
    "zoff",
  ];
  const key = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (knownGoalkeepers.some((g) => key.includes(g))) return "Goleiro";
  return null;
}
