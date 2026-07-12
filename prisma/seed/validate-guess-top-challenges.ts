import players from "./players.json";
import { playerMatchesFilters } from "../../lib/filters";
import {
  GUESS_TOP_CHALLENGES,
  GUESS_TOP_DRAW_COUNT,
} from "../../lib/guess-top-challenges";
import {
  countHintCollisions,
  pickSlotHint,
} from "../../lib/guess-top-hints";

const MIN_POOL_SIZE = 15;
const playerByName = new Map(players.map((p) => [p.name, p]));

let failed = false;

for (const challenge of GUESS_TOP_CHALLENGES) {
  const issues: string[] = [];

  if (challenge.pool.length < MIN_POOL_SIZE) {
    issues.push(`pool tem ${challenge.pool.length} jogadores (mín. ${MIN_POOL_SIZE})`);
  }

  const seen = new Set<string>();
  for (const name of challenge.pool) {
    if (seen.has(name)) {
      issues.push(`duplicata no pool: ${name}`);
    }
    seen.add(name);

    if (!playerByName.has(name)) {
      issues.push(`jogador não encontrado: ${name}`);
    }
  }

  if (challenge.searchFilters) {
    for (const name of new Set(challenge.pool)) {
      const player = playerByName.get(name);
      if (!player) continue;

      const filterPlayer = {
        primaryPosition: player.primaryPosition,
        nationality: player.nationality,
        teams: JSON.stringify(player.teams ?? []),
        careerStart: player.careerStart ?? 1900,
        careerEnd: player.careerEnd ?? new Date().getFullYear(),
      };

      if (!playerMatchesFilters(filterPlayer, challenge.searchFilters)) {
        issues.push(
          `${name} não passa no filtro do tema (${player.primaryPosition}, ${player.nationality})`
        );
      }
    }
  }

  const poolHints = challenge.pool
    .map((name) => {
      const player = playerByName.get(name);
      if (!player) return null;
      return pickSlotHint(
        JSON.stringify(player.teams ?? []),
        player.careerStart ?? 1900,
        player.careerEnd ?? new Date().getFullYear(),
        challenge.searchFilters
      );
    })
    .filter((hint): hint is NonNullable<typeof hint> => hint !== null);

  const collisions = countHintCollisions(poolHints, 3);
  for (const [label, count] of collisions) {
    console.warn(
      `[${challenge.id}] aviso dica repetida (${count.length}x): ${label}`
    );
  }

  const uniqueValid = new Set(
    challenge.pool.filter((name) => playerByName.has(name))
  );
  if (uniqueValid.size < GUESS_TOP_DRAW_COUNT) {
    issues.push(
      `pool válido tem ${uniqueValid.size} jogadores (mín. ${GUESS_TOP_DRAW_COUNT} para sorteio)`
    );
  }

  if (issues.length) {
    failed = true;
    console.error(`\n[${challenge.id}] ${challenge.title}`);
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
  } else {
    console.log(`✓ ${challenge.id} (${challenge.pool.length} jogadores)`);
  }
}

console.log(`\n${GUESS_TOP_CHALLENGES.length} temas validados.`);

if (failed) {
  process.exit(1);
}

console.log("Todos os desafios passaram na validação.");
