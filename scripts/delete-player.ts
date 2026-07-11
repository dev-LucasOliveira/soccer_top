import "dotenv/config";
import { createPrismaClient } from "../lib/prisma";

const id = process.argv[2];

if (!id) {
  console.error("Uso: npx tsx scripts/delete-player.ts <player-id>");
  process.exit(1);
}

const { prisma, pool } = createPrismaClient();

async function main() {
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      picks: { select: { id: true } },
      curatedRankings: { select: { id: true } },
    },
  });

  if (!player) {
    throw new Error("Jogador não encontrado");
  }

  console.log({
    id: player.id,
    name: player.name,
    position: player.primaryPosition,
    picks: player.picks.length,
    curatedRankings: player.curatedRankings.length,
  });

  await prisma.player.delete({ where: { id } });
  console.log(`Deletado: ${player.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
