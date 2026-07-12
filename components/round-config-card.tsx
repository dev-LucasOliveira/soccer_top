"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoundFiltersSection } from "@/components/round-filters-section";
import type { RoundConfig } from "@/lib/types";
import { Trash2 } from "lucide-react";

export function RoundConfigCard({
  round,
  index,
  total,
  onChange,
  onRemove,
  canRemove,
  readOnly = false,
}: {
  round: RoundConfig;
  index: number;
  total: number;
  onChange: (round: RoundConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
  readOnly?: boolean;
}) {
  const filters = round.filters ?? {};

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="gold" className="mb-2">
            Rodada {index + 1}/{total}
          </Badge>
          <h3 className="font-bold text-foreground">Configuração da rodada</h3>
        </div>
        {canRemove && !readOnly && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:border-red-300 hover:bg-red-50"
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
          disabled={readOnly}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Top de N</label>
        <Input
          type="number"
          min={1}
          max={50}
          value={round.topN}
          onChange={(e) =>
            onChange({ ...round, topN: parseInt(e.target.value) || 10 })
          }
          required
          disabled={readOnly}
        />
      </div>

      <RoundFiltersSection
        filters={filters}
        onChange={(next) => onChange({ ...round, filters: next })}
        readOnly={readOnly}
      />
    </Card>
  );
}
