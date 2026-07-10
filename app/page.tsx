import { SessionForm } from "@/components/session-form";
import { JoinForm } from "@/components/join-form";
import { APP_NAME, APP_SLOGAN } from "@/lib/branding";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-off-white/10 text-4xl backdrop-blur">
          ⚽
        </div>
        <h1 className="text-3xl font-bold text-off-white sm:text-4xl">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-off-white/80">{APP_SLOGAN}</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "🎯", text: "Crie a sala e configure as rodadas" },
          { icon: "🔗", text: "Compartilhe o código da sala" },
          { icon: "🏆", text: "Compare os rankings no final" },
        ].map((item) => (
          <div
            key={item.text}
            className="rounded-xl bg-off-white/10 px-4 py-3 text-center text-sm text-off-white backdrop-blur"
          >
            <span className="text-xl">{item.icon}</span>
            <p className="mt-1 font-medium">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-off-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm text-foreground">
              1
            </span>
            Criar sala
          </h2>
          <SessionForm />
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-off-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-off-white/20 text-sm">
              2
            </span>
            Entrar em uma sala
          </h2>
          <JoinForm />
        </div>
      </div>
    </main>
  );
}
