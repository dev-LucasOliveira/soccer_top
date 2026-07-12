import { IMPOSTOR_THEMES } from "../../lib/impostor-themes";
import players from "./players.json";

const playerNames = new Set(players.map((player: { name: string }) => player.name));

for (const theme of IMPOSTOR_THEMES) {
  const names = [
    ...theme.seededPicks.map((pick: { playerName: string }) => pick.playerName),
    ...theme.pool,
  ];
  const missing = names.filter((name) => !playerNames.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Tema "${theme.id}" referencia jogadores ausentes: ${missing.join(", ")}`
    );
  }
}

console.log(`Validados ${IMPOSTOR_THEMES.length} temas do modo impostor.`);
