import { APP_NAME } from "@/lib/branding";
import type { GameMode, PlayableGameMode } from "@/lib/types";

export type HomeModeId =
  | "tradicional"
  | "impostor"
  | "duelo"
  | "lista-secreta-1v1"
  | "lista-secreta"
  | "um-so"
  | "ranking";

export type GameModeIconId = "trophy" | "eye" | "target" | "list" | "sparkles" | "swords";

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
  landingPath: string;
  rules?: string[];
  sessionGameMode?: PlayableGameMode;
};

export const GAME_MODES: GameModeConfig[] = [
  {
    id: "tradicional",
    label: "Tradicional",
    cardDescription:
      "Salas online com amigos — monte rankings, vote e compare no final.",
    panelDescription:
      `O clássico ${APP_NAME}: crie uma sala, configure rodadas com temas e filtros, cada um monta seu Top N e vocês votam na melhor lista. Ideal para grupos que querem debater critério.`,
    hint: "Você configura as rodadas no lobby antes de iniciar.",
    submitLabel: "Criar sala",
    icon: "trophy",
    playStyle: "multiplayer",
    landingPath: "/tradicional",
    rules: [
      "Mínimo de 2 jogadores por sala",
      "Cada rodada tem tema, Top N e filtros definidos pelo criador",
      "Todos montam sua lista, depois votam na melhor",
      "Placar acumulado ao longo das rodadas",
    ],
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
    landingPath: "/impostor",
    rules: [
      "Mínimo de 4 jogadores",
      "Um jogador sorteado é o impostor — não vê o tema",
      "Escolham cartas, debatam e votem para eliminar o suspeito",
      "Tripulação vence se eliminar o impostor; impostor vence se sobreviver",
    ],
    sessionGameMode: "impostor",
  },
  {
    id: "duelo",
    label: "Duelo",
    cardDescription:
      "Um Só 1v1 online — turnos alternados, dicas compartilhadas, quem acerta leva a rodada.",
    panelDescription:
      "Dois jogadores, um jogador secreto por rodada. Por nível de dica: A chuta, depois B; se ambos erram, +1 dica e volta para A. Quem acerta primeiro ganha pontos. Errou com todas as dicas visíveis → fim de jogo.",
    hint: "Exatamente 2 jogadores — o criador define quantas rodadas valerão.",
    submitLabel: "Criar duelo",
    icon: "swords",
    playStyle: "multiplayer",
    landingPath: "/duelo",
    rules: [
      "Exatamente 2 jogadores por sala",
      "Turnos alternados por nível de dica",
      "Dicas compartilhadas — quem acerta primeiro leva a rodada",
      "Errou com todas as dicas visíveis → fim de jogo",
    ],
    sessionGameMode: "duelo",
  },
  {
    id: "lista-secreta-1v1",
    label: "Lista Secreta 1v1",
    cardDescription:
      "Mesma lista secreta para os dois — quem acertar pinta o slot com sua cor.",
    panelDescription:
      "Dois jogadores, mesma lista de jogadores secretos por rodada. Turnos alternados: chute, revele com sua cor se acertar. Quem descobrir mais itens vence a rodada.",
    hint: "Exatamente 2 jogadores — configure rodadas e quantos jogadores secretos por lista (3–10).",
    submitLabel: "Criar partida",
    icon: "target",
    playStyle: "multiplayer",
    landingPath: "/lista-secreta-mp",
    rules: [
      "Exatamente 2 jogadores por sala",
      "Mesma lista secreta com dicas de clube + período",
      "Turnos alternados — sem limite de erros",
      "Quem acertar pinta o slot; quem revelar mais ganha a rodada",
    ],
    sessionGameMode: "lista-secreta-mp",
  },
  {
    id: "lista-secreta",
    label: "Lista Secreta",
    cardDescription:
      "25 temas, 5 jogadores secretos por lista — descubra quem são pelas dicas de clube.",
    panelDescription:
      "Cada tema esconde 5 jogadores. As cartas mostram clube e período; pesquise, acerte e revele a lista antes de esgotar seus 5 erros.",
    hint: "Cada partida sorteia temas e jogadores diferentes.",
    submitLabel: "Jogar agora",
    icon: "target",
    playStyle: "solo",
    landingPath: "/solo/guess",
    rules: [
      "Cada tema sorteia 5 jogadores secretos de um pool curado",
      "Dica em cada carta: clube e período",
      "Acertou → revela o jogador; errou → +1 erro",
      "Complete os 5 de um tema para somar +1 no placar",
    ],
  },
  {
    id: "um-so",
    label: "Um Só",
    cardDescription:
      "Um jogador misterioso — chute à vontade e desbloqueie pistas a cada erro até a última.",
    panelDescription:
      "Um jogador secreto por rodada. O primeiro chute é só com o tema; cada erro revela a próxima dica contextual. Errou com todas as dicas visíveis → fim de jogo. Pontuação cai quanto mais dicas você usar.",
    hint: "Dicas adaptadas ao tema — sem repetir o que você já sabe.",
    submitLabel: "Jogar agora",
    icon: "sparkles",
    playStyle: "solo",
    landingPath: "/solo/um-so",
    rules: [
      "Chute à vontade sem dicas no início",
      "Cada erro revela a próxima pista contextual",
      "Errou com todas as dicas visíveis → fim de jogo",
      "Pontuação cai conforme mais dicas você precisar",
    ],
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
    landingPath: "/ranking",
    rules: [
      "Defina tema, Top N e filtros do catálogo",
      "Monte a lista na ordem que preferir",
      "Exporte uma imagem pronta para compartilhar",
      "Rascunho salvo neste navegador",
    ],
  },
];

export const DEFAULT_HOME_MODE: HomeModeId = "tradicional";

export function getGameModeConfig(id: HomeModeId): GameModeConfig {
  const config = GAME_MODES.find((mode) => mode.id === id);
  return config ?? GAME_MODES[0];
}

export function getGameModeByPath(path: string): GameModeConfig | null {
  return GAME_MODES.find((mode) => mode.landingPath === path) ?? null;
}

export function parseHomeModeParam(value: string | null): HomeModeId | null {
  if (value === "solo" || value === "adivinhe") return "lista-secreta";
  if (
    value === "tradicional" ||
    value === "impostor" ||
    value === "duelo" ||
    value === "lista-secreta-1v1" ||
    value === "lista-secreta" ||
    value === "um-so" ||
    value === "ranking"
  ) {
    return value;
  }
  return null;
}

export function getLandingPathForModeParam(value: string | null): string | null {
  const modeId = parseHomeModeParam(value);
  if (!modeId) return null;
  return getGameModeConfig(modeId).landingPath;
}

export function getMultiplayerGameModes(): GameModeConfig[] {
  return GAME_MODES.filter(
    (mode) => mode.playStyle === "multiplayer" && mode.sessionGameMode
  );
}

export function getSoloGameModes(): GameModeConfig[] {
  return GAME_MODES.filter((mode) => mode.playStyle === "solo");
}
