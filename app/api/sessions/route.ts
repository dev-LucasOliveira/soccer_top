import { NextResponse } from "next/server";
import { createSessionCode } from "@/lib/guest";
import { prisma } from "@/lib/db";
import type { GameMode } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { displayName, guestToken, gameMode } = body as {
      displayName: string;
      guestToken?: string;
      gameMode?: GameMode;
    };

    if (!displayName?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const mode: GameMode =
      gameMode === "impostor"
        ? "impostor"
        : gameMode === "duelo"
          ? "duelo"
          : "ranking";

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
          title: mode === "impostor" ? `Impostor ${code}` : mode === "duelo" ? `Duelo ${code}` : `Sala ${code}`,
          status: "setup",
          gameMode: mode,
          currentRoundNumber: 1,
          participants: {
            create: {
              displayName: displayName.trim(),
              guestToken: guestToken ?? null,
              status: "building",
            },
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
      participantId: session.participants[0].id,
      gameMode: session.gameMode,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar sala" }, { status: 500 });
  }
}
