import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { readFileSync } from "fs";
import { GUESS_TOP_CHALLENGES } from "../../lib/guess-top-challenges";
import { playerMatchesFilters } from "../../lib/filters";
import type { SeedPlayer } from "../../lib/types";

const PLAYERS_PATH = join(__dirname, "players.json");
const REPORTS_DIR = join(__dirname, "reports");

type MismatchEntry = {
  name: string;
  position: string;
  nationality: string;
  reason: string;
};

type ThemeReport = {
  id: string;
  title: string;
  searchFilters: Record<string, unknown>;
  poolSize: number;
  mismatches: MismatchEntry[];
};

function describeMismatch(
  player: SeedPlayer,
  searchFilters: Parameters<typeof playerMatchesFilters>[1]
): string {
  const parts: string[] = [];

  if (
    searchFilters.positions?.length &&
    !searchFilters.positions.includes(player.primaryPosition)
  ) {
    parts.push(
      `posição ${player.primaryPosition}, filtro exige ${searchFilters.positions.join("/")}`
    );
  }

  if (
    searchFilters.nationalities?.length &&
    !searchFilters.nationalities.includes(player.nationality)
  ) {
    parts.push(
      `nacionalidade ${player.nationality}, filtro exige ${searchFilters.nationalities.join("/")}`
    );
  }

  if (searchFilters.teams?.length) {
    const teamNames = player.teams.map((t) => t.name.toLowerCase());
    const filterTeams = searchFilters.teams.map((t) => t.toLowerCase());
    const hasTeam = filterTeams.some((filterTeam) =>
      teamNames.some(
        (name) => name === filterTeam || name.includes(filterTeam)
      )
    );
    if (!hasTeam) {
      parts.push(
        `sem clube ${searchFilters.teams.join("/")} (tem ${player.teams.map((t) => t.name).join(", ")})`
      );
    }
  }

  return parts.join("; ") || "não passa no filtro";
}

function audit(): ThemeReport[] {
  const players = JSON.parse(
    readFileSync(PLAYERS_PATH, "utf-8")
  ) as SeedPlayer[];
  const playerByName = new Map(players.map((p) => [p.name, p]));

  return GUESS_TOP_CHALLENGES.map((challenge) => {
    const mismatches: MismatchEntry[] = [];

    if (!challenge.searchFilters) {
      return {
        id: challenge.id,
        title: challenge.title,
        searchFilters: {},
        poolSize: challenge.pool.length,
        mismatches,
      };
    }

    for (const name of challenge.pool) {
      const player = playerByName.get(name);
      if (!player) {
        mismatches.push({
          name,
          position: "—",
          nationality: "—",
          reason: "ausente em players.json",
        });
        continue;
      }

      const filterPlayer = {
        primaryPosition: player.primaryPosition,
        nationality: player.nationality,
        teams: JSON.stringify(player.teams),
        careerStart: player.careerStart,
        careerEnd: player.careerEnd,
      };

      if (!playerMatchesFilters(filterPlayer, challenge.searchFilters)) {
        mismatches.push({
          name,
          position: player.primaryPosition,
          nationality: player.nationality,
          reason: describeMismatch(player, challenge.searchFilters),
        });
      }
    }

    return {
      id: challenge.id,
      title: challenge.title,
      searchFilters: challenge.searchFilters as Record<string, unknown>,
      poolSize: challenge.pool.length,
      mismatches,
    };
  });
}

function toCsv(reports: ThemeReport[]): string {
  const rows = ["theme_id,theme_title,player,position,nationality,reason"];
  for (const report of reports) {
    for (const mismatch of report.mismatches) {
      rows.push(
        [
          report.id,
          `"${report.title.replace(/"/g, '""')}"`,
          `"${mismatch.name.replace(/"/g, '""')}"`,
          mismatch.position,
          mismatch.nationality,
          `"${mismatch.reason.replace(/"/g, '""')}"`,
        ].join(",")
      );
    }
  }
  return rows.join("\n") + "\n";
}

function main() {
  const reports = audit();
  const totalMismatches = reports.reduce(
    (sum, report) => sum + report.mismatches.length,
    0
  );

  mkdirSync(REPORTS_DIR, { recursive: true });

  const jsonPath = join(REPORTS_DIR, "pool-filter-mismatches.json");
  const csvPath = join(REPORTS_DIR, "pool-filter-mismatches.csv");

  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        themesWithMismatches: reports.filter((r) => r.mismatches.length > 0)
          .length,
        totalMismatches,
        reports,
      },
      null,
      2
    ) + "\n"
  );
  writeFileSync(csvPath, toCsv(reports));

  console.log(`Temas com mismatch: ${reports.filter((r) => r.mismatches.length).length}`);
  console.log(`Total mismatches: ${totalMismatches}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);

  for (const report of reports) {
    if (report.mismatches.length === 0) continue;
    console.log(`\n[${report.id}] ${report.mismatches.length} problema(s):`);
    for (const mismatch of report.mismatches) {
      console.log(`  - ${mismatch.name}: ${mismatch.reason}`);
    }
  }

  if (totalMismatches > 0) {
    process.exit(1);
  }

  console.log("\nTodos os pools passam nos filtros dos temas.");
}

main();
