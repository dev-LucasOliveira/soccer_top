import { readFileSync } from "fs";
import { join } from "path";
import { GUESS_TOP_CHALLENGES } from "../../lib/guess-top-challenges";
import type { SeedPlayer } from "../../lib/types";
import { playerKey } from "./player-utils";

const LEGENDS_PATH = join(__dirname, "legends.json");
const PLAYERS_PATH = join(__dirname, "players.json");
const CACHE_PATH = join(__dirname, "player-enrichment-cache.json");

export const KNOWN_GOALKEEPERS = new Set([
  "Rogério Ceni",
  "Gianluigi Buffon",
  "Manuel Neuer",
  "Iker Casillas",
  "Oliver Kahn",
  "Dino Zoff",
  "Peter Schmeichel",
  "David de Gea",
  "Ederson",
  "Alisson Becker",
  "Taffarel",
  "Dida",
  "Júlio César",
  "Julio César",
  "Fabien Barthez",
  "Hugo Lloris",
  "Petr Čech",
  "Andoni Zubizarreta",
  "Kasper Schmeichel",
  "Lev Yashin",
  "Walter Zenga",
  "Bernard Lama",
  "David Seaman",
  "Edwin van der Sar",
  "Pepe Reina",
  "Shay Given",
  "Marcos",
  "Cássio",
  "Weverton",
]);

export type PlayerThemeRef = {
  challengeId: string;
  title: string;
  searchFilters?: {
    teams?: string[];
    nationalities?: string[];
    positions?: string[];
  };
};

export function getGameCriticalNames(): string[] {
  const names = new Set<string>();

  for (const challenge of GUESS_TOP_CHALLENGES) {
    for (const name of challenge.pool) {
      names.add(name);
    }
  }

  const legends = JSON.parse(readFileSync(LEGENDS_PATH, "utf-8")) as SeedPlayer[];
  for (const legend of legends) {
    names.add(legend.name);
  }

  return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function getThemesByPlayer(): Map<string, PlayerThemeRef[]> {
  const map = new Map<string, PlayerThemeRef[]>();

  for (const challenge of GUESS_TOP_CHALLENGES) {
    for (const name of challenge.pool) {
      const list = map.get(name) ?? [];
      list.push({
        challengeId: challenge.id,
        title: challenge.title,
        searchFilters: challenge.searchFilters,
      });
      map.set(name, list);
    }
  }

  return map;
}

export function loadPlayersByName(): Map<string, SeedPlayer> {
  const players = JSON.parse(readFileSync(PLAYERS_PATH, "utf-8")) as SeedPlayer[];
  return new Map(players.map((p) => [p.name, p]));
}

export function loadEnrichmentSource(): Map<string, "wikipedia" | "fallback" | "legend"> {
  const legends = JSON.parse(readFileSync(LEGENDS_PATH, "utf-8")) as SeedPlayer[];
  const legendKeys = new Set(legends.map((p) => playerKey(p.name)));
  const cache = JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as Record<
    string,
    { source?: string }
  >;

  const sources = new Map<string, "wikipedia" | "fallback" | "legend">();

  for (const legend of legends) {
    sources.set(legend.name, "legend");
  }

  for (const [key, entry] of Object.entries(cache)) {
    const name = key; // cache keys are normalized - need spreadsheet for names
    void name;
    void key;
    void entry;
  }

  return sources;
}

export function playerHasTeam(player: SeedPlayer, filterTeam: string): boolean {
  const normalized = filterTeam.toLowerCase();
  return player.teams.some((team) => {
    const name = team.name.toLowerCase();
    return name === normalized || name.includes(normalized);
  });
}

export function getRequiredTeamsForPlayer(
  name: string,
  themes: PlayerThemeRef[]
): string[] {
  const teams = new Set<string>();
  for (const theme of themes) {
    for (const team of theme.searchFilters?.teams ?? []) {
      teams.add(team);
    }
  }
  return [...teams];
}
