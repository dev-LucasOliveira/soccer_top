import { readFileSync } from "fs";
import { join } from "path";
import { playerKey } from "./player-utils";
import {
  PLAYER_ALIAS_RULES,
  resolveCanonicalName,
} from "./player-aliases";
import type { SeedPlayer } from "../../lib/types";

const PLAYERS_PATH = join(__dirname, "players.json");

function main() {
  const players = JSON.parse(
    readFileSync(PLAYERS_PATH, "utf-8")
  ) as SeedPlayer[];

  const errors: string[] = [];
  const byKey = new Map<string, SeedPlayer[]>();

  for (const player of players) {
    const key = playerKey(player.name);
    const list = byKey.get(key) ?? [];
    list.push(player);
    byKey.set(key, list);

    if (resolveCanonicalName(player.name) !== player.name) {
      errors.push(
        `Alias no catálogo final (use o nome canônico): ${player.name} → ${resolveCanonicalName(player.name)}`
      );
    }
  }

  for (const [key, list] of byKey) {
    if (list.length > 1) {
      errors.push(
        `Chave duplicada "${key}": ${list.map((p) => p.name).join(", ")}`
      );
    }
  }

  for (const rule of PLAYER_ALIAS_RULES) {
    const canonical = players.find((p) => p.name === rule.canonicalName);
    if (!canonical) {
      errors.push(
        `Canônico ausente para alias ${rule.aliasName}: ${rule.canonicalName}`
      );
      continue;
    }

    const alias = players.find((p) => p.name === rule.aliasName);
    if (alias) {
      errors.push(
        `Alias ainda presente: ${rule.aliasName} (canônico: ${rule.canonicalName}, posições ${alias.primaryPosition} vs ${canonical.primaryPosition})`
      );
    }
  }

  const canonicalGroups = new Map<string, string[]>();
  for (const player of players) {
    const canonical = resolveCanonicalName(player.name);
    const group = canonicalGroups.get(canonical) ?? [];
    group.push(player.name);
    canonicalGroups.set(canonical, group);
  }

  for (const [canonical, names] of canonicalGroups) {
    const unique = [...new Set(names)];
    if (unique.length > 1) {
      errors.push(`Grupo canônico "${canonical}": ${unique.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    console.error(`Duplicatas encontradas: ${errors.length}`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `Sem duplicatas de alias (${PLAYER_ALIAS_RULES.length} regras verificadas, ${players.length} jogadores).`
  );
}

main();
