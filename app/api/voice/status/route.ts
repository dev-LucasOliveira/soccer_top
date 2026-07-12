import { NextResponse } from "next/server";
import {
  isVoiceChatEnabled,
  VOICE_DISABLED_MESSAGE,
} from "@/lib/voice-config";

export async function GET() {
  if (isVoiceChatEnabled()) {
    return NextResponse.json({ enabled: true });
  }

  return NextResponse.json({
    enabled: false,
    message: VOICE_DISABLED_MESSAGE,
  });
}
