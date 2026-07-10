import { writeFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import { mapNationalityToIso } from "../../lib/nationality-codes";
import { parseEra, playerKey } from "./player-utils";

export type SpreadsheetPlayer = {
  key: string;
  name: string;
  nationalityPt: string;
  nationality: string;
  era: string;
  careerStart: number;
  careerEnd: number;
  leagues: string[];
  category: string;
};

const LEAGUE_SHEETS = [
  "Inglaterra",
  "Espanha",
  "Itália",
  "Alemanha",
  "França",
  "Brasil",
];

export function importSpreadsheet(
  xlsxPath = join(__dirname, "source", "top_200_jogadores.xlsx")
): SpreadsheetPlayer[] {
  const workbook = XLSX.readFile(xlsxPath);
  const byKey = new Map<string, SpreadsheetPlayer>();

  for (const league of LEAGUE_SHEETS) {
    const sheet = workbook.Sheets[league];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: "",
    });

    for (const row of rows) {
      const name = (row.Jogador ?? row.jogador ?? "").trim();
      if (!name) continue;

      const nationalityPt = (row.Nacionalidade ?? row.nacionalidade ?? "").trim();
      const era = (row["Época aproximada"] ?? row["Epoca aproximada"] ?? "").trim();
      const category = (row.Categoria ?? row.categoria ?? "").trim();
      const key = playerKey(name);
      const { careerStart, careerEnd } = parseEra(era);

      const existing = byKey.get(key);
      if (existing) {
        if (!existing.leagues.includes(league)) {
          existing.leagues.push(league);
        }
        continue;
      }

      byKey.set(key, {
        key,
        name,
        nationalityPt,
        nationality: mapNationalityToIso(nationalityPt),
        era,
        careerStart,
        careerEnd,
        leagues: [league],
        category,
      });
    }
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

if (require.main === module) {
  const players = importSpreadsheet();
  const outPath = join(__dirname, "spreadsheet-players.json");
  writeFileSync(outPath, JSON.stringify(players, null, 2) + "\n");
  console.log(`Imported ${players.length} unique players -> ${outPath}`);
}
