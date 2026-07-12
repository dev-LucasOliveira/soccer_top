import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { getLiveKitCredentials } from "@/lib/voice-config";
import { logVoiceEvent } from "@/lib/voice-logger";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const authHeader = request.headers.get("authorization");

    const { apiKey, apiSecret } = getLiveKitCredentials();
    const receiver = new WebhookReceiver(apiKey, apiSecret);
    const event = await receiver.receive(body, authHeader ?? undefined);

    logVoiceEvent("voice_webhook_received", {
      eventType: event.event,
      roomName: event.room?.name,
      participantIdentity: event.participant?.identity,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("livekit webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook inválido" },
      { status: 400 }
    );
  }
}
