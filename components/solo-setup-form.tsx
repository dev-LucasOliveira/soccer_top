"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { getSoloDisplayName } from "@/lib/solo-profile";
import type { SessionFilters } from "@/lib/types";

export function SoloSetupForm({ submitLabel = "Montar ranking" }: { submitLabel?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const existing = loadSoloDraft();

  const isLoggedIn =
    status === "authenticated" &&
    Boolean(session?.user?.usernameSet && session.user.username);

  const [authorName, setAuthorName] = useState(
    existing?.authorName ?? getSoloDisplayName() ?? ""
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [topN, setTopN] = useState(existing?.topN ?? 10);
  const [filters, setFilters] = useState<SessionFilters>(existing?.filters ?? {});
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn && session?.user?.username) {
      setAuthorName(session.user.username);
    }
  }, [isLoggedIn, session?.user?.username]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const resolvedAuthor = isLoggedIn
      ? session?.user?.username ?? authorName
      : authorName;

    const setupError = validateSoloSetup({
      authorName: resolvedAuthor,
      title,
      topN,
    });
    if (setupError) {
      setError(setupError);
      return;
    }

    try {
      const draft = createEmptySoloDraft({
        authorName: resolvedAuthor,
        title,
        topN,
        filters,
      });
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
        {isLoggedIn ? (
          <p className="text-sm text-text-muted">
            Ranking como{" "}
            <span className="text-foreground">@{session?.user?.username}</span>
          </p>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium">Seu nome</label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Como você quer aparecer no ranking"
              required
            />
          </div>
        )}

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
          {submitLabel}
        </Button>
      </form>
    </Card>
  );
}
