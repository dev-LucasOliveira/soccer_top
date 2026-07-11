import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { APP_NAME, APP_SLOGAN } from "@/lib/branding";
import { AppIcon } from "@/components/app-icon";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_SLOGAN,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-50 border-b border-gold/20 bg-pitch-dark/95 text-off-white backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-lg tracking-tight"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch">
                <AppIcon size={18} />
              </span>
              {APP_NAME}
            </Link>
            <span className="hidden text-xs tracking-wide text-on-pitch-muted sm:block">
              {APP_SLOGAN}
            </span>
          </div>
        </header>
        <div className="pitch-bg flex-1">{children}</div>
      </body>
    </html>
  );
}
