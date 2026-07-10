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
        variant === "default" && "border border-card-border bg-white text-foreground",
        variant === "success" && "bg-pitch text-off-white",
        variant === "warning" && "border border-amber-400/50 bg-amber-200 text-amber-950",
        variant === "gold" &&
          "border border-gold/40 bg-gold/30 font-semibold text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
