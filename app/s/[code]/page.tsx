"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SessionLobby } from "@/components/session-lobby";
import { JoinForm } from "@/components/join-form";
import { getOrCreateGuestToken } from "@/lib/guest";
import { buildParticipantPath } from "@/lib/session-info";

export default function SessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [checkingRoute, setCheckingRoute] = useState(true);

  useEffect(() => {
    params.then((p) => {
      setCode(p.code);
      const stored = localStorage.getItem(`participant_${p.code}`);
      if (stored) {
        setParticipantId(stored);
      } else {
        getOrCreateGuestToken();
        setShowJoin(true);
        setCheckingRoute(false);
      }
    });
  }, [params]);

  useEffect(() => {
    if (!code || !participantId) return;

    async function checkRoute() {
      try {
        const res = await fetch(
          `/api/sessions/${code}?participantId=${participantId}`
        );
        const data = await res.json();
        if (res.ok && data.status !== "setup") {
          const isCreator = data.creatorParticipantId === participantId;
          if (!isCreator) {
            router.replace(buildParticipantPath(code, data, participantId));
            return;
          }
        }
      } finally {
        setCheckingRoute(false);
      }
    }

    checkRoute();
  }, [code, participantId, router]);

  if (!code) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="loading-pulse text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  if (showJoin && !participantId) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors duration-200 hover:text-off-white"
        >
          ← Voltar
        </Link>
        <div>
          <h2 className="mb-4 text-center text-lg font-bold text-off-white">
            Entrar na sala
          </h2>
          <JoinForm defaultCode={code} />
        </div>
      </main>
    );
  }

  if (checkingRoute) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="loading-pulse text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <SessionLobby code={code} participantId={participantId} />
    </main>
  );
}
