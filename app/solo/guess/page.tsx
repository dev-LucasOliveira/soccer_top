"use client";

import Link from "next/link";
import { SoloGuessHub } from "@/components/solo-guess-hub";

export default function SoloGuessPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl text-off-white sm:text-3xl">
          Adivinhe o Top
        </h1>
        <p className="mt-2 text-sm text-on-pitch-muted">
          5 jogadores secretos por tema — use as dicas de clube para descobrir antes de acabar seus erros.
        </p>
      </div>

      <div className="glass-dark rounded-2xl px-5 py-5">
        <SoloGuessHub />
      </div>
    </main>
  );
}
