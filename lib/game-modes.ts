import type { GameMode } from "@/lib/types";

export type HomeModeId = "tradicional" | "impostor" | "solo";

export type GameModeIconId = "trophy" | "eye" | "user";

export type GameModeConfig = {
  id: HomeModeId;
  label: string;
  cardDescription: string;
  panelDescription: string;
  hint: string;
  submitLabel: string;
  icon: GameModeIconId;
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
    sessionGameMode: "impostor",
  },
  {
    id: "solo",
    label: "Solo",
    cardDescription: "Monte seu Top N sozinho e exporte uma imagem.",
    panelDescription:
      "Sem sala, sem votação — só você, um tema livre, filtros opcionais e um ranking personalizado para compartilhar no grupo.",
    hint: "Leva menos de um minuto para começar.",
    submitLabel: "Começar meu ranking",
    icon: "user",
  },
];

export const DEFAULT_HOME_MODE: HomeModeId = "tradicional";

export function getGameModeConfig(id: HomeModeId): GameModeConfig {
  const config = GAME_MODES.find((mode) => mode.id === id);
  return config ?? GAME_MODES[0];
}

export function parseHomeModeParam(value: string | null): HomeModeId | null {
  if (value === "tradicional" || value === "impostor" || value === "solo") {
    return value;
  }
  return null;
}
