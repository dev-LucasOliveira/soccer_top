"use client";

import { PICK_TIME_LIMIT_OPTIONS } from "@/lib/pick-time-limit";

export function PickTimeLimitSelect({
  value,
  onChange,
  options = PICK_TIME_LIMIT_OPTIONS,
  label = "Tempo por palpite",
  description = 'Limite para cada jogador chutar na sua vez. Escolha "Sem limite" para jogar sem cronômetro.',
  readOnly = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  options?: Array<{ value: number | null; label: string }>;
  label?: string;
  description?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </label>
      <p className="mb-2 text-xs text-text-muted">{description}</p>
      <select
        value={value ?? ""}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? null : Number(next));
        }}
        disabled={readOnly}
        className="w-full rounded-lg border border-card-border bg-surface-elevated px-3 py-2 text-sm text-foreground disabled:opacity-60"
      >
        {options.map((option) => (
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
