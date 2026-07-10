"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SessionLobby } from "@/components/session-lobby";
import { JoinForm } from "@/components/join-form";
import { getOrCreateGuestToken } from "@/lib/guest";

export default function SessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [code, setCode] = useState<string>("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setCode(p.code);
      const stored = localStorage.getItem(`participant_${p.code}`);
      if (stored) {
        setParticipantId(stored);
      } else {
        getOrCreateGuestToken();
        setShowJoin(true);
      }
    });
  }, [params]);

  if (!code) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-center text-off-white/70">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {showJoin && !participantId ? (
        <>
          <Link
            href="/"
            className="mb-6 inline-block text-sm text-off-white/70 hover:text-off-white"
          >
            ← Voltar
          </Link>
          <div>
            <h2 className="mb-4 text-center text-lg font-bold text-off-white">
              Entrar na session
            </h2>
            <JoinForm defaultCode={code} />
          </div>
        </>
      ) : (
        <SessionLobby code={code} participantId={participantId} />
      )}
    </main>
  );
}
