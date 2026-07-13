import type { PrismaClient } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export type VoteDbClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

const ORPHAN_VOTE_IDS_QUERY = `
  SELECT v.id
  FROM "Vote" v
  INNER JOIN "Round" r ON r.id = v."roundId"
  WHERE NOT EXISTS (
    SELECT 1
    FROM "Participant" p
    WHERE p."sessionId" = r."sessionId"
      AND p.id = v."voterParticipantId"
  )
  OR NOT EXISTS (
    SELECT 1
    FROM "Participant" p
    WHERE p."sessionId" = r."sessionId"
      AND p.id = v."targetParticipantId"
  )
`;

export async function deleteVotesForParticipant(
  client: VoteDbClient,
  sessionId: string,
  participantId: string
) {
  return client.vote.deleteMany({
    where: {
      OR: [
        { voterParticipantId: participantId },
        { targetParticipantId: participantId },
      ],
      round: { sessionId },
    },
  });
}

export async function findOrphanVoteIds(client: VoteDbClient = prisma) {
  return client.$queryRawUnsafe<Array<{ id: string }>>(ORPHAN_VOTE_IDS_QUERY);
}

export async function countOrphanVotes(client: VoteDbClient = prisma) {
  const rows = await findOrphanVoteIds(client);
  return rows.length;
}

export async function deleteOrphanVotes(client: VoteDbClient = prisma) {
  const rows = await findOrphanVoteIds(client);
  if (rows.length === 0) {
    return { count: 0 };
  }

  const result = await client.vote.deleteMany({
    where: {
      id: { in: rows.map((row) => row.id) },
    },
  });

  return result;
}
