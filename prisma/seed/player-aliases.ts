import { playerKey } from "./player-utils";

export type PlayerAliasRule = {
  /** Nome alternativo que não deve existir no catálogo final */
  aliasName: string;
  /** Nome único usado no jogo, pools e busca */
  canonicalName: string;
};

/**
 * Mesma pessoa com nomes diferentes na planilha/enrichment.
 * O merge ignora aliases quando o canônico já existe e remove sobras no final.
 */
export const PLAYER_ALIAS_RULES: PlayerAliasRule[] = [
  { aliasName: "Gabriel Barbosa", canonicalName: "Gabigol" },
  { aliasName: "Ronaldinho", canonicalName: "Ronaldinho Gaúcho" },
  { aliasName: "Diego Ribas da Cunha", canonicalName: "Diego Ribas" },
  { aliasName: "Renato Portaluppi", canonicalName: "Renato Gaúcho" },
  { aliasName: "Ademir Menezes", canonicalName: "Ademir de Menezes" },
  // Planilha criou entrada lixo "Seedorf" (Palmeiras 2010); o canônico é Clarence Seedorf
  { aliasName: "Seedorf", canonicalName: "Clarence Seedorf" },
];

const aliasKeyToCanonical = new Map(
  PLAYER_ALIAS_RULES.map((rule) => [
    playerKey(rule.aliasName),
    rule.canonicalName,
  ])
);

const canonicalKeys = new Set(
  [...new Set(PLAYER_ALIAS_RULES.map((r) => r.canonicalName))].map((name) =>
    playerKey(name)
  )
);

export function getCanonicalNameForAliasKey(aliasKey: string): string | null {
  return aliasKeyToCanonical.get(aliasKey) ?? null;
}

export function isPlayerAliasKey(key: string): boolean {
  return aliasKeyToCanonical.has(key);
}

export function isCanonicalPlayerKey(key: string): boolean {
  return canonicalKeys.has(key);
}

export function getAliasNamesToPurge(): string[] {
  return PLAYER_ALIAS_RULES.map((rule) => rule.aliasName);
}

export function resolveCanonicalName(name: string): string {
  return aliasKeyToCanonical.get(playerKey(name)) ?? name;
}
