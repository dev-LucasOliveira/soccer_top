import type { ListAliases } from "./types";

type ParticipantForAlias = {
  id: string;
  joinedAt: Date;
};

export function generateListAliases(
  participants: ParticipantForAlias[]
): ListAliases {
  const sorted = [...participants].sort(
    (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
  );

  const aliases: ListAliases = {};
  sorted.forEach((p, index) => {
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
