import Link from "next/link";
import { SoloSetupForm } from "@/components/solo-setup-form";

export default function SoloSetupPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors duration-200 hover:text-off-white"
      >
        ← Voltar ao início
      </Link>

      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl text-off-white sm:text-3xl">
          Modo solo
        </h1>
        <p className="mt-2 text-sm text-on-pitch-muted">
          Monte seu Top N e exporte uma imagem para compartilhar.
        </p>
      </div>

      <SoloSetupForm />
    </main>
  );
}
