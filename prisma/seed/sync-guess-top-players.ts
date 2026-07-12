import { readFileSync } from "fs";
import { join } from "path";
import { createPrismaClient } from "../../lib/prisma";
import type { SeedPlayer } from "../../lib/types";
import { GUESS_TOP_CHALLENGES } from "../../lib/guess-top-challenges";

const { prisma, pool } = createPrismaClient();

async function main() {
  const playersPath = join(__dirname, "players.json");
  const players = JSON.parse(
    readFileSync(playersPath, "utf-8")
  ) as SeedPlayer[];

  const poolNames = [...new Set(GUESS_TOP_CHALLENGES.flatMap((c) => c.pool))];
  const needed = players.filter((p) => poolNames.includes(p.name));

  let created = 0;
  let updated = 0;

  for (const player of needed) {
    const existing = await prisma.player.findFirst({
      where: { name: player.name },
      select: { id: true },
    });

    const data = {
      primaryPosition: player.primaryPosition,
      nationality: player.nationality,
      teams: JSON.stringify(player.teams),
      careerStart: player.careerStart,
      careerEnd: player.careerEnd,
    };

    if (existing) {
      await prisma.player.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.player.create({
        data: {
          name: player.name,
          ...data,
        },
      });
      created++;
    }
  }

  console.log(
    `Sincronizados ${needed.length} jogador(es): ${created} criados, ${updated} atualizados`
  );
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
