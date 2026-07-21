import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertCreator } from "@/lib/creator-auth";
import { validateRoundConfig } from "@/lib/round-config";
import { validateRankingRoundTimeLimit } from "@/lib/pick-time-limit";
import { toRoundSummary } from "@/lib/round";
import type { RoundConfig } from "@/lib/types";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken, round } = body as {
      participantId: string;
      guestToken?: string;
      round?: Partial<RoundConfig>;
    };

    const { session } = await assertCreator(code, participantId, guestToken);

    if (session.status !== "setup") {
      return NextResponse.json(
        { error: "Só é possível configurar rodadas antes de iniciar" },
        { status: 400 }
      );
    }

    const roundCount = await prisma.round.count({
      where: { sessionId: session.id },
    });

    if (roundCount >= 10) {
      return NextResponse.json(
        { error: "Máximo de 10 rodadas" },
        { status: 400 }
      );
    }

    const nextNumber = roundCount + 1;
    const config: RoundConfig = {
      title: round?.title?.trim() || `Rodada ${nextNumber}`,
      topN: round?.topN ?? 10,
      filters: round?.filters ?? {},
      pickTimeLimitSeconds: validateRankingRoundTimeLimit(
        round?.pickTimeLimitSeconds ?? null
      ),
    };

    const validationError = validateRoundConfig(config, `Rodada ${nextNumber}`);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const created = await prisma.round.create({
      data: {
        sessionId: session.id,
        number: nextNumber,
        title: config.title.trim(),
        topN: config.topN,
        filters: JSON.stringify(config.filters ?? {}),
        pickTimeLimitSeconds: config.pickTimeLimitSeconds ?? null,
        status: "pending",
      },
    });

    return NextResponse.json({ round: toRoundSummary(created) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao adicionar rodada";
    const status = message.includes("não encontrad") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
