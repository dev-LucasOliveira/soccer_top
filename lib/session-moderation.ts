import { assertCreator } from "@/lib/creator-auth";
import { prisma } from "@/lib/db";
import { deleteVotesForParticipant } from "@/lib/vote-cleanup";
import { removeVoiceParticipant } from "@/lib/voice-moderation";

export type SessionParticipantRef = {
  id: string;
};

export function validateRemoveSessionParticipant(params: {
  creatorParticipantId: string;
  targetParticipantId: string;
  participants: SessionParticipantRef[];
}) {
  if (params.targetParticipantId === params.creatorParticipantId) {
    throw new Error("Não é possível remover o criador da sala");
  }

  const target = params.participants.find(
    (participant) => participant.id === params.targetParticipantId
  );
  if (!target) {
    throw new Error("Participante não encontrado na sala");
  }
}

export async function removeSessionParticipant(params: {
  sessionCode: string;
  creatorParticipantId: string;
  guestToken: string | undefined | null;
  targetParticipantId: string;
}) {
  const { session } = await assertCreator(
    params.sessionCode,
    params.creatorParticipantId,
    params.guestToken
  );

  validateRemoveSessionParticipant({
    creatorParticipantId: params.creatorParticipantId,
    targetParticipantId: params.targetParticipantId,
    participants: session.participants,
  });

  try {
    await removeVoiceParticipant({
      sessionCode: params.sessionCode,
      creatorParticipantId: params.creatorParticipantId,
      guestToken: params.guestToken,
      targetParticipantId: params.targetParticipantId,
    });
  } catch {
    // Voice is optional; a LiveKit failure must not block the session kick.
  }

  await prisma.$transaction(async (tx) => {
    if (session.impostorParticipantId === params.targetParticipantId) {
      await tx.session.update({
        where: { id: session.id },
        data: { impostorParticipantId: null },
      });
    }

    await deleteVotesForParticipant(tx, session.id, params.targetParticipantId);

    await tx.participant.delete({
      where: { id: params.targetParticipantId },
    });
  });

  return { ok: true };
}
