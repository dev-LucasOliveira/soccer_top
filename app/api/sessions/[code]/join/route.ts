import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSpectator } from "@/lib/participants";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { displayName, guestToken } = body as {
      displayName: string;
      guestToken?: string;
    };

    if (!displayName?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { code },
      include: { participants: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    if (guestToken) {
      const existing = session.participants.find(
        (p) => p.guestToken === guestToken
      );
      if (existing) {
        return NextResponse.json({
          participantId: existing.id,
          displayName: existing.displayName,
          alreadyJoined: true,
          isSpectator: isSpectator(existing),
          sessionStatus: session.status,
        });
      }
    }

    const joinAsSpectator =
      session.status === "active" || session.status === "completed";

    const participant = await prisma.participant.create({
      data: {
        sessionId: session.id,
        displayName: displayName.trim(),
        guestToken: guestToken ?? null,
        status: joinAsSpectator ? "spectator" : "building",
      },
    });

    return NextResponse.json({
      participantId: participant.id,
      displayName: participant.displayName,
      alreadyJoined: false,
      isSpectator: joinAsSpectator,
      sessionStatus: session.status,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao entrar na sala" }, { status: 500 });
  }
}
