import { NextResponse } from "next/server";
import { listImpostorThemes } from "@/lib/impostor-themes";

export async function GET() {
  return NextResponse.json({ themes: listImpostorThemes() });
}
