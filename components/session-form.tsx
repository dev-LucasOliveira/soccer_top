"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RoundConfigCard } from "@/components/round-config-card";
import { PODIUM_POINTS_TABLE } from "@/lib/points";
import { getOrCreateGuestToken } from "@/lib/guest";
import type { RoundConfig } from "@/lib/types";
import { Plus } from "lucide-react";

const DEFAULT_ROUND: RoundConfig = {
  title: "",
  topN: 10,
  filters: {},
};

export function SessionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rounds, setRounds] = useState<RoundConfig[]>([
    { ...DEFAULT_ROUND, title: "Round 1" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const guestToken = getOrCreateGuestToken();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          displayName,
          guestToken,
          rounds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(`participant_${data.code}`, data.participantId);
      router.push(`/s/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar session");
    } finally {
      setLoading(false);
    }
  }

  function updateRound(index: number, round: RoundConfig) {
    setRounds(rounds.map((r, i) => (i === index ? round : r)));
  }

  function addRound() {
    if (rounds.length >= 10) return;
    setRounds([
      ...rounds,
      { ...DEFAULT_ROUND, title: `Round ${rounds.length + 1}` },
    ]);
  }

  function removeRound(index: number) {
    if (rounds.length <= 1) return;
    setRounds(rounds.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Seu nome</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Como você quer aparecer"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Título da session
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Copa dos Amigos"
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Rounds ({rounds.length})
            </p>
            {rounds.length < 10 && (
              <Button type="button" variant="ghost" size="sm" onClick={addRound}>
                <Plus size={16} />
                Adicionar round
              </Button>
            )}
          </div>

          {rounds.map((round, index) => (
            <RoundConfigCard
              key={index}
              round={round}
              index={index}
              total={rounds.length}
              onChange={(r) => updateRound(index, r)}
              onRemove={() => removeRound(index)}
              canRemove={rounds.length > 1}
            />
          ))}
        </div>

        <Card className="bg-off-white-muted/60">
          <p className="mb-2 text-sm font-medium text-foreground">
            Pontuação do pódio (fixa)
          </p>
          <p className="text-xs text-text-muted">
            A cada round, só o top 3 no ranking de votos pontua. Os pontos
            acumulam entre rounds.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PODIUM_POINTS_TABLE.map((pts, i) => (
              <span
                key={i}
                className="rounded-full bg-pitch/10 px-2 py-0.5 text-xs font-medium text-foreground"
              >
                P{i + 1}: {pts}pts
              </span>
            ))}
            <span className="rounded-full bg-pitch/10 px-2 py-0.5 text-xs font-medium text-text-muted">
              P4+: 0pts
            </span>
          </div>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando..." : "Criar session"}
        </Button>
      </form>
    </Card>
  );
}
