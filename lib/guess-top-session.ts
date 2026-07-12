import { createHmac, timingSafeEqual } from "crypto";
import {
  GUESS_TOP_MAX_ERRORS,
  shuffleChallengeIds,
} from "@/lib/guess-top-challenges";
import type { GuessTopGameRecap, RevealedSlot } from "@/lib/guess-top-types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 4;

export type GuessTopSessionState = {
  challengeOrder: string[];
  roundIndex: number;
  errorsUsed: number;
  topsCompleted: number;
  drawnPlayerIds: string[];
  revealedPlayerIds: string[];
  attemptedPlayerIds: string[];
  createdAt: number;
};

export type GuessTopClientSession = {
  sessionToken: string;
  challengeOrder: string[];
  roundIndex: number;
  errorsUsed: number;
  topsCompleted: number;
  revealedSlots: RevealedSlot[];
  attemptedPlayerIds: string[];
  gameOver: boolean;
  reason?: "errors" | "completed";
};

function getSessionSecret(): string {
  return (
    process.env.GUESS_TOP_SESSION_SECRET ??
    process.env.DATABASE_URL ??
    "guess-top-dev-secret"
  );
}

function signPayload(encoded: string): string {
  return createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
}

function encodeSession(state: GuessTopSessionState): string {
  const encoded = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

export function decodeSession(token: string): GuessTopSessionState | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const state = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as GuessTopSessionState;

    if (Date.now() - state.createdAt > SESSION_TTL_MS) return null;
    if (
      !Array.isArray(state.challengeOrder) ||
      typeof state.roundIndex !== "number" ||
      typeof state.errorsUsed !== "number" ||
      typeof state.topsCompleted !== "number" ||
      !Array.isArray(state.drawnPlayerIds) ||
      !Array.isArray(state.revealedPlayerIds) ||
      !Array.isArray(state.attemptedPlayerIds)
    ) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function createGuessTopSession(
  challengeIds: string[],
  initialDrawnPlayerIds: string[],
  challengeOrder?: string[]
): { token: string; state: GuessTopSessionState } {
  const state: GuessTopSessionState = {
    challengeOrder: challengeOrder ?? shuffleChallengeIds(challengeIds),
    roundIndex: 0,
    errorsUsed: 0,
    topsCompleted: 0,
    drawnPlayerIds: initialDrawnPlayerIds,
    revealedPlayerIds: [],
    attemptedPlayerIds: [],
    createdAt: Date.now(),
  };

  return { token: encodeSession(state), state };
}

export function getCurrentChallengeId(state: GuessTopSessionState): string | null {
  return state.challengeOrder[state.roundIndex] ?? null;
}

export function isSessionGameOver(state: GuessTopSessionState): {
  gameOver: boolean;
  reason?: "errors" | "completed";
} {
  if (state.errorsUsed >= GUESS_TOP_MAX_ERRORS) {
    return { gameOver: true, reason: "errors" };
  }
  if (state.roundIndex >= state.challengeOrder.length) {
    return { gameOver: true, reason: "completed" };
  }
  return { gameOver: false };
}

export function isRoundComplete(state: GuessTopSessionState): boolean {
  return state.revealedPlayerIds.length >= 5;
}

export type PickResult =
  | {
      kind: "duplicate";
      state: GuessTopSessionState;
      token: string;
    }
  | {
      kind: "correct";
      state: GuessTopSessionState;
      token: string;
      revealed: RevealedSlot;
      roundComplete: boolean;
      topsCompleted: number;
      gameOver: boolean;
      reason?: "errors" | "completed";
    }
  | {
      kind: "wrong";
      state: GuessTopSessionState;
      token: string;
      errorsUsed: number;
      gameOver: boolean;
      reason?: "errors" | "completed";
    };

export function applyPick(
  state: GuessTopSessionState,
  playerId: string,
  revealed: RevealedSlot | null,
  nextDrawnPlayerIds?: string[]
): PickResult {
  const token = encodeSession(state);

  if (
    state.attemptedPlayerIds.includes(playerId) ||
    state.revealedPlayerIds.includes(playerId)
  ) {
    return { kind: "duplicate", state, token };
  }

  const nextAttempted = [...state.attemptedPlayerIds, playerId];

  if (!revealed) {
    const nextState: GuessTopSessionState = {
      ...state,
      errorsUsed: state.errorsUsed + 1,
      attemptedPlayerIds: nextAttempted,
    };
    const over = isSessionGameOver(nextState);
    return {
      kind: "wrong",
      state: nextState,
      token: encodeSession(nextState),
      errorsUsed: nextState.errorsUsed,
      gameOver: over.gameOver,
      reason: over.reason,
    };
  }

  const nextRevealed = [...state.revealedPlayerIds, playerId];
  const roundComplete = nextRevealed.length >= 5;

  let nextState: GuessTopSessionState = {
    ...state,
    revealedPlayerIds: nextRevealed,
    attemptedPlayerIds: nextAttempted,
  };

  if (roundComplete) {
    nextState = {
      ...nextState,
      topsCompleted: nextState.topsCompleted + 1,
      roundIndex: nextState.roundIndex + 1,
      drawnPlayerIds: nextDrawnPlayerIds ?? [],
      revealedPlayerIds: [],
      attemptedPlayerIds: [],
    };
  }

  const over = isSessionGameOver(nextState);

  return {
    kind: "correct",
    state: nextState,
    token: encodeSession(nextState),
    revealed,
    roundComplete,
    topsCompleted: nextState.topsCompleted,
    gameOver: over.gameOver,
    reason: over.reason,
  };
}

export const GUESS_TOP_SESSION_STORAGE_KEY = "guess-top-session";
export const GUESS_TOP_BEST_STORAGE_KEY = "guess-top-best";
export const GUESS_TOP_RECAP_STORAGE_KEY = "guess-top-recap";

export type GuessTopBestScore = {
  topsCompleted: number;
  date: string;
};

export function loadGuessTopBest(): GuessTopBestScore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUESS_TOP_BEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuessTopBestScore;
    if (typeof parsed.topsCompleted !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGuessTopBest(topsCompleted: number): GuessTopBestScore | null {
  if (typeof window === "undefined") return null;
  const current = loadGuessTopBest();
  if (current && current.topsCompleted >= topsCompleted) return current;

  const next: GuessTopBestScore = {
    topsCompleted,
    date: new Date().toISOString(),
  };
  localStorage.setItem(GUESS_TOP_BEST_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function saveGuessTopClientSession(session: GuessTopClientSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GUESS_TOP_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadGuessTopClientSession(): GuessTopClientSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GUESS_TOP_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuessTopClientSession;
  } catch {
    return null;
  }
}

export function clearGuessTopClientSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GUESS_TOP_SESSION_STORAGE_KEY);
}

export function saveGuessTopRecap(recap: GuessTopGameRecap): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GUESS_TOP_RECAP_STORAGE_KEY, JSON.stringify(recap));
}

export function loadGuessTopRecap(): GuessTopGameRecap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GUESS_TOP_RECAP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuessTopGameRecap;
    if (
      typeof parsed.topsCompleted !== "number" ||
      typeof parsed.errorsUsed !== "number" ||
      !Array.isArray(parsed.rounds)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearGuessTopRecap(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GUESS_TOP_RECAP_STORAGE_KEY);
}
