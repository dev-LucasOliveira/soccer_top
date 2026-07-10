import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStandings } from "@/lib/session";
import type { RoundResultData } from "@/lib/types";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const { searchParams } = new URL(request.url);
    const roundParam = searchParams.get("round");

    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        rounds: { orderBy: { number: "asc" } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const roundNumber = roundParam
      ? parseInt(roundParam, 10)
      : session.currentRoundNumber;

    const round = session.rounds.find((r) => r.number === roundNumber);
    if (!round) {
      return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
    }

    const roundResult = await prisma.roundResult.findUnique({
      where: { roundId: round.id },
    });

    if (!roundResult) {
      return NextResponse.json(
        { error: "Resultado da rodada ainda não disponível" },
        { status: 404 }
      );
    }

    const standings = await getStandings(code);

    return NextResponse.json({
      roundNumber: round.number,
      roundTitle: round.title,
      result: JSON.parse(roundResult.data) as RoundResultData,
      standings,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar resultado da rodada" },
      { status: 500 }
    );
  }
}
