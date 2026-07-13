import { prisma } from "@/lib/db";
import { LEADERBOARD_MODES } from "@/lib/stats-game-modes";

export type PublicUserProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  modeStats: {
    gameMode: string;
    label: string;
    gamesPlayed: number;
    wins: number;
    totalScore: number;
    bestScore: number | null;
  }[];
  recentMatches: {
    id: string;
    gameMode: string;
    label: string;
    score: number;
    placement: number | null;
    playedAt: Date;
  }[];
};

function modeLabel(gameMode: string): string {
  return LEADERBOARD_MODES.find((mode) => mode.id === gameMode)?.label ?? gameMode;
}

export async function getUserProfileByUsername(
  username: string
): Promise<PublicUserProfile | null> {
  const user = await prisma.appUser.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      modeStats: { orderBy: { totalScore: "desc" } },
      matchRecords: {
        orderBy: { playedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user || !user.usernameSet) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    modeStats: user.modeStats.map((stat) => ({
      gameMode: stat.gameMode,
      label: modeLabel(stat.gameMode),
      gamesPlayed: stat.gamesPlayed,
      wins: stat.wins,
      totalScore: stat.totalScore,
      bestScore: stat.bestScore,
    })),
    recentMatches: user.matchRecords.map((match) => ({
      id: match.id,
      gameMode: match.gameMode,
      label: modeLabel(match.gameMode),
      score: match.score,
      placement: match.placement,
      playedAt: match.playedAt,
    })),
  };
}

export async function getOwnUserProfile(userId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    include: {
      modeStats: { orderBy: { totalScore: "desc" } },
      matchRecords: {
        orderBy: { playedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    usernameSet: user.usernameSet,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
    modeStats: user.modeStats.map((stat) => ({
      gameMode: stat.gameMode,
      label: modeLabel(stat.gameMode),
      gamesPlayed: stat.gamesPlayed,
      wins: stat.wins,
      totalScore: stat.totalScore,
      bestScore: stat.bestScore,
    })),
    recentMatches: user.matchRecords.map((match) => ({
      id: match.id,
      gameMode: match.gameMode,
      label: modeLabel(match.gameMode),
      score: match.score,
      placement: match.placement,
      playedAt: match.playedAt,
      metadata: match.metadata,
    })),
  };
}
