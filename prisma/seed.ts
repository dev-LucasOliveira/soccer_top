import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { createPrismaClient } from "../lib/prisma";
import type { SeedPlayer } from "../lib/types";
import { summarizePlayers } from "./seed/merge-players";

const { prisma, pool } = createPrismaClient();

const POSITION_LIST_MAP: Record<string, string> = {
  goleiro: "Goleiro",
  defensor: "Defensor",
  meia: "Meia",
  atacante: "Atacante",
};

function parseCuratedList(listId: string): {
  listType: string;
  position: string | null;
} {
  if (listId === "general_top100") {
    return { listType: "general", position: null };
  }

  const match = listId.match(/^(goleiro|defensor|meia|atacante)_top\d+$/);
  if (!match) {
    return { listType: "position", position: null };
  }

  return {
    listType: "position",
    position: POSITION_LIST_MAP[match[1]],
  };
}

async function main() {
  await import("./seed/validate-impostor-themes");
  const playersPath = join(__dirname, "seed", "players.json");
  const players = JSON.parse(
    readFileSync(playersPath, "utf-8")
  ) as SeedPlayer[];
  const summary = summarizePlayers(players);

  await prisma.vote.deleteMany();
  await prisma.pick.deleteMany();
  await prisma.roundResult.deleteMany();
  await prisma.round.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.sessionResult.deleteMany();
  await prisma.session.deleteMany();
  await prisma.curatedRanking.deleteMany();
  await prisma.player.deleteMany();

  const createdPlayers = await prisma.player.createManyAndReturn({
    data: players.map((player) => ({
      name: player.name,
      primaryPosition: player.primaryPosition,
      nationality: player.nationality,
      teams: JSON.stringify(player.teams),
      careerStart: player.careerStart,
      careerEnd: player.careerEnd,
    })),
  });

  const playerIdByName = new Map(
    createdPlayers.map((player) => [player.name, player.id])
  );

  const listCounters = new Map<string, number>();
  const curatedRankingData: {
    playerId: string;
    listType: string;
    position: string | null;
    rank: number;
  }[] = [];

  for (const seed of players) {
    if (!seed.curatedLists.length) continue;

    const playerId = playerIdByName.get(seed.name);
    if (!playerId) continue;

    for (const listId of seed.curatedLists) {
      const parsed = parseCuratedList(listId);
      const counterKey = `${parsed.listType}:${parsed.position ?? "general"}`;
      const nextRank = (listCounters.get(counterKey) ?? 0) + 1;
      listCounters.set(counterKey, nextRank);

      curatedRankingData.push({
        playerId,
        listType: parsed.listType,
        position: parsed.position,
        rank: nextRank,
      });
    }
  }

  if (curatedRankingData.length > 0) {
    await prisma.curatedRanking.createMany({ data: curatedRankingData });
  }

  console.log(`Seeded ${summary.total} players`);
  console.log("Por posição:", summary.byPosition);
  console.log("Por nacionalidade (top 10):", Object.entries(summary.byNationality).sort((a,b)=>b[1]-a[1]).slice(0,10));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
