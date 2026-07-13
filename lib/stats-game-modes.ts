export const STATS_GAME_MODES = {
  RANKING: "ranking",
  IMPOSTOR: "impostor",
  DUELO: "duelo",
  LISTA_SECRETA_MP: "lista-secreta-mp",
  GUESS_TOP: "guess-top",
  UM_SO: "um-so",
} as const;

export type StatsGameMode =
  (typeof STATS_GAME_MODES)[keyof typeof STATS_GAME_MODES];

export const LEADERBOARD_MODES: { id: StatsGameMode; label: string }[] = [
  { id: STATS_GAME_MODES.RANKING, label: "Tradicional" },
  { id: STATS_GAME_MODES.IMPOSTOR, label: "Impostor" },
  { id: STATS_GAME_MODES.DUELO, label: "Duelo" },
  { id: STATS_GAME_MODES.LISTA_SECRETA_MP, label: "Lista Secreta 1v1" },
  { id: STATS_GAME_MODES.GUESS_TOP, label: "Lista Secreta" },
  { id: STATS_GAME_MODES.UM_SO, label: "Um Só" },
];
