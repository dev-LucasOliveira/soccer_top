import { readFileSync } from "fs";
import { join } from "path";
import { GUESS_TOP_CHALLENGES } from "../../lib/guess-top-challenges";
import { pickSlotHint } from "../../lib/guess-top-hints";
import { playerMatchesFilters } from "../../lib/filters";
import {
  getGameCriticalNames,
  getThemesByPlayer,
  KNOWN_GOALKEEPERS,
  playerHasTeam,
} from "./game-critical";
import type { SeedPlayer } from "../../lib/types";

const PLAYERS_PATH = join(__dirname, "players.json");

function main() {
  const players = JSON.parse(
    readFileSync(PLAYERS_PATH, "utf-8")
  ) as SeedPlayer[];
  const playerByName = new Map(players.map((p) => [p.name, p]));
  const themesByPlayer = getThemesByPlayer();
  const errors: string[] = [];

  const poolNames = new Set(GUESS_TOP_CHALLENGES.flatMap((c) => c.pool));
  for (const name of poolNames) {
    if (!playerByName.has(name)) {
      errors.push(`Pool: jogador ausente em players.json — ${name}`);
    }
  }

  for (const name of getGameCriticalNames()) {
    const player = playerByName.get(name);
    if (!player) continue;

    if (KNOWN_GOALKEEPERS.has(name) && player.primaryPosition !== "Goleiro") {
      errors.push(
        `Goleiro conhecido com posição errada: ${name} = ${player.primaryPosition}`
      );
    }

    const themes = themesByPlayer.get(name) ?? [];
    for (const theme of themes) {
      for (const team of theme.searchFilters?.teams ?? []) {
        if (!playerHasTeam(player, team)) {
          errors.push(
            `Tema ${theme.challengeId}: ${name} sem clube ${team} em teams`
          );
        }
      }
    }
  }

  for (const challenge of GUESS_TOP_CHALLENGES) {
    if (challenge.searchFilters) {
      for (const name of challenge.pool) {
        const player = playerByName.get(name);
        if (!player) continue;

        const filterPlayer = {
          primaryPosition: player.primaryPosition,
          nationality: player.nationality,
          teams: JSON.stringify(player.teams),
          careerStart: player.careerStart,
          careerEnd: player.careerEnd,
        };

        if (!playerMatchesFilters(filterPlayer, challenge.searchFilters)) {
          errors.push(
            `[${challenge.id}] ${name} não passa no filtro (${player.primaryPosition}, ${player.nationality})`
          );
        }
      }
    }

    const filterTeams = challenge.searchFilters?.teams;
    if (!filterTeams?.length) continue;

    for (const name of challenge.pool) {
      const player = playerByName.get(name);
      if (!player) continue;

      const hint = pickSlotHint(
        JSON.stringify(player.teams),
        player.careerStart,
        player.careerEnd,
        challenge.searchFilters
      );

      const normalizedFilters = filterTeams.map((t) => t.toLowerCase());
      const hintTeam = hint.team.toLowerCase();
      const matchesTheme = normalizedFilters.some(
        (filter) =>
          hintTeam === filter || hintTeam.includes(filter)
      );

      if (!matchesTheme) {
        errors.push(
          `Hint rival/errado em ${challenge.id}: ${name} → ${hint.label} (esperado ${filterTeams.join(" ou ")})`
        );
      }
    }
  }

  if (errors.length) {
    console.error(`Falhou com ${errors.length} erro(s):\n`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `✓ ${getGameCriticalNames().length} jogadores game-critical validados`
  );
  console.log(`✓ ${GUESS_TOP_CHALLENGES.length} temas sem erros hard`);
}

main();
