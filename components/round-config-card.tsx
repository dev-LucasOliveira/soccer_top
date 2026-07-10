"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSITIONS, NATIONALITIES } from "@/lib/constants";
import type { Position, RoundConfig } from "@/lib/types";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export function RoundConfigCard({
  round,
  index,
  total,
  onChange,
  onRemove,
  canRemove,
}: {
  round: RoundConfig;
  index: number;
  total: number;
  onChange: (round: RoundConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const filters = round.filters ?? {};

  function togglePosition(pos: Position) {
    const current = filters.positions ?? [];
    const next = current.includes(pos)
      ? current.filter((p) => p !== pos)
      : [...current, pos];
    onChange({
      ...round,
      filters: { ...filters, positions: next.length ? next : undefined },
    });
  }

  function toggleNationality(nat: string) {
    const current = filters.nationalities ?? [];
    const next = current.includes(nat)
      ? current.filter((n) => n !== nat)
      : [...current, nat];
    onChange({
      ...round,
      filters: { ...filters, nationalities: next.length ? next : undefined },
    });
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="gold" className="mb-2">
            Round {index + 1}/{total}
          </Badge>
          <h3 className="font-bold text-foreground">Configuração da rodada</h3>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tema da rodada</label>
        <Input
          value={round.title}
          onChange={(e) => onChange({ ...round, title: e.target.value })}
          placeholder="Ex: Melhores goleiros"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Top N</label>
        <Input
          type="number"
          min={1}
          max={50}
          value={round.topN}
          onChange={(e) =>
            onChange({ ...round, topN: parseInt(e.target.value) || 10 })
          }
          required
        />
      </div>

      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-1 text-sm font-medium text-gold hover:underline"
      >
        {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showFilters ? "Ocultar filtros" : "Configurar filtros (opcional)"}
      </button>

      {showFilters && (
        <div className="space-y-4 rounded-xl border-2 border-card-border bg-off-white-muted/60 p-4">
          <div>
            <p className="mb-2 text-sm font-medium">Posições</p>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => togglePosition(pos.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filters.positions?.includes(pos.value)
                      ? "bg-pitch text-off-white"
                      : "bg-off-white-muted text-foreground hover:bg-off-white"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Nacionalidades</p>
            <div className="flex flex-wrap gap-2">
              {NATIONALITIES.map((nat) => (
                <button
                  key={nat.value}
                  type="button"
                  onClick={() => toggleNationality(nat.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filters.nationalities?.includes(nat.value)
                      ? "bg-pitch text-off-white"
                      : "bg-off-white-muted text-foreground hover:bg-off-white"
                  }`}
                >
                  {nat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Época início</label>
              <Input
                type="number"
                placeholder="Ex: 1990"
                value={filters.eraStart ?? ""}
                onChange={(e) =>
                  onChange({
                    ...round,
                    filters: {
                      ...filters,
                      eraStart: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Época fim</label>
              <Input
                type="number"
                placeholder="Ex: 2010"
                value={filters.eraEnd ?? ""}
                onChange={(e) =>
                  onChange({
                    ...round,
                    filters: {
                      ...filters,
                      eraEnd: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
