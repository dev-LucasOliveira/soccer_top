type VoiceLogEvent =
  | "voice_token_requested"
  | "voice_token_issued"
  | "voice_token_denied"
  | "voice_token_failed"
  | "voice_disabled"
  | "voice_webhook_received";

export function logVoiceEvent(
  event: VoiceLogEvent,
  data: Record<string, string | number | boolean | undefined>
) {
  console.info(
    JSON.stringify({
      scope: "voice-chat",
      event,
      at: new Date().toISOString(),
      ...data,
    })
  );
}
