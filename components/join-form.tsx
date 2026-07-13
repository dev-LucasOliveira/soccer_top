"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getOrCreateGuestToken } from "@/lib/guest";
import { buildParticipantPath } from "@/lib/session-info";

export function JoinForm({ defaultCode }: { defaultCode?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [code, setCode] = useState(defaultCode ?? "");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isLoggedIn =
    status === "authenticated" &&
    Boolean(session?.user?.usernameSet && session.user.username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const sessionCode = code.trim().toLowerCase().replace(/.*\/s\//, "");
      const guestToken = getOrCreateGuestToken();

      if (!isLoggedIn && !displayName.trim()) {
        throw new Error("Nome é obrigatório");
      }

      const res = await fetch(`/api/sessions/${sessionCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: isLoggedIn ? undefined : displayName.trim(),
          guestToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(`participant_${sessionCode}`, data.participantId);

      if (data.isSpectator) {
        setNotice(
          data.sessionStatus === "completed"
            ? "Jogo encerrado — você entrou como espectador."
            : "Partida já começou — você entrou como espectador."
        );
      }

      const sessionRes = await fetch(
        `/api/sessions/${sessionCode}?participantId=${data.participantId}`
      );
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        router.push(`/s/${sessionCode}`);
        return;
      }

      router.push(
        buildParticipantPath(sessionCode, sessionData, data.participantId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Código da sala</label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: abc123 ou link completo"
            required
          />
        </div>

        {isLoggedIn ? (
          <p className="text-sm text-text-muted">
            Você entra como{" "}
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
        {notice && <p className="text-sm text-text-muted">{notice}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar na sala"}
        </Button>
      </form>
    </Card>
  );
}
