"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeUsername, validateUsername } from "@/lib/username";

type EditUsernameFormProps = {
  currentUsername: string;
};

export function EditUsernameForm({ currentUsername }: EditUsernameFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function startEditing() {
    setUsername(currentUsername);
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setUsername(currentUsername);
    setError("");
    setEditing(false);
  }

  function handleChange(value: string) {
    setUsername(value);
    setError(validateUsername(value) ?? "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalized = normalizeUsername(username);
    if (normalized === currentUsername) {
      setEditing(false);
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

      setEditing(false);
      router.refresh();
    } catch {
      setError("Erro ao salvar username. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-on-pitch-muted">@{currentUsername}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-0.5 text-xs text-gold-light hover:text-gold"
          onClick={startEditing}
        >
          Editar
        </Button>
      </div>
    );
  }

  const canSubmit = !loading && !error && username.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-1 space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-sm text-on-pitch-subtle">@</span>
        <Input
          value={username}
          onChange={(event) => handleChange(event.target.value)}
          autoComplete="username"
          autoFocus
          required
          minLength={3}
          maxLength={20}
          className="max-w-[14rem] py-1.5"
          disabled={loading}
          aria-invalid={!!error}
        />
      </div>
      <p className="text-xs text-on-pitch-subtle">
        3–20 caracteres: letras, números e underscore
      </p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={cancelEditing}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
