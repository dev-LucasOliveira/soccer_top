import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function SessionHeader({
  title,
  code,
  stepLabel,
  topN,
  backHref,
  backLabel = "← Voltar ao lobby",
}: {
  title: string;
  code?: string;
  stepLabel?: string;
  topN?: number;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-6 space-y-4">
      <div className="text-center">
        {stepLabel && (
          <Badge variant="gold" className="mb-2">
            {stepLabel}
          </Badge>
        )}
        <h1 className="text-xl font-bold text-off-white sm:text-2xl">{title}</h1>
        {(code || topN) && (
          <p className="mt-1 text-sm text-off-white/70">
            {topN != null && <>Top {topN}</>}
            {topN != null && code && " · "}
            {code && (
              <>
                Código{" "}
                <span className="rounded bg-off-white/10 px-2 py-0.5 font-mono font-bold text-gold">
                  {code}
                </span>
              </>
            )}
          </p>
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
