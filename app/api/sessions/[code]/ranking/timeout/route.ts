import { NextResponse } from "next/server";
import { applyRankingRoundTimeout } from "@/lib/ranking-round-timeout";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const result = await applyRankingRoundTimeout(code);
    return NextResponse.json(result);
  } catch (error) {
    console.error("ranking timeout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar timeout",
      },
      { status: 400 }
    );
  }
}
