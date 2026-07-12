import { validateUmSoHintLadders } from "@/lib/um-so-hints-validate";

async function main() {
  const result = await validateUmSoHintLadders();

  if (!result.ok) {
    console.error("Validação de dicas Um Só falhou:\n");
    for (const issue of result.issues) {
      console.error(
        `  - ${issue.challengeId} / ${issue.playerName}: ${issue.hintCount} dicas (mínimo 4)`
      );
    }
    process.exit(1);
  }

  console.log("Todas as escadas Um Só têm pelo menos 4 dicas úteis.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
