import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "success" | "warning" | "gold";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        variant === "default" && "border border-card-border bg-surface-elevated text-foreground",
        variant === "success" && "bg-pitch text-off-white",
        variant === "warning" && "border border-amber-400/50 bg-amber-200 text-amber-950",
        variant === "gold" && "gold-chip font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}
