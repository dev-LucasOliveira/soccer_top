import { RoomServiceClient } from "livekit-server-sdk";
import { assertCreator } from "@/lib/creator-auth";
import {
  buildVoiceRoomName,
  getLiveKitCredentials,
  getLiveKitUrl,
  isVoiceChatEnabled,
} from "@/lib/voice-config";
import { logVoiceEvent } from "@/lib/voice-logger";
import { VoiceDisabledError } from "@/lib/voice-token";

function getRoomServiceClient() {
  const { apiKey, apiSecret } = getLiveKitCredentials();
  return new RoomServiceClient(getLiveKitUrl(), apiKey, apiSecret);
}

export async function removeVoiceParticipant(params: {
  sessionCode: string;
  creatorParticipantId: string;
  guestToken: string | undefined | null;
  targetParticipantId: string;
}) {
  if (!isVoiceChatEnabled()) {
    throw new VoiceDisabledError();
  }

  const { session } = await assertCreator(
    params.sessionCode,
    params.creatorParticipantId,
    params.guestToken
  );

  const participant = session.participants.find(
    (entry) => entry.id === params.targetParticipantId
  );
  if (!participant) {
    throw new Error("Participante não encontrado na sala");
  }

  const roomName = buildVoiceRoomName(session.code);
  const client = getRoomServiceClient();
  await client.removeParticipant(roomName, participant.id);

  logVoiceEvent("voice_token_denied", {
    sessionCode: session.code,
    participantId: participant.id,
    reason: "removed_by_host",
  });

  return { ok: true };
}
