import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      return NextResponse.json({ error: "Session não encontrada" }, { status: 404 });
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Session já finalizada" },
        { status: 400 }
      );
    }

    if (session.status !== "setup") {
      return NextResponse.json(
        { error: "Session já iniciada — não é possível entrar" },
        { status: 400 }
      );
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
        });
      }
    }

    const participant = await prisma.participant.create({
      data: {
        sessionId: session.id,
        displayName: displayName.trim(),
        guestToken: guestToken ?? null,
        status: "building",
      },
    });

    return NextResponse.json({
      participantId: participant.id,
      displayName: participant.displayName,
      alreadyJoined: false,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao entrar na session" }, { status: 500 });
  }
}
