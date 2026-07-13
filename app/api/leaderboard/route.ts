import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAcceptedFriendIds } from "@/lib/friendships";
import { LEADERBOARD_MODES } from "@/lib/stats-game-modes";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const scope = searchParams.get("scope") === "friends" ? "friends" : "global";

    if (!mode || !LEADERBOARD_MODES.some((entry) => entry.id === mode)) {
      return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
    }

    let userIds: string[] | undefined;

    if (scope === "friends") {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { error: "Login necessário para ver ranking de amigos" },
          { status: 401 }
        );
      }

      const friendIds = await getAcceptedFriendIds(user.id);
      userIds = [...friendIds, user.id];

      if (userIds.length === 0) {
        return NextResponse.json({ entries: [] });
      }
    }

    const stats = await prisma.userModeStats.findMany({
      where: {
        gameMode: mode,
        gamesPlayed: { gt: 0 },
        ...(userIds ? { userId: { in: userIds } } : {}),
        user: { usernameSet: true },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ bestScore: "desc" }, { totalScore: "desc" }],
      take: 50,
    });

    const entries = stats.map((stat, index) => ({
      rank: index + 1,
      userId: stat.user.id,
      username: stat.user.username,
      displayName: stat.user.displayName,
      avatarUrl: stat.user.avatarUrl,
      gamesPlayed: stat.gamesPlayed,
      wins: stat.wins,
      totalScore: stat.totalScore,
      bestScore: stat.bestScore,
    }));

    return NextResponse.json({ entries, mode, scope });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao carregar ranking" },
      { status: 500 }
    );
  }
}
