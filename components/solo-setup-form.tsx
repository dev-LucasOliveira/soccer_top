"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RoundFiltersSection } from "@/components/round-filters-section";
import {
  createEmptySoloDraft,
  loadSoloDraft,
  saveSoloDraft,
  soloSetupMatches,
  validateSoloSetup,
} from "@/lib/solo-draft";
import type { SessionFilters } from "@/lib/types";

export function SoloSetupForm() {
  const router = useRouter();
  const existing = loadSoloDraft();

  const [authorName, setAuthorName] = useState(existing?.authorName ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [topN, setTopN] = useState(existing?.topN ?? 10);
  const [filters, setFilters] = useState<SessionFilters>(existing?.filters ?? {});
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const setupError = validateSoloSetup({ authorName, title, topN });
    if (setupError) {
      setError(setupError);
      return;
    }

    try {
      const draft = createEmptySoloDraft({ authorName, title, topN, filters });
      const previous = loadSoloDraft();

      if (previous && soloSetupMatches(previous, draft)) {
        saveSoloDraft({
          ...previous,
          authorName: draft.authorName,
          title: draft.title,
          topN: draft.topN,
          filters: draft.filters,
        });
      } else {
        saveSoloDraft(draft);
      }

      router.push("/solo/build");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar rascunho");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Seu nome</label>
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Como você quer aparecer no ranking"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tema do ranking</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Melhores atacantes brasileiros"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Top de quantos?</label>
          <Input
            type="number"
            min={1}
            max={50}
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            required
          />
          <p className="mt-1 text-xs text-text-muted">Entre 1 e 50 jogadores</p>
        </div>

        <RoundFiltersSection filters={filters} onChange={setFilters} />

        <p className="text-xs text-text-muted">
          Rascunho salvo neste navegador. Você monta a lista e exporta quando
          quiser.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full">
          Montar ranking
        </Button>
      </form>
    </Card>
  );
}
