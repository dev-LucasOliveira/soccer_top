import type { GameMode } from "@/lib/types";

export type HomeModeId = "tradicional" | "impostor" | "adivinhe" | "ranking";

export type GameModeIconId = "trophy" | "eye" | "target" | "list";

export type GameModePlayStyle = "multiplayer" | "solo";

export type GameModeConfig = {
  id: HomeModeId;
  label: string;
  cardDescription: string;
  panelDescription: string;
  hint: string;
  submitLabel: string;
  icon: GameModeIconId;
  playStyle: GameModePlayStyle;
  sessionGameMode?: GameMode;
};

export const GAME_MODES: GameModeConfig[] = [
  {
    id: "tradicional",
    label: "Tradicional",
    cardDescription:
      "Salas online com amigos — monte rankings, vote e compare no final.",
    panelDescription:
      "O clássico Ranking da Resenha: crie uma sala, configure rodadas com temas e filtros, cada um monta seu Top N e vocês votam na melhor lista. Ideal para grupos que querem debater critério.",
    hint: "Você configura as rodadas no lobby antes de iniciar.",
    submitLabel: "Criar sala",
    icon: "trophy",
    playStyle: "multiplayer",
    sessionGameMode: "ranking",
  },
  {
    id: "impostor",
    label: "Impostor",
    cardDescription:
      "Um jogador não sabe o tema — descubra quem está blefando.",
    panelDescription:
      "Todos completam a mesma lista Top 5, exceto o impostor, que não vê o assunto. A cada rodada vocês escolhem cartas, debatem e votam para eliminar o suspeito.",
    hint: "Escolha um tema pronto no lobby e reúna pelo menos 4 jogadores.",
    submitLabel: "Criar sala",
    icon: "eye",
    playStyle: "multiplayer",
    sessionGameMode: "impostor",
  },
  {
    id: "adivinhe",
    label: "Adivinhe o Top",
    cardDescription:
      "25 temas, 5 jogadores secretos por rodada, dicas de clube — 5 erros na sessão.",
    panelDescription:
      "Cada rodada sorteia um tema e 5 jogadores secretos de um pool curado. Cada carta mostra uma dica de clube e período — pesquise e descubra quem está na lista antes de esgotar seus erros.",
    hint: "Cada partida sorteia temas e jogadores diferentes.",
    submitLabel: "Jogar agora",
    icon: "target",
    playStyle: "solo",
  },
  {
    id: "ranking",
    label: "Ranking livre",
    cardDescription:
      "Monte seu Top N, filtre jogadores e exporte uma imagem.",
    panelDescription:
      "Crie um ranking personalizado com o tema e filtros que quiser, monte a lista na ordem que preferir e exporte uma imagem pronta para compartilhar.",
    hint: "Rascunho salvo neste navegador.",
    submitLabel: "Começar meu ranking",
    icon: "list",
    playStyle: "solo",
  },
];

export const DEFAULT_HOME_MODE: HomeModeId = "tradicional";

export function getGameModeConfig(id: HomeModeId): GameModeConfig {
  const config = GAME_MODES.find((mode) => mode.id === id);
  return config ?? GAME_MODES[0];
}

export function parseHomeModeParam(value: string | null): HomeModeId | null {
  if (value === "solo") return "adivinhe";
  if (
    value === "tradicional" ||
    value === "impostor" ||
    value === "adivinhe" ||
    value === "ranking"
  ) {
    return value;
  }
  return null;
}
