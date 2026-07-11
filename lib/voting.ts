import type { ListAliases } from "./types";

type ParticipantForAlias = {
  id: string;
  joinedAt: Date;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateListAliases(
  participants: ParticipantForAlias[]
): ListAliases {
  const ordered = shuffle(participants);

  const aliases: ListAliases = {};
  ordered.forEach((p, index) => {
    aliases[p.id] = `lista-${index + 1}`;
  });

  return aliases;
}

export function parseListAliases(raw: string | null): ListAliases {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ListAliases;
  } catch {
    return {};
  }
}

export function aliasToParticipantId(
  aliases: ListAliases,
  alias: string
): string | null {
  const entry = Object.entries(aliases).find(([, a]) => a === alias);
  return entry ? entry[0] : null;
}

export function participantIdToAlias(
  aliases: ListAliases,
  participantId: string
): string | null {
  return aliases[participantId] ?? null;
}

export function formatListLabel(alias: string): string {
  const match = alias.match(/^lista-(\d+)$/);
  if (match) return `Lista ${match[1]}`;
  return alias;
}
