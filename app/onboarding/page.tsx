"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/branding";
import { validateUsername } from "@/lib/username";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(value: string) {
    setUsername(value);
    // Evita "obrigatório" enquanto o campo ainda está vazio
    if (!value.trim()) {
      setError("");
      return;
    }
    setError(validateUsername(value) ?? "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Erro ao salvar username");
        return;
      }

      await update({
        user: {
          username: data.username,
          usernameSet: true,
        },
      });

      router.push("/perfil/me");
      router.refresh();
    } catch {
      setError("Erro ao salvar username. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && !error && username.trim().length > 0;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="glass-dark rounded-2xl px-5 py-6">
        <h1 className="font-display text-2xl text-off-white">
          Escolha seu username
        </h1>
        <p className="mt-2 text-sm text-on-pitch-muted">
          Olá{session?.user?.name ? `, ${session.user.name}` : ""}! Defina um
          handle único para aparecer no ranking e adicionar amigos no {APP_NAME}.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm text-on-pitch-muted"
            >
              Username
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-on-pitch-subtle">@</span>
              <Input
                id="username"
                value={username}
                onChange={(event) => handleChange(event.target.value)}
                placeholder="seu_nome"
                autoComplete="username"
                autoFocus
                required
                minLength={3}
                maxLength={20}
                aria-invalid={!!error}
              />
            </div>
            <p className="mt-1.5 text-xs text-on-pitch-subtle">
              3–20 caracteres: letras, números e underscore
            </p>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
