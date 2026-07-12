"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { POSITIONS, NATIONALITIES } from "@/lib/constants";
import type { Position, SessionFilters } from "@/lib/types";
import { hasActiveFilters } from "@/lib/filters";

export function RoundFiltersSection({
  filters,
  onChange,
  readOnly = false,
  defaultOpen = false,
}: {
  filters: SessionFilters;
  onChange: (filters: SessionFilters) => void;
  readOnly?: boolean;
  defaultOpen?: boolean;
}) {
  const [showFilters, setShowFilters] = useState(
    defaultOpen || (readOnly && hasActiveFilters(filters))
  );

  function togglePosition(pos: Position) {
    if (readOnly) return;
    const current = filters.positions ?? [];
    const next = current.includes(pos)
      ? current.filter((p) => p !== pos)
      : [...current, pos];
    onChange({ ...filters, positions: next.length ? next : undefined });
  }

  function toggleNationality(nat: string) {
    if (readOnly) return;
    const current = filters.nationalities ?? [];
    const next = current.includes(nat)
      ? current.filter((n) => n !== nat)
      : [...current, nat];
    onChange({ ...filters, nationalities: next.length ? next : undefined });
  }

  if (
    readOnly &&
    !hasActiveFilters(filters)
  ) {
    return null;
  }

  return (
    <>
      {!readOnly && (
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-sm font-medium text-gold hover:underline"
        >
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showFilters ? "Ocultar filtros" : "Configurar filtros (opcional)"}
        </button>
      )}

      {(showFilters || readOnly) && (
        <div className="space-y-4 rounded-xl border-2 border-card-border bg-off-white-muted p-4">
          <div>
            <p className="mb-2 text-sm font-medium">Posições</p>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => togglePosition(pos.value)}
                  disabled={readOnly}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filters.positions?.includes(pos.value)
                      ? "bg-pitch text-off-white"
                      : "bg-off-white-muted text-foreground hover:bg-off-white-surface"
                  } ${readOnly ? "cursor-default opacity-100" : ""}`}
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
                  disabled={readOnly}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filters.nationalities?.includes(nat.value)
                      ? "bg-pitch text-off-white"
                      : "bg-off-white-muted text-foreground hover:bg-off-white-surface"
                  } ${readOnly ? "cursor-default opacity-100" : ""}`}
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
                    ...filters,
                    eraStart: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                disabled={readOnly}
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
                    ...filters,
                    eraEnd: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
