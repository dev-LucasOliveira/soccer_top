import { NextResponse } from "next/server";
import { castVote, getVoteState } from "@/lib/session";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    const state = await getVoteState(code, participantId);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar votação";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, alias } = body as {
      participantId: string;
      alias: string;
    };

    if (!participantId || !alias) {
      return NextResponse.json(
        { error: "participantId e alias são obrigatórios" },
        { status: 400 }
      );
    }

    const state = await castVote(code, participantId, alias);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar voto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
