"use client";

import { PICK_TIME_LIMIT_OPTIONS } from "@/lib/pick-time-limit";

export function PickTimeLimitSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        Tempo por palpite
      </label>
      <p className="mb-2 text-xs text-text-muted">
        Limite para cada jogador chutar na sua vez. Escolha &quot;Sem limite&quot; para
        jogar sem cronômetro.
      </p>
      <select
        value={value ?? ""}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? null : Number(next));
        }}
        className="w-full rounded-lg border border-card-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
      >
        {PICK_TIME_LIMIT_OPTIONS.map((option) => (
          <option
            key={option.label}
            value={option.value ?? ""}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
