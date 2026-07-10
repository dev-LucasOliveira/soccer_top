import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soccer Top",
  description: "Monte seu top de jogadores e compare com amigos",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="pitch-gradient text-off-white shadow-lg">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-off-white/20 text-base">
                ⚽
              </span>
              Soccer Top
            </Link>
            <span className="hidden text-sm text-off-white/70 sm:block">
              Seu ranking, seu time, sua opinião
            </span>
          </div>
        </header>
        <div className="pitch-bg flex-1">{children}</div>
      </body>
    </html>
  );
}
