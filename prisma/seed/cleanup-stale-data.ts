import "dotenv/config";
import { createPrismaClient } from "../../lib/prisma";
import {
  computeSessionLastActivityAt,
  isSessionStale,
} from "../../lib/session-activity";
import { countOrphanVotes, deleteOrphanVotes } from "../../lib/vote-cleanup";

const { prisma, pool } = createPrismaClient();

type CleanupOptions = {
  days: number;
  execute: boolean;
};

function parseArgs(argv: string[]): CleanupOptions {
  let days = 1;
  let execute = false;

  for (const arg of argv) {
    if (arg === "--execute") {
      execute = true;
      continue;
    }

    if (arg.startsWith("--days=")) {
      const value = Number(arg.slice("--days=".length));
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("Use --days com um número >= 0");
      }
      days = value;
    }
  }

  return { days, execute };
}

function formatDate(date: Date) {
  return date.toISOString();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const retentionMs = options.days * 86_400_000;
  const now = new Date();

  console.log(
    options.execute
      ? `Executando cleanup (retenção: ${options.days} dia(s))...`
      : `Dry-run do cleanup (retenção: ${options.days} dia(s))...`
  );

  const orphanVoteCount = await countOrphanVotes(prisma);
  console.log(`Votos órfãos encontrados: ${orphanVoteCount}`);

  if (options.execute && orphanVoteCount > 0) {
    const deletedVotes = await deleteOrphanVotes(prisma);
    console.log(`Votos órfãos removidos: ${deletedVotes.count}`);
  }

  const sessions = await prisma.session.findMany({
    select: {
      id: true,
      code: true,
      status: true,
      gameMode: true,
      createdAt: true,
      participants: {
        select: {
          joinedAt: true,
          confirmedAt: true,
        },
      },
      rounds: {
        select: {
          createdAt: true,
          votes: {
            select: { createdAt: true },
          },
          result: {
            select: { createdAt: true },
          },
          rankingMeta: {
            select: { updatedAt: true },
          },
        },
      },
      result: {
        select: { createdAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const staleSessions = sessions
    .map((session) => ({
      session,
      lastActivityAt: computeSessionLastActivityAt(session),
    }))
    .filter(({ lastActivityAt }) => isSessionStale(lastActivityAt, retentionMs, now));

  if (staleSessions.length === 0) {
    console.log("Nenhuma sessão stale encontrada.");
  } else {
    console.log(`Sessões stale encontradas: ${staleSessions.length}`);
    for (const { session, lastActivityAt } of staleSessions) {
      console.log(
        `- ${session.code} [${session.status}/${session.gameMode}] lastActivity=${formatDate(lastActivityAt)}`
      );
    }
  }

  if (options.execute) {
    for (const { session } of staleSessions) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    console.log(`Sessões removidas: ${staleSessions.length}`);
  } else if (orphanVoteCount > 0 || staleSessions.length > 0) {
    console.log("Rode com --execute para aplicar as remoções.");
  }

  console.log("Cleanup finalizado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
