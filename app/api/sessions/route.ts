import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionCode } from "@/lib/guest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { displayName, guestToken } = body as {
      displayName: string;
      guestToken?: string;
    };

    if (!displayName?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
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
          title: `Sala ${code}`,
          status: "setup",
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
      sessionId: session.id,
      participantId: session.participants[0].id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar sala" },
      { status: 500 }
    );
  }
}
