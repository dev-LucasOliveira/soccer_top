"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGuestToken } from "@/lib/guest";
import type { ImpostorThemeSummary } from "@/lib/types";

export function ImpostorThemePicker({
  code,
  participantId,
  selectedThemeId,
  onThemeSelected,
}: {
  code: string;
  participantId: string;
  selectedThemeId: string | null;
  onThemeSelected?: () => void;
}) {
  const [themes, setThemes] = useState<ImpostorThemeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/impostor/themes")
      .then((res) => res.json())
      .then((data) => {
        setThemes(data.themes ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSelect(themeId: string) {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${code}/impostor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
          themeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onThemeSelected?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar tema");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-text-muted">Carregando temas...</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        Escolha o tema da partida. Todos verão o assunto — exceto o impostor.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {themes.map((theme) => {
          const selected = selectedThemeId === theme.id;
          return (
            <Card
              key={theme.id}
              className={`cursor-pointer p-4 transition-colors ${
                selected
                  ? "border-gold/50 bg-gold/10"
                  : "hover:border-card-border/80"
              }`}
            >
              <h3 className="font-display text-base text-foreground">
                {theme.title}
              </h3>
              <p className="mt-1 text-xs text-text-muted">{theme.description}</p>
              <Button
                type="button"
                variant={selected ? "gold" : "secondary"}
                size="sm"
                className="mt-3 w-full"
                disabled={saving}
                onClick={() => handleSelect(theme.id)}
              >
                {selected ? "Tema selecionado" : "Usar este tema"}
              </Button>
            </Card>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
