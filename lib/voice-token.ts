import { AccessToken } from "livekit-server-sdk";
import { assertVoiceParticipant } from "@/lib/voice-auth";
import {
  buildVoiceRoomName,
  getLiveKitCredentials,
  getLiveKitUrl,
  isVoiceChatEnabled,
  VOICE_DISABLED_MESSAGE,
} from "@/lib/voice-config";
import { logVoiceEvent } from "@/lib/voice-logger";

const TOKEN_TTL = "15m";

export class VoiceDisabledError extends Error {
  code = "voice_disabled" as const;

  constructor() {
    super(VOICE_DISABLED_MESSAGE.body);
    this.name = "VoiceDisabledError";
  }
}

export async function createVoiceToken(params: {
  sessionCode: string;
  participantId: string;
  guestToken: string | undefined | null;
}) {
  if (!isVoiceChatEnabled()) {
    logVoiceEvent("voice_disabled", {
      sessionCode: params.sessionCode,
      participantId: params.participantId,
    });
    throw new VoiceDisabledError();
  }

  const { session, participant, canPublish } = await assertVoiceParticipant(
    params.sessionCode,
    params.participantId,
    params.guestToken
  );

  const { apiKey, apiSecret } = getLiveKitCredentials();
  const voiceRoomName = buildVoiceRoomName(session.code);

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participant.id,
    name: participant.displayName,
    ttl: TOKEN_TTL,
    metadata: JSON.stringify({
      gameRoomId: session.code,
      gameMode: session.gameMode,
      role: canPublish ? "player" : "spectator",
    }),
  });

  token.addGrant({
    roomJoin: true,
    room: voiceRoomName,
    canPublish,
    canSubscribe: true,
    canPublishData: false,
  });

  logVoiceEvent("voice_token_issued", {
    sessionCode: session.code,
    participantId: participant.id,
    canPublish,
    roomName: voiceRoomName,
  });

  return {
    token: await token.toJwt(),
    url: getLiveKitUrl(),
    roomName: voiceRoomName,
    canPublish,
  };
}
