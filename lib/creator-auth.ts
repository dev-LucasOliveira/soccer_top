import { prisma } from "@/lib/db";

export async function assertCreator(
  sessionCode: string,
  participantId: string,
  guestToken: string | undefined | null
) {
  if (!participantId) {
    throw new Error("participantId é obrigatório");
  }
  if (!guestToken) {
    throw new Error("guestToken é obrigatório");
  }

  const session = await prisma.session.findUnique({
    where: { code: sessionCode },
    include: {
      participants: true,
    },
  });

  if (!session) {
    throw new Error("Sala não encontrada");
  }

  if (session.creatorParticipantId !== participantId) {
    throw new Error("Apenas o criador pode realizar esta ação");
  }

  const participant = session.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new Error("Participante não encontrado");
  }

  if (participant.guestToken !== guestToken) {
    throw new Error("Não autorizado");
  }

  return { session, participant };
}
