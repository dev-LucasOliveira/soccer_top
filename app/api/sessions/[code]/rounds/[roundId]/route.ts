import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertCreator } from "@/lib/creator-auth";
import { validateRoundConfig } from "@/lib/round-config";
import { validateRankingRoundTimeLimit } from "@/lib/pick-time-limit";
import { toRoundSummary } from "@/lib/round";
import type { RoundConfig } from "@/lib/types";

type RouteContext = { params: Promise<{ code: string; roundId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { code, roundId } = await context.params;
    const body = await request.json();
    const { participantId, guestToken, round } = body as {
      participantId: string;
      guestToken?: string;
      round: Partial<RoundConfig>;
    };

    const { session } = await assertCreator(code, participantId, guestToken);

    if (session.status !== "setup") {
      return NextResponse.json(
        { error: "Só é possível configurar rodadas antes de iniciar" },
        { status: 400 }
      );
    }

    const existing = await prisma.round.findFirst({
      where: { id: roundId, sessionId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
    }

    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Rodada não pode ser editada" },
        { status: 400 }
      );
    }

    const config: RoundConfig = {
      title: round.title?.trim() ?? existing.title,
      topN: round.topN ?? existing.topN,
      filters: round.filters ?? JSON.parse(existing.filters),
      pickTimeLimitSeconds:
        round.pickTimeLimitSeconds !== undefined
          ? validateRankingRoundTimeLimit(round.pickTimeLimitSeconds)
          : existing.pickTimeLimitSeconds,
    };

    const validationError = validateRoundConfig(
      config,
      `Rodada ${existing.number}`
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updated = await prisma.round.update({
      where: { id: roundId },
      data: {
        title: config.title.trim(),
        topN: config.topN,
        filters: JSON.stringify(config.filters ?? {}),
        pickTimeLimitSeconds: config.pickTimeLimitSeconds ?? null,
      },
    });

    return NextResponse.json({ round: toRoundSummary(updated) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar round";
    const status = message.includes("não encontrad") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { code, roundId } = await context.params;
    const body = await request.json();
    const { participantId, guestToken } = body as {
      participantId: string;
      guestToken?: string;
    };

    const { session } = await assertCreator(code, participantId, guestToken);

    if (session.status !== "setup") {
      return NextResponse.json(
        { error: "Só é possível configurar rodadas antes de iniciar" },
        { status: 400 }
      );
    }

    const existing = await prisma.round.findFirst({
      where: { id: roundId, sessionId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.round.delete({ where: { id: roundId } });

      const remaining = await tx.round.findMany({
        where: { sessionId: session.id },
        orderBy: { number: "asc" },
      });

      for (const [index, round] of remaining.entries()) {
        const nextNumber = index + 1;
        if (round.number !== nextNumber) {
          await tx.round.update({
            where: { id: round.id },
            data: { number: nextNumber },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover round";
    const status = message.includes("não encontrad") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
