import { NextResponse } from "next/server";
import {
  getVoiceConfigStatus,
  VOICE_DISABLED_MESSAGE,
} from "@/lib/voice-config";

export async function GET() {
  const config = getVoiceConfigStatus();

  if (!config.enabled) {
    return NextResponse.json({
      enabled: false,
      config,
      message: VOICE_DISABLED_MESSAGE,
    });
  }

  return NextResponse.json({
    enabled: true,
    config,
  });
}
