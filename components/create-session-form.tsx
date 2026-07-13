"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getOrCreateGuestToken } from "@/lib/guest";
import type { GameMode } from "@/lib/types";

export function CreateSessionForm({
  gameMode,
  submitLabel,
}: {
  gameMode: GameMode;
  submitLabel: string;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLoggedIn =
    status === "authenticated" &&
    Boolean(session?.user?.usernameSet && session.user.username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!isLoggedIn && !displayName.trim()) {
        throw new Error("Nome é obrigatório");
      }

      const guestToken = getOrCreateGuestToken();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: isLoggedIn ? undefined : displayName.trim(),
          guestToken,
          gameMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(`participant_${data.code}`, data.participantId);
      router.push(`/s/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar sala");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isLoggedIn ? (
          <p className="text-sm text-text-muted">
            Você cria a sala como{" "}
            <span className="text-foreground">@{session?.user?.username}</span>
          </p>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium">Seu nome</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como você quer aparecer"
              required
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
