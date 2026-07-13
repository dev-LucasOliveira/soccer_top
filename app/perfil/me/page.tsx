import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditUsernameForm } from "@/components/edit-username-form";
import { getCurrentUser } from "@/lib/auth";
import { getOwnUserProfile } from "@/lib/user-profile";
import { APP_NAME } from "@/lib/branding";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Meu perfil",
  description: `Seu histórico e estatísticas no ${APP_NAME}.`,
  path: "/perfil/me",
  noIndex: true,
});

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function MyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/signin?callbackUrl=/perfil/me");
  if (!user.usernameSet) redirect("/onboarding");

  const profile = await getOwnUserProfile(user.id);
  if (!profile) redirect("/");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass-dark rounded-2xl px-5 py-6">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pitch-bright/20 text-xl font-display text-pitch-bright">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl text-off-white">
              {profile.displayName}
            </h1>
            <EditUsernameForm currentUsername={profile.username} />
            <p className="mt-1 text-xs text-on-pitch-subtle">
              Membro desde {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/competicao"
            className="rounded-xl bg-pitch px-4 py-2 text-sm font-semibold text-off-white hover:bg-pitch-dark"
          >
            Ver competição global
          </Link>
          <Link
            href="/amigos"
            className="rounded-xl border border-card-border px-4 py-2 text-sm text-off-white hover:border-gold/40"
          >
            Amigos
          </Link>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg text-off-white">
          Estatísticas por modo
        </h2>
        {profile.modeStats.length === 0 ? (
          <p className="text-sm text-on-pitch-muted">
            Nenhuma partida registrada ainda. Jogue logado para aparecer no ranking.
          </p>
        ) : (
          <div className="space-y-2">
            {profile.modeStats.map((stat) => (
              <div
                key={stat.gameMode}
                className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-off-white">{stat.label}</p>
                  <p className="text-xs text-on-pitch-muted">
                    {stat.gamesPlayed} partidas · {stat.wins} vitórias
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-gold-light">
                    {stat.bestScore ?? stat.totalScore}
                  </p>
                  <p className="text-xs text-on-pitch-subtle">melhor score</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg text-off-white">
          Partidas recentes
        </h2>
        {profile.recentMatches.length === 0 ? (
          <p className="text-sm text-on-pitch-muted">Nenhuma partida ainda.</p>
        ) : (
          <div className="space-y-2">
            {profile.recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3 text-sm"
              >
                <div>
                  <p className="text-off-white">{match.label}</p>
                  <p className="text-xs text-on-pitch-muted">
                    {formatDate(match.playedAt)}
                    {match.placement ? ` · ${match.placement}º lugar` : ""}
                  </p>
                </div>
                <span className="font-display text-gold-light">{match.score}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
