"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SoloPlayerPicker } from "@/components/solo-player-picker";
import { isSoloSetupComplete, loadSoloDraft } from "@/lib/solo-draft";
import type { SoloDraft } from "@/lib/types";

export default function SoloBuildPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SoloDraft | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadSoloDraft();
    if (!isSoloSetupComplete(loaded)) {
      router.replace("/solo");
      return;
    }
    setDraft(loaded);
    setReady(true);
  }, [router]);

  if (!ready || !draft) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/solo"
        className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors duration-200 hover:text-off-white"
      >
        ← Voltar ao setup
      </Link>

      <p className="mb-4 text-xs text-on-pitch-muted">
        Rascunho salvo neste navegador
      </p>

      <SoloPlayerPicker draft={draft} />
    </main>
  );
}
