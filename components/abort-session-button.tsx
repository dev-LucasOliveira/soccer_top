"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getGuestToken } from "@/lib/guest";

export function AbortSessionButton({
  sessionCode,
  participantId,
  variant = "secondary",
  size = "lg",
  className,
  label = "Encerrar partida",
  confirmMessage = "Encerrar a partida agora? O progresso será perdido e todos voltam ao lobby.",
}: {
  sessionCode: string;
  participantId: string;
  variant?: "secondary" | "gold" | "primary" | "ghost" | "danger";
  size?: "lg" | "sm" | "md";
  className?: string;
  label?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAbort() {
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/return-to-lobby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/s/${sessionCode}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao encerrar partida");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        disabled={loading}
        onClick={handleAbort}
        className="w-full sm:w-auto"
      >
        {loading ? "Encerrando..." : label}
      </Button>
      {error && <p className="mt-2 text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
