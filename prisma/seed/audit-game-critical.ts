import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { readFileSync } from "fs";
import { importSpreadsheet } from "./import-spreadsheet";
import type { EnrichmentEntry } from "./enrich-players";
import {
  getGameCriticalNames,
  getRequiredTeamsForPlayer,
  getThemesByPlayer,
  KNOWN_GOALKEEPERS,
  loadPlayersByName,
  playerHasTeam,
} from "./game-critical";
import { playerKey } from "./player-utils";

const REPORTS_DIR = join(__dirname, "reports");
const CACHE_PATH = join(__dirname, "player-enrichment-cache.json");
const LEGENDS_PATH = join(__dirname, "legends.json");

type AuditFlag =
  | "missingFromDb"
  | "fallbackSource"
  | "suspiciousPosition"
  | "missingThemeClub"
  | "singleClubOnly"
  | "legendOnly";

type AuditEntry = {
  name: string;
  inLegends: boolean;
  source: "legend" | "wikipedia" | "fallback" | "missing";
  position: string | null;
  nationality: string | null;
  teams: string;
  career: string;
  themes: string[];
  requiredTeams: string[];
  flags: AuditFlag[];
};

function loadEnrichmentByName(): Map<string, EnrichmentEntry> {
  const spreadsheet = importSpreadsheet();
  const cache = existsSync(CACHE_PATH)
    ? (JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as Record<
        string,
        EnrichmentEntry
      >)
    : {};

  const byName = new Map<string, EnrichmentEntry>();
  for (const row of spreadsheet) {
    const entry = cache[row.key];
    if (entry) byName.set(row.name, entry);
  }
  return byName;
}

function loadLegendNames(): Set<string> {
  const legends = JSON.parse(readFileSync(LEGENDS_PATH, "utf-8")) as {
    name: string;
  }[];
  return new Set(legends.map((l) => l.name));
}

function audit(): AuditEntry[] {
  const names = getGameCriticalNames();
  const players = loadPlayersByName();
  const themesByPlayer = getThemesByPlayer();
  const enrichmentByName = loadEnrichmentByName();
  const legendNames = loadLegendNames();

  return names.map((name) => {
    const player = players.get(name);
    const themes = themesByPlayer.get(name) ?? [];
    const requiredTeams = getRequiredTeamsForPlayer(name, themes);
    const inLegends = legendNames.has(name);
    const flags: AuditFlag[] = [];

    let source: AuditEntry["source"] = "missing";
    if (inLegends) {
      source = "legend";
    } else {
      const enrichment = enrichmentByName.get(name);
      if (enrichment) {
        source = enrichment.source;
        if (enrichment.source === "fallback") flags.push("fallbackSource");
      }
    }

    if (!player) {
      flags.push("missingFromDb");
    } else {
      if (
        KNOWN_GOALKEEPERS.has(name) &&
        player.primaryPosition !== "Goleiro"
      ) {
        flags.push("suspiciousPosition");
      }

      for (const team of requiredTeams) {
        if (!playerHasTeam(player, team)) {
          flags.push("missingThemeClub");
          break;
        }
      }

      if (player.teams.length === 1 && themes.length > 0) {
        flags.push("singleClubOnly");
      }
    }

    if (inLegends && themes.length === 0) {
      flags.push("legendOnly");
    }

    return {
      name,
      inLegends,
      source,
      position: player?.primaryPosition ?? null,
      nationality: player?.nationality ?? null,
      teams: player ? JSON.stringify(player.teams) : "",
      career: player
        ? `${player.careerStart}–${player.careerEnd}`
        : "",
      themes: themes.map((t) => t.challengeId),
      requiredTeams,
      flags,
    };
  });
}

function toCsv(entries: AuditEntry[]): string {
  const header = [
    "name",
    "inLegends",
    "source",
    "position",
    "nationality",
    "teams",
    "career",
    "themes",
    "requiredTeams",
    "flags",
  ];
  const rows = entries.map((e) =>
    [
      e.name,
      e.inLegends,
      e.source,
      e.position ?? "",
      e.nationality ?? "",
      `"${e.teams.replace(/"/g, '""')}"`,
      e.career,
      e.themes.join(";"),
      e.requiredTeams.join(";"),
      e.flags.join(";"),
    ].join(",")
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}

function main() {
  const entries = audit();
  const flagged = entries.filter((e) => e.flags.length > 0);

  mkdirSync(REPORTS_DIR, { recursive: true });

  const jsonPath = join(REPORTS_DIR, "audit-queue.json");
  const csvPath = join(REPORTS_DIR, "audit-queue.csv");

  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: entries.length,
        flaggedCount: flagged.length,
        entries,
      },
      null,
      2
    ) + "\n"
  );
  writeFileSync(csvPath, toCsv(entries));

  console.log(`Auditoria: ${entries.length} jogadores game-critical`);
  console.log(`Com flags: ${flagged.length}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);

  const byFlag: Record<string, number> = {};
  for (const entry of entries) {
    for (const flag of entry.flags) {
      byFlag[flag] = (byFlag[flag] ?? 0) + 1;
    }
  }
  console.log("Flags:", byFlag);
}

main();
