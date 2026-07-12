import { prisma } from "@/lib/db";
import { isSpectator } from "@/lib/participants";
import type { GameMode } from "@/lib/types";

const MULTIPLAYER_MODES: GameMode[] = [
  "ranking",
  "impostor",
  "duelo",
  "lista-secreta-mp",
];

export async function assertVoiceParticipant(
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
    include: { participants: true },
  });

  if (!session) {
    throw new Error("Sala não encontrada");
  }

  if (!MULTIPLAYER_MODES.includes(session.gameMode as GameMode)) {
    throw new Error("Voice chat disponível apenas em salas multiplayer");
  }

  if (session.status === "completed") {
    throw new Error("Sala encerrada");
  }

  const participant = session.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new Error("Participante não pertence a esta sala");
  }

  if (participant.guestToken !== guestToken) {
    throw new Error("Não autorizado");
  }

  return {
    session,
    participant,
    canPublish: !isSpectator(participant),
  };
}
