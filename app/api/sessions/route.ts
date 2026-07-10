import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionCode } from "@/lib/guest";
import type { RoundConfig } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, displayName, guestToken, rounds } = body as {
      title: string;
      displayName: string;
      guestToken?: string;
      rounds: RoundConfig[];
    };

    if (!title?.trim() || !displayName?.trim()) {
      return NextResponse.json(
        { error: "Título e nome são obrigatórios" },
        { status: 400 }
      );
    }

    if (!rounds?.length || rounds.length < 1 || rounds.length > 10) {
      return NextResponse.json(
        { error: "Informe entre 1 e 10 rounds" },
        { status: 400 }
      );
    }

    for (const [i, round] of rounds.entries()) {
      if (!round.title?.trim()) {
        return NextResponse.json(
          { error: `Round ${i + 1}: título é obrigatório` },
          { status: 400 }
        );
      }
      if (!round.topN || round.topN < 1 || round.topN > 50) {
        return NextResponse.json(
          { error: `Round ${i + 1}: Top N deve ser entre 1 e 50` },
          { status: 400 }
        );
      }
    }

    let code = createSessionCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.session.findUnique({ where: { code } });
      if (!existing) break;
      code = createSessionCode();
      attempts++;
    }

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          code,
          title: title.trim(),
          status: "setup",
          currentRoundNumber: 1,
          participants: {
            create: {
              displayName: displayName.trim(),
              guestToken: guestToken ?? null,
              status: "building",
            },
          },
          rounds: {
            create: rounds.map((round, index) => ({
              number: index + 1,
              title: round.title.trim(),
              topN: round.topN,
              filters: JSON.stringify(round.filters ?? {}),
              status: "pending",
            })),
          },
        },
        include: {
          participants: true,
          rounds: true,
        },
      });

      const creatorId = created.participants[0].id;

      return tx.session.update({
        where: { id: created.id },
        data: { creatorParticipantId: creatorId },
        include: { participants: true, rounds: true },
      });
    });

    return NextResponse.json({
      code: session.code,
      sessionId: session.id,
      participantId: session.participants[0].id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar session" },
      { status: 500 }
    );
  }
}
