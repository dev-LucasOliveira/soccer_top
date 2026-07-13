"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  LogIn,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/competicao", label: "Competição" },
  { href: "/amigos", label: "Amigos" },
] as const;

function UserAvatar({
  image,
  name,
  size = 32,
}: {
  image?: string | null;
  name?: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex items-center justify-center rounded-full bg-pitch-bright/20 text-pitch-bright"
      style={{ width: size, height: size }}
    >
      <User className={size <= 28 ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}

function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-off-white/10" />
    );
  }

  if (!session?.user) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => signIn("google")}
        className="gap-1.5"
      >
        <LogIn className="h-4 w-4" />
        Entrar
      </Button>
    );
  }

  const profileHref = session.user.usernameSet
    ? "/perfil/me"
    : "/onboarding";
  const handle = session.user.usernameSet
    ? `@${session.user.username}`
    : session.user.name ?? "Conta";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-off-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        aria-label="Menu da conta"
      >
        <UserAvatar
          image={session.user.image}
          name={session.user.name}
          size={32}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-card-border bg-surface-elevated py-1 text-foreground shadow-lg"
        >
          <div className="border-b border-card-border px-3 py-2.5">
            <p className="truncate text-sm font-medium text-foreground">
              {handle}
            </p>
            {session.user.name && (
              <p className="truncate text-xs text-text-muted">
                {session.user.name}
              </p>
            )}
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-inset"
          >
            <User className="h-4 w-4 text-text-muted" />
            Meu perfil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-surface-inset"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function MobileNavSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const panelRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onCloseRef.current();
    }
  }, [pathname]);

  if (!open) return null;

  const profileHref = session?.user?.usernameSet
    ? "/perfil/me"
    : "/onboarding";
  const handle = session?.user?.usernameSet
    ? `@${session.user.username}`
    : session?.user?.name ?? null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-card-border bg-nav-sheet text-foreground shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-foreground/15 px-4 py-3">
          <p className="font-display text-lg text-foreground">Menu</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {status === "authenticated" && session?.user && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-foreground/15 bg-surface-elevated/60 px-3 py-3">
              <UserAvatar
                image={session.user.image}
                name={session.user.name}
                size={40}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {handle}
                </p>
                {session.user.name && (
                  <p className="truncate text-xs text-text-muted">
                    {session.user.name}
                  </p>
                )}
              </div>
            </div>
          )}

          <Link
            href="/"
            onClick={onClose}
            className={cn(
              "rounded-xl px-3 py-3 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-surface-elevated text-foreground"
                : "text-text-muted hover:bg-surface-elevated/70 hover:text-foreground"
            )}
          >
            Início
          </Link>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-surface-elevated text-foreground"
                  : "text-text-muted hover:bg-surface-elevated/70 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          {status === "authenticated" && (
            <Link
              href={profileHref}
              onClick={onClose}
              className={cn(
                "rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                pathname.startsWith("/perfil")
                  ? "bg-surface-elevated text-foreground"
                  : "text-text-muted hover:bg-surface-elevated/70 hover:text-foreground"
              )}
            >
              Meu perfil
            </Link>
          )}

          <div className="my-3 border-t border-foreground/15" />

          {status === "authenticated" ? (
            <Button
              type="button"
              variant="danger"
              className="w-full justify-center gap-2"
              onClick={() => {
                onClose();
                void signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          ) : status !== "loading" ? (
            <Button
              type="button"
              variant="gold"
              className="w-full justify-center gap-2"
              onClick={() => {
                onClose();
                void signIn("google");
              }}
            >
              <LogIn className="h-4 w-4" />
              Entrar com Google
            </Button>
          ) : null}
        </nav>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="site-header sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
          {/* Brand + primary nav (grouped — avoids orphaned center links) */}
          <div className="flex min-w-0 items-center gap-6 md:gap-8">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 font-display text-lg tracking-tight text-off-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full">
                <AppIcon size={18} />
              </span>
              <span className="truncate">{APP_NAME}</span>
            </Link>

            <nav
              className="hidden items-center gap-0.5 md:flex"
              aria-label="Principal"
            >
              <span
                className="mr-3 hidden h-4 w-px bg-off-white/15 lg:block"
                aria-hidden
              />
              {NAV_LINKS.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative rounded-md px-3 py-2 text-[13px] font-medium tracking-wide transition-colors",
                      active
                        ? "text-off-white"
                        : "text-on-pitch-muted hover:text-off-white"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span
                        className="absolute inset-x-3 -bottom-0.5 h-px bg-gold/70"
                        aria-hidden
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Utilities */}
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden md:block">
              <AccountMenu />
            </div>

            <div className="md:hidden">
              <GuestEnterButton />
            </div>

            <ThemeToggle />

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-pitch-muted transition-colors hover:bg-off-white/10 hover:text-off-white md:hidden"
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileNavSheet open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function GuestEnterButton() {
  const { data: session, status } = useSession();

  if (status === "loading" || session?.user) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => signIn("google")}
      className="gap-1.5 px-2"
    >
      <LogIn className="h-4 w-4" />
      Entrar
    </Button>
  );
}
