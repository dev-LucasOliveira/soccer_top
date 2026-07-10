import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentRound } from "@/lib/round";

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

    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        rounds: { orderBy: { number: "asc" } },
        participants: {
          where: { id: participantId },
        },
      },
    });

    if (!session || session.participants.length === 0) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    }

    const currentRound = getCurrentRound(session);
    if (!currentRound) {
      return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
    }

    const participant = session.participants[0];

    const picks = await prisma.pick.findMany({
      where: {
        roundId: currentRound.id,
        participantId,
      },
      include: { player: true },
      orderBy: { rank: "asc" },
    });

    return NextResponse.json({
      status: participant.status,
      roundNumber: currentRound.number,
      roundTitle: currentRound.title,
      topN: currentRound.topN,
      picks: picks.map((p) => ({
        rank: p.rank,
        playerId: p.playerId,
        playerName: p.player.name,
        position: p.player.primaryPosition,
        nationality: p.player.nationality,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar ranking" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, picks, confirm } = body as {
      participantId: string;
      picks?: { playerId: string; rank: number }[];
      confirm?: boolean;
    };

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        participants: true,
        rounds: { orderBy: { number: "asc" } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const currentRound = getCurrentRound(session);
    if (!currentRound) {
      return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
    }

    if (session.status !== "active" || currentRound.status !== "open") {
      return NextResponse.json(
        { error: "Rodada não aceita mais alterações de ranking" },
        { status: 400 }
      );
    }

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    }

    if (participant.status === "confirmed") {
      return NextResponse.json(
        { error: "Ranking já confirmado, não pode ser editado" },
        { status: 400 }
      );
    }

    if (picks) {
      if (picks.length > currentRound.topN) {
        return NextResponse.json(
          { error: `Máximo de ${currentRound.topN} jogadores` },
          { status: 400 }
        );
      }

      const ranks = picks.map((p) => p.rank);
      const uniqueRanks = new Set(ranks);
      if (uniqueRanks.size !== ranks.length) {
        return NextResponse.json(
          { error: "Posições duplicadas não são permitidas" },
          { status: 400 }
        );
      }

      const playerIds = picks.map((p) => p.playerId);
      const uniquePlayers = new Set(playerIds);
      if (uniquePlayers.size !== playerIds.length) {
        return NextResponse.json(
          { error: "Jogadores duplicados não são permitidos" },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.pick.deleteMany({
          where: { roundId: currentRound.id, participantId },
        }),
        ...picks.map((pick) =>
          prisma.pick.create({
            data: {
              roundId: currentRound.id,
              participantId,
              playerId: pick.playerId,
              rank: pick.rank,
            },
          })
        ),
      ]);
    }

    if (confirm) {
      const pickCount = await prisma.pick.count({
        where: { roundId: currentRound.id, participantId },
      });
      if (pickCount !== currentRound.topN) {
        return NextResponse.json(
          { error: `Você precisa selecionar exatamente ${currentRound.topN} jogadores` },
          { status: 400 }
        );
      }

      await prisma.participant.update({
        where: { id: participantId },
        data: {
          status: "confirmed",
          confirmedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar ranking" }, { status: 500 });
  }
}
