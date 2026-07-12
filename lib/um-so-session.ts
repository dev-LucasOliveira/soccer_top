import { createHmac, timingSafeEqual } from "crypto";

const SESSION_TTL_MS = 1000 * 60 * 60 * 4;

export type UmSoSessionState = {
  score: number;
  streak: number;
  bestStreak: number;
  roundsCompleted: number;
  challengeId: string;
  secretPlayerId: string;
  hintsRevealed: number;
  attemptedPlayerIds: string[];
  createdAt: number;
};

export type UmSoClientSession = {
  sessionToken: string;
  score: number;
  streak: number;
  bestStreak: number;
  roundsCompleted: number;
  hintsRevealed: number;
  attemptedPlayerIds: string[];
  gameOver: boolean;
  reason?: "failed";
};

function getSessionSecret(): string {
  return (
    process.env.UM_SO_SESSION_SECRET ??
    process.env.GUESS_TOP_SESSION_SECRET ??
    process.env.DATABASE_URL ??
    "um-so-dev-secret"
  );
}

function signPayload(encoded: string): string {
  return createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
}

function encodeSession(state: UmSoSessionState): string {
  const encoded = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

export function decodeUmSoSession(token: string): UmSoSessionState | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const state = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as UmSoSessionState;

    if (Date.now() - state.createdAt > SESSION_TTL_MS) return null;
    if (
      typeof state.score !== "number" ||
      typeof state.streak !== "number" ||
      typeof state.bestStreak !== "number" ||
      typeof state.roundsCompleted !== "number" ||
      typeof state.challengeId !== "string" ||
      typeof state.secretPlayerId !== "string" ||
      typeof state.hintsRevealed !== "number" ||
      !Array.isArray(state.attemptedPlayerIds)
    ) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function createUmSoSession(
  challengeId: string,
  secretPlayerId: string
): { token: string; state: UmSoSessionState } {
  const state: UmSoSessionState = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    roundsCompleted: 0,
    challengeId,
    secretPlayerId,
    hintsRevealed: 0,
    attemptedPlayerIds: [],
    createdAt: Date.now(),
  };

  return { token: encodeSession(state), state };
}

export type UmSoPickResult =
  | {
      kind: "duplicate";
      state: UmSoSessionState;
      token: string;
    }
  | {
      kind: "wrong";
      state: UmSoSessionState;
      token: string;
      hintsRevealed: number;
      revealedNewHint: boolean;
      gameOver: boolean;
      reason?: "failed";
    }
  | {
      kind: "correct";
      state: UmSoSessionState;
      token: string;
      hintsUsed: number;
      roundPoints: number;
      streak: number;
      nextChallengeId?: string;
      nextSecretPlayerId?: string;
    };

export function applyUmSoPick(
  state: UmSoSessionState,
  playerId: string,
  isCorrect: boolean,
  roundPoints: number,
  totalHints: number,
  nextRound?: { challengeId: string; secretPlayerId: string }
): UmSoPickResult {
  if (state.attemptedPlayerIds.includes(playerId)) {
    return { kind: "duplicate", state, token: encodeSession(state) };
  }

  const nextAttempted = [...state.attemptedPlayerIds, playerId];

  if (!isCorrect) {
    if (state.hintsRevealed >= totalHints) {
      return {
        kind: "wrong",
        state: { ...state, attemptedPlayerIds: nextAttempted },
        token: encodeSession({ ...state, attemptedPlayerIds: nextAttempted }),
        hintsRevealed: state.hintsRevealed,
        revealedNewHint: false,
        gameOver: true,
        reason: "failed",
      };
    }

    const nextHintsRevealed = state.hintsRevealed + 1;
    const nextState: UmSoSessionState = {
      ...state,
      hintsRevealed: nextHintsRevealed,
      attemptedPlayerIds: nextAttempted,
    };

    return {
      kind: "wrong",
      state: nextState,
      token: encodeSession(nextState),
      hintsRevealed: nextHintsRevealed,
      revealedNewHint: true,
      gameOver: false,
    };
  }

  const nextStreak = state.streak + 1;
  const nextBestStreak = Math.max(state.bestStreak, nextStreak);
  const hintsUsed = state.hintsRevealed;

  let nextState: UmSoSessionState = {
    ...state,
    score: state.score + roundPoints,
    streak: nextStreak,
    bestStreak: nextBestStreak,
    roundsCompleted: state.roundsCompleted + 1,
    attemptedPlayerIds: nextAttempted,
  };

  if (nextRound) {
    nextState = {
      ...nextState,
      challengeId: nextRound.challengeId,
      secretPlayerId: nextRound.secretPlayerId,
      hintsRevealed: 0,
      attemptedPlayerIds: [],
    };
  }

  return {
    kind: "correct",
    state: nextState,
    token: encodeSession(nextState),
    hintsUsed,
    roundPoints,
    streak: nextStreak,
    nextChallengeId: nextRound?.challengeId,
    nextSecretPlayerId: nextRound?.secretPlayerId,
  };
}

export const UM_SO_SESSION_STORAGE_KEY = "um-so-session";
export const UM_SO_BEST_STORAGE_KEY = "um-so-best";
export const UM_SO_RECAP_STORAGE_KEY = "um-so-recap";

export function loadUmSoBest(): import("@/lib/um-so-types").UmSoBestScore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UM_SO_BEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as import("@/lib/um-so-types").UmSoBestScore;
    if (typeof parsed.score !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUmSoBest(
  score: number,
  bestStreak: number
): import("@/lib/um-so-types").UmSoBestScore | null {
  if (typeof window === "undefined") return null;
  const current = loadUmSoBest();
  if (current && current.score >= score) return current;

  const next = {
    score,
    bestStreak: Math.max(bestStreak, current?.bestStreak ?? 0),
    date: new Date().toISOString(),
  };
  localStorage.setItem(UM_SO_BEST_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function saveUmSoClientSession(session: UmSoClientSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(UM_SO_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadUmSoClientSession(): UmSoClientSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(UM_SO_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UmSoClientSession;
  } catch {
    return null;
  }
}

export function clearUmSoClientSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(UM_SO_SESSION_STORAGE_KEY);
}

export function saveUmSoRecap(
  recap: import("@/lib/um-so-types").UmSoGameRecap
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(UM_SO_RECAP_STORAGE_KEY, JSON.stringify(recap));
}

export function loadUmSoRecap(): import("@/lib/um-so-types").UmSoGameRecap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(UM_SO_RECAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as import("@/lib/um-so-types").UmSoGameRecap;
    if (typeof parsed.score !== "number" || !Array.isArray(parsed.rounds)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearUmSoRecap(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(UM_SO_RECAP_STORAGE_KEY);
}
