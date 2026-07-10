"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionStatusView } from "@/components/session-status-view";

export default function StatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setCode(p.code);
      const stored = localStorage.getItem(`participant_${p.code}`);
      if (!stored) {
        router.push(`/s/${p.code}`);
        return;
      }
      setParticipantId(stored);
    });
  }, [params, router]);

  if (!code || !participantId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-off-white/70">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SessionStatusView code={code} participantId={participantId} />
    </main>
  );
}
