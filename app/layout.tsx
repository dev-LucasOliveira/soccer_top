import type { Metadata } from "next";
import Link from "next/link";
import { DM_Serif_Display, Geist, Geist_Mono } from "next/font/google";
import { APP_NAME } from "@/lib/branding";
import { AppIcon } from "@/components/app-icon";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  buildRootMetadata,
  buildWebApplicationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo";
import { THEME_STORAGE_KEY } from "@/lib/theme";
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

export const metadata: Metadata = buildRootMetadata();

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=(t==="night"||t==="light")?t:"night";}catch(e){document.documentElement.dataset.theme="night";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="night"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={[buildWebSiteJsonLd(), buildWebApplicationJsonLd()]} />
      </head>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <header className="site-header sticky top-0 z-50">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-display text-lg tracking-tight"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full">
                  <AppIcon size={18} />
                </span>
                {APP_NAME}
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <div className="pitch-bg flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
