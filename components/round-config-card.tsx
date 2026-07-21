"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoundFiltersSection } from "@/components/round-filters-section";
import { PickTimeLimitSelect } from "@/components/pick-time-limit-select";
import { RANKING_ROUND_TIME_LIMIT_OPTIONS } from "@/lib/pick-time-limit";
import type { RoundConfig } from "@/lib/types";
import { Trash2 } from "lucide-react";

function clampTopN(value: number) {
  return Math.min(50, Math.max(1, value));
}

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
  const [topNDraft, setTopNDraft] = useState(String(round.topN));

  useEffect(() => {
    setTopNDraft(String(round.topN));
  }, [round.topN]);

  function commitTopN(raw: string) {
    if (raw === "") {
      setTopNDraft(String(round.topN));
      return;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setTopNDraft(String(round.topN));
      return;
    }

    const nextTopN = clampTopN(parsed);
    setTopNDraft(String(nextTopN));
    onChange({ ...round, topN: nextTopN });
  }

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
          value={topNDraft}
          onChange={(e) => {
            const raw = e.target.value;
            setTopNDraft(raw);
            if (raw === "") return;

            const parsed = Number.parseInt(raw, 10);
            if (!Number.isNaN(parsed)) {
              onChange({ ...round, topN: clampTopN(parsed) });
            }
          }}
          onBlur={() => commitTopN(topNDraft)}
          required
          disabled={readOnly}
        />
      </div>

      <RoundFiltersSection
        filters={filters}
        onChange={(next) => onChange({ ...round, filters: next })}
        readOnly={readOnly}
      />

      <PickTimeLimitSelect
        value={round.pickTimeLimitSeconds ?? null}
        onChange={(pickTimeLimitSeconds) =>
          onChange({ ...round, pickTimeLimitSeconds })
        }
        options={RANKING_ROUND_TIME_LIMIT_OPTIONS}
        label="Tempo para montar a lista"
        description='Quanto tempo cada jogador tem para montar o ranking desta rodada. Ao acabar, listas incompletas são enviadas automaticamente.'
        readOnly={readOnly}
      />
    </Card>
  );
}
