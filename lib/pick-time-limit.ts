export const PICK_TIME_LIMIT_OPTIONS: Array<{
  value: number | null;
  label: string;
}> = [
  { value: null, label: "Sem limite" },
  { value: 15, label: "15 segundos" },
  { value: 30, label: "30 segundos" },
  { value: 45, label: "45 segundos" },
  { value: 60, label: "60 segundos" },
];

const ALLOWED_LIMITS = new Set(
  PICK_TIME_LIMIT_OPTIONS.map((option) => option.value).filter(
    (value): value is number => value !== null
  )
);

export function validatePickTimeLimit(seconds: number | null | undefined): number | null {
  if (seconds === null || seconds === undefined) {
    return null;
  }

  if (!Number.isInteger(seconds) || !ALLOWED_LIMITS.has(seconds)) {
    throw new Error("Limite de tempo inválido");
  }

  return seconds;
}

export function getTurnDeadline(
  turnStartedAt: string | null | undefined,
  limitSeconds: number | null | undefined
): string | null {
  if (!turnStartedAt || !limitSeconds) {
    return null;
  }

  const startedAt = new Date(turnStartedAt).getTime();
  if (Number.isNaN(startedAt)) {
    return null;
  }

  return new Date(startedAt + limitSeconds * 1000).toISOString();
}

export function isTurnExpired(
  turnStartedAt: string | null | undefined,
  limitSeconds: number | null | undefined,
  nowMs: number = Date.now()
): boolean {
  const deadline = getTurnDeadline(turnStartedAt, limitSeconds);
  if (!deadline) {
    return false;
  }

  return nowMs >= new Date(deadline).getTime();
}

export function formatPickTimeLimit(seconds: number | null | undefined): string {
  if (!seconds) {
    return "Sem limite";
  }

  return `${seconds}s por palpite`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
