import { writeFileSync } from "fs";
import { join } from "path";
import { mergePlayers, summarizePlayers } from "./merge-players";
import { loadAllCorrections } from "./corrections/load-corrections";

const OUTPUT_PATH = join(__dirname, "players.json");

function main() {
  const corrections = loadAllCorrections();
  console.log(`Carregadas ${corrections.length} correções`);

  const players = mergePlayers();
  const summary = summarizePlayers(players);

  writeFileSync(OUTPUT_PATH, JSON.stringify(players, null, 2) + "\n");
  console.log(`players.json atualizado: ${summary.total} jogadores`);
  console.log("Por posição:", summary.byPosition);
}

main();
