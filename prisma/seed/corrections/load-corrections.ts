import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { PlayerCorrection } from "./types";

const CORRECTIONS_DIR = join(__dirname);

export function loadAllCorrections(): PlayerCorrection[] {
  if (!existsSync(CORRECTIONS_DIR)) return [];

  const files = readdirSync(CORRECTIONS_DIR).filter(
    (file) => file.endsWith(".json") && file !== "types.ts"
  );

  const all: PlayerCorrection[] = [];

  for (const file of files) {
    const content = JSON.parse(
      readFileSync(join(CORRECTIONS_DIR, file), "utf-8")
    ) as PlayerCorrection[];
    if (!Array.isArray(content)) {
      throw new Error(`${file} deve ser um array de PlayerCorrection`);
    }
    all.push(...content);
  }

  const seen = new Set<string>();
  for (const correction of all) {
    if (!correction.name) {
      throw new Error("Correção sem name");
    }
    if (seen.has(correction.name)) {
      throw new Error(`Correção duplicada: ${correction.name}`);
    }
    seen.add(correction.name);
  }

  return all.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function applyCorrectionToPlayer<T extends {
  name: string;
  primaryPosition: string;
  nationality: string;
  teams: { name: string; from: number; to: number }[];
  careerStart: number;
  careerEnd: number;
}>(player: T, correction: PlayerCorrection): T {
  return {
    ...player,
    primaryPosition: correction.primaryPosition ?? player.primaryPosition,
    nationality: correction.nationality ?? player.nationality,
    teams: correction.teams ?? player.teams,
    careerStart: correction.careerStart ?? player.careerStart,
    careerEnd: correction.careerEnd ?? player.careerEnd,
  };
}
