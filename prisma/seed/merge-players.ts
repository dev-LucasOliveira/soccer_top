import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { SeedPlayer } from "../../lib/types";
import { importSpreadsheet } from "./import-spreadsheet";
import type { EnrichmentEntry } from "./enrich-players";
import { playerKey } from "./player-utils";

const LEGENDS_PATH = join(__dirname, "legends.json");
const CACHE_PATH = join(__dirname, "player-enrichment-cache.json");
const OUTPUT_PATH = join(__dirname, "players.json");

function loadLegends(): SeedPlayer[] {
  return JSON.parse(readFileSync(LEGENDS_PATH, "utf-8")) as SeedPlayer[];
}

function loadCache(): Record<string, EnrichmentEntry> {
  if (!existsSync(CACHE_PATH)) return {};
  return JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as Record<
    string,
    EnrichmentEntry
  >;
}

function toSeedPlayer(
  name: string,
  nationality: string,
  enrichment: EnrichmentEntry,
  curatedLists: string[] = []
): SeedPlayer {
  return {
    name,
    primaryPosition: enrichment.primaryPosition,
    nationality,
    teams: enrichment.teams,
    careerStart: enrichment.careerStart,
    careerEnd: enrichment.careerEnd,
    curatedLists,
  };
}

export function mergePlayers(): SeedPlayer[] {
  const legends = loadLegends();
  const spreadsheet = importSpreadsheet();
  const cache = loadCache();
  const legendKeys = new Set(legends.map((p) => playerKey(p.name)));
  const merged = new Map<string, SeedPlayer>();

  for (const legend of legends) {
    merged.set(playerKey(legend.name), legend);
  }

  let missing = 0;
  for (const row of spreadsheet) {
    if (legendKeys.has(row.key)) continue;

    const enrichment = cache[row.key];
    if (!enrichment) {
      missing++;
      continue;
    }

    merged.set(
      row.key,
      toSeedPlayer(row.name, row.nationality, enrichment)
    );
  }

  if (missing > 0) {
    throw new Error(
      `${missing} spreadsheet players missing enrichment. Run: npm run db:enrich-players`
    );
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function summarizePlayers(players: SeedPlayer[]) {
  const byPosition: Record<string, number> = {};
  const byNationality: Record<string, number> = {};

  for (const player of players) {
    byPosition[player.primaryPosition] =
      (byPosition[player.primaryPosition] ?? 0) + 1;
    byNationality[player.nationality] =
      (byNationality[player.nationality] ?? 0) + 1;
  }

  return { total: players.length, byPosition, byNationality };
}

if (require.main === module) {
  const players = mergePlayers();
  const summary = summarizePlayers(players);
  writeFileSync(OUTPUT_PATH, JSON.stringify(players, null, 2) + "\n");
  console.log(`Merged ${summary.total} players -> ${OUTPUT_PATH}`);
  console.log("Por posição:", summary.byPosition);
  console.log("Por nacionalidade (top 10):", Object.entries(summary.byNationality).sort((a,b)=>b[1]-a[1]).slice(0,10));
}
