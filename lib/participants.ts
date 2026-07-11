export function isSpectator(participant: { status: string }): boolean {
  return participant.status === "spectator";
}

export function isPlayer(participant: { status: string }): boolean {
  return participant.status !== "spectator";
}

export function getPlayers<T extends { status: string }>(participants: T[]): T[] {
  return participants.filter(isPlayer);
}
