import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { filterPlayers, parseFilters } from "@/lib/filters";
import { getCurrentRound } from "@/lib/round";
import { matchesSearch } from "@/lib/normalize";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionCode = searchParams.get("session");
    const search = searchParams.get("search") ?? "";
    const idsParam = searchParams.get("ids");

    let filters = {};
    if (sessionCode) {
      const session = await prisma.session.findUnique({
        where: { code: sessionCode },
        include: { rounds: { orderBy: { number: "asc" } } },
      });
      if (!session) {
        return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
      }
      const currentRound = getCurrentRound(session);
      filters = parseFilters(currentRound?.filters ?? "{}");
    } else {
      const positions = searchParams.get("positions");
      const nationalities = searchParams.get("nationalities");
      const teams = searchParams.get("teams");
      const eraStart = searchParams.get("eraStart");
      const eraEnd = searchParams.get("eraEnd");

      filters = {
        ...(positions ? { positions: positions.split(",") } : {}),
        ...(nationalities ? { nationalities: nationalities.split(",") } : {}),
        ...(teams ? { teams: teams.split(",") } : {}),
        ...(eraStart ? { eraStart: parseInt(eraStart) } : {}),
        ...(eraEnd ? { eraEnd: parseInt(eraEnd) } : {}),
      };
    }

    const allPlayers = await prisma.player.findMany({
      orderBy: { name: "asc" },
    });

    let players = filterPlayers(allPlayers, filters as Parameters<typeof filterPlayers>[1]);

    if (idsParam) {
      const idSet = new Set(idsParam.split(",").filter(Boolean));
      players = players.filter((p) => idSet.has(p.id));
    } else if (search) {
      players = players.filter((p) => matchesSearch(p.name, search));
    }

    return NextResponse.json({
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        primaryPosition: p.primaryPosition,
        nationality: p.nationality,
        teams: JSON.parse(p.teams),
        careerStart: p.careerStart,
        careerEnd: p.careerEnd,
      })),
      total: players.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar jogadores" },
      { status: 500 }
    );
  }
}
