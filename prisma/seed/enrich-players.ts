import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Position, SeedPlayer, TeamEntry } from "../../lib/types";
import { importSpreadsheet, type SpreadsheetPlayer } from "./import-spreadsheet";
import {
  inferPositionFromName,
  pickFallbackClub,
  positionFromText,
} from "./enrichment-helpers";
import { playerKey } from "./player-utils";

export type EnrichmentEntry = {
  primaryPosition: Position;
  teams: TeamEntry[];
  careerStart: number;
  careerEnd: number;
  source: "wikipedia" | "fallback";
};

const CACHE_PATH = join(__dirname, "player-enrichment-cache.json");
const DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadCache(): Record<string, EnrichmentEntry> {
  if (!existsSync(CACHE_PATH)) return {};
  return JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as Record<
    string,
    EnrichmentEntry
  >;
}

function saveCache(cache: Record<string, EnrichmentEntry>) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

function hashPosition(name: string): Position {
  const weights: [Position, number][] = [
    ["Goleiro", 8],
    ["Defensor", 32],
    ["Meia", 35],
    ["Atacante", 25],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % 100;
  }
  let cumulative = 0;
  for (const [pos, weight] of weights) {
    cumulative += weight;
    if (hash < cumulative) return pos;
  }
  return "Meia";
}

async function fetchSummary(
  lang: string,
  title: string
): Promise<{ description: string; extract: string } | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { description?: string; extract?: string };
    return {
      description: data.description ?? "",
      extract: data.extract ?? "",
    };
  } catch {
    return null;
  }
}

async function searchTitle(lang: string, name: string): Promise<string | null> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", name);
  url.searchParams.set("limit", "3");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as [string, string[]];
    const titles = data[1] ?? [];
    const match = titles.find((t) =>
      t.toLowerCase().includes(name.split(" ")[0].toLowerCase())
    );
    return match ?? titles[0] ?? null;
  } catch {
    return null;
  }
}

function extractTeamsFromText(
  text: string,
  player: SpreadsheetPlayer
): TeamEntry[] {
  const club = pickFallbackClub(player.leagues, player.name);
  const clubMentions = [
    ...player.leagues.flatMap((league) => {
      const clubs: Record<string, string[]> = {
        Inglaterra: ["Manchester United", "Liverpool", "Arsenal", "Chelsea"],
        Espanha: ["Real Madrid", "Barcelona", "Atlético Madrid"],
        Itália: ["Juventus", "Milan", "Inter", "Roma", "Napoli"],
        Alemanha: ["Bayern", "Borussia Dortmund", "Leverkusen"],
        França: ["PSG", "Marseille", "Lyon", "Monaco"],
        Brasil: ["Flamengo", "Palmeiras", "Santos", "São Paulo", "Corinthians"],
      };
      return clubs[league] ?? [];
    }),
  ];

  const found = clubMentions.find((c) => text.toLowerCase().includes(c.toLowerCase()));
  return [
    {
      name: found ?? club,
      from: player.careerStart,
      to: player.careerEnd,
    },
  ];
}

async function enrichFromWikipedia(
  player: SpreadsheetPlayer
): Promise<EnrichmentEntry | null> {
  const variants = [player.name];
  const titlesToTry: string[] = [];

  for (const lang of ["pt", "en"]) {
    titlesToTry.push(player.name);
    const searched = await searchTitle(lang, player.name);
    if (searched) titlesToTry.push(searched);
    await sleep(50);
  }

  let description = "";
  let extract = "";

  for (const lang of ["pt", "en"]) {
    for (const title of [...new Set(titlesToTry)]) {
      const summary = await fetchSummary(lang, title);
      if (!summary) continue;
      description = summary.description;
      extract = summary.extract;
      const combined = `${description} ${extract}`;
      if (
        combined.toLowerCase().includes("futebol") ||
        combined.toLowerCase().includes("football") ||
        combined.toLowerCase().includes("soccer")
      ) {
        const position =
          positionFromText(extract) ??
          positionFromText(description) ??
          inferPositionFromName(player.name);

        if (position) {
          return {
            primaryPosition: position,
            teams: extractTeamsFromText(extract, player),
            careerStart: player.careerStart,
            careerEnd: player.careerEnd,
            source: "wikipedia",
          };
        }
      }
      await sleep(DELAY_MS);
    }
  }

  return null;
}

function buildFallback(player: SpreadsheetPlayer): EnrichmentEntry {
  return {
    primaryPosition:
      inferPositionFromName(player.name) ?? hashPosition(player.name),
    teams: [
      {
        name: pickFallbackClub(player.leagues, player.name),
        from: player.careerStart,
        to: player.careerEnd,
      },
    ],
    careerStart: player.careerStart,
    careerEnd: player.careerEnd,
    source: "fallback",
  };
}

export async function enrichPlayers(options?: {
  limit?: number;
  report?: boolean;
  force?: boolean;
}) {
  const spreadsheet = importSpreadsheet();
  const legends = JSON.parse(
    readFileSync(join(__dirname, "legends.json"), "utf-8")
  ) as SeedPlayer[];
  const legendKeys = new Set(legends.map((p) => playerKey(p.name)));

  const cache = options?.force ? {} : loadCache();
  const pending = spreadsheet.filter(
    (p) => !legendKeys.has(p.key) && (options?.force || !cache[p.key])
  );

  if (options?.report) {
    console.log(`Total spreadsheet: ${spreadsheet.length}`);
    console.log(`Legends (skipped): ${legendKeys.size}`);
    console.log(`Cached: ${Object.keys(cache).length}`);
    console.log(`Pending: ${pending.length}`);
    return;
  }

  const batch = pending.slice(0, options?.limit ?? pending.length);
  console.log(`Enriching ${batch.length} of ${pending.length} pending...`);

  for (const [index, player] of batch.entries()) {
    try {
      const enriched =
        (await enrichFromWikipedia(player)) ?? buildFallback(player);
      cache[player.key] = enriched;
      if ((index + 1) % 50 === 0) {
        saveCache(cache);
        console.log(`  saved progress: ${index + 1}/${batch.length}`);
      }
    } catch (error) {
      console.warn(`Failed ${player.name}:`, error);
      cache[player.key] = buildFallback(player);
    }
    await sleep(DELAY_MS);
  }

  saveCache(cache);
  console.log(`Cache updated: ${Object.keys(cache).length} entries`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const report = args.includes("--report");
  const force = args.includes("--force");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

  enrichPlayers({ report, limit, force }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
