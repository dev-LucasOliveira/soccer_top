import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function SessionHeader({
  title,
  code,
  stepLabel,
  topN,
  backHref,
  backLabel = "← Voltar à sala",
  showCode = true,
}: {
  title?: string;
  code?: string;
  stepLabel?: string;
  topN?: number;
  backHref?: string;
  backLabel?: string;
  showCode?: boolean;
}) {
  const showTitleSubtitle =
    showCode && title && code && title !== `Sala ${code}` ? title : undefined;

  return (
    <header className="mb-6 space-y-4">
      <div className="text-center">
        {stepLabel && (
          <Badge variant="gold" className="mb-2">
            {stepLabel}
          </Badge>
        )}
        {showCode && code ? (
          <>
            <h1 className="text-xl font-bold text-off-white sm:text-2xl">
              <span className="rounded bg-off-white/10 px-3 py-1 font-mono text-gold">
                {code}
              </span>
            </h1>
            {showTitleSubtitle && (
              <p className="mt-2 text-sm text-off-white/70">{showTitleSubtitle}</p>
            )}
          </>
        ) : (
          title && (
            <h1 className="text-2xl font-bold text-off-white sm:text-3xl md:text-4xl">
              {title}
            </h1>
          )
        )}
        {topN != null && (
          <p className="mt-1 text-sm text-off-white/70">Top de {topN}</p>
        )}
      </div>
      {backHref && (
        <Link
          href={backHref}
          className="inline-block text-sm text-off-white/70 hover:text-off-white"
        >
          {backLabel}
        </Link>
      )}
    </header>
  );
}
