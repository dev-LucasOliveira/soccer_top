"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/branding";

type UserResult = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type FriendEntry = UserResult & { friendshipId: string };

type FriendsData = {
  accepted: FriendEntry[];
  pendingIncoming: FriendEntry[];
  pendingOutgoing: FriendEntry[];
};

export default function AmigosPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [friends, setFriends] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFriends = useCallback(async () => {
    const response = await fetch("/api/friends");
    if (!response.ok) {
      setError("Erro ao carregar amigos");
      return;
    }
    const data = await response.json();
    setFriends(data);
  }, []);

  useEffect(() => {
    loadFriends().finally(() => setLoading(false));
  }, [loadFriends]);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;

    setSearching(true);
    setError("");
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Erro na busca");
        return;
      }
      setSearchResults(data.users ?? []);
    } catch {
      setError("Erro na busca");
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(username: string) {
    setMessage("");
    const response = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Erro ao enviar pedido");
      return;
    }
    setMessage(`Pedido enviado para @${username}`);
    await loadFriends();
  }

  async function respondRequest(friendshipId: string, action: "accept" | "reject") {
    const response = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erro ao responder");
      return;
    }
    await loadFriends();
  }

  async function removeFriend(friendshipId: string) {
    const response = await fetch(`/api/friends/${friendshipId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Erro ao remover amigo");
      return;
    }
    await loadFriends();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass-dark rounded-2xl px-5 py-6">
        <h1 className="font-display text-2xl text-off-white">Amigos</h1>
        <p className="mt-1 text-sm text-on-pitch-muted">
          Busque jogadores do {APP_NAME} e acompanhe pedidos de amizade.
        </p>

        <form onSubmit={handleSearch} className="mt-5 flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por @username"
            minLength={2}
          />
          <Button type="submit" disabled={searching}>
            {searching ? "..." : "Buscar"}
          </Button>
        </form>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {message && <p className="mt-3 text-sm text-pitch-bright">{message}</p>}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.03] px-3 py-2"
              >
                <Link
                  href={`/perfil/${user.username}`}
                  className="flex items-center gap-2"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch-bright/20 text-xs text-pitch-bright">
                      {user.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-off-white">{user.displayName}</p>
                    <p className="text-xs text-on-pitch-muted">@{user.username}</p>
                  </div>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => sendRequest(user.username)}
                >
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {friends && friends.pendingIncoming.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg text-off-white">
            Pedidos recebidos
          </h2>
          <div className="space-y-2">
            {friends.pendingIncoming.map((friend) => (
              <div
                key={friend.friendshipId}
                className="flex items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-3 py-2"
              >
                <Link href={`/perfil/${friend.username}`} className="text-sm text-off-white">
                  @{friend.username}
                </Link>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => respondRequest(friend.friendshipId, "accept")}
                  >
                    Aceitar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => respondRequest(friend.friendshipId, "reject")}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {friends && friends.pendingOutgoing.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg text-off-white">
            Pedidos enviados
          </h2>
          <div className="space-y-2">
            {friends.pendingOutgoing.map((friend) => (
              <div
                key={friend.friendshipId}
                className="rounded-xl border border-off-white/10 bg-off-white/[0.03] px-3 py-2 text-sm text-on-pitch-muted"
              >
                @{friend.username} — aguardando resposta
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg text-off-white">Seus amigos</h2>
        {!friends || friends.accepted.length === 0 ? (
          <p className="text-sm text-on-pitch-muted">
            Nenhum amigo ainda. Busque jogadores acima.
          </p>
        ) : (
          <div className="space-y-2">
            {friends.accepted.map((friend) => (
              <div
                key={friend.friendshipId}
                className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.03] px-3 py-2"
              >
                <Link
                  href={`/perfil/${friend.username}`}
                  className="flex items-center gap-2"
                >
                  {friend.avatarUrl ? (
                    <Image
                      src={friend.avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch-bright/20 text-xs text-pitch-bright">
                      {friend.displayName.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-off-white">@{friend.username}</span>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFriend(friend.friendshipId)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
