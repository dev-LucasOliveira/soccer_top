import { GUESS_TOP_CHALLENGES } from "@/lib/guess-top-challenges";
import { prisma } from "@/lib/db";

async function main() {
  const allNames = [...new Set(GUESS_TOP_CHALLENGES.flatMap((c) => c.pool))];
  const found = await prisma.player.findMany({
    where: { name: { in: allNames } },
    select: { name: true },
  });
  const foundSet = new Set(found.map((p) => p.name));
  const missing = allNames.filter((n) => !foundSet.has(n));

  console.log("total pool names:", allNames.length);
  console.log("found in DB:", found.length);
  console.log("missing:", missing.length);
  if (missing.length) {
    console.log(missing.join(", "));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
