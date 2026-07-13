import Link from "next/link";
import { getModeSeoParagraphs, getModeSeoTitle } from "@/lib/seo";
import type { HomeModeId } from "@/lib/game-modes";

export function ModeLandingSeo({
  modeId,
  ctaHref = "/",
  ctaLabel = "Criar sala grátis",
}: {
  modeId: HomeModeId;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const title = getModeSeoTitle(modeId);
  const paragraphs = getModeSeoParagraphs(modeId);

  return (
    <section
      className="mx-auto mt-10 max-w-lg border-t border-off-white/[0.06] px-4 pt-8"
      aria-labelledby={`seo-${modeId}`}
    >
      <h2 id={`seo-${modeId}`} className="font-display text-xl text-off-white">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-on-pitch-muted">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-6">
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-gold-light to-gold px-6 py-3.5 text-base font-semibold text-gold-foreground shadow-sm transition-all duration-200 hover:from-gold hover:to-gold-dark"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
