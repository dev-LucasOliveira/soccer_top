import { NextResponse } from "next/server";
import { createSessionCode } from "@/lib/guest";
import { prisma } from "@/lib/db";
import { getParticipantAuthContext } from "@/lib/participant-auth";
import {
  getSessionTitleForMode,
  isPlayableGameMode,
} from "@/lib/mode-constraints";
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

    const authContext = await getParticipantAuthContext(displayName);
    const resolvedDisplayName = authContext.displayName ?? displayName.trim();

    const mode: GameMode =
      gameMode === "lobby"
        ? "lobby"
        : gameMode === "impostor"
          ? "impostor"
          : gameMode === "duelo"
            ? "duelo"
            : gameMode === "lista-secreta-mp"
              ? "lista-secreta-mp"
              : gameMode === "ranking"
                ? "ranking"
                : "lobby";

    let code = createSessionCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.session.findUnique({ where: { code } });
      if (!existing) break;
      code = createSessionCode();
      attempts++;
    }

    const title =
      mode === "lobby"
        ? `Sala ${code}`
        : isPlayableGameMode(mode)
          ? getSessionTitleForMode(code, mode)
          : `Sala ${code}`;

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          code,
          title,
          status: "setup",
          gameMode: mode,
          currentRoundNumber: 1,
          participants: {
            create: {
              displayName: resolvedDisplayName,
              guestToken: guestToken ?? null,
              userId: authContext.userId,
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
    const prismaCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : null;
    if (prismaCode === "P2022") {
      return NextResponse.json(
        {
          error:
            "Banco desatualizado — rode npm run db:deploy e tente novamente.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erro ao criar sala" }, { status: 500 });
  }
}
