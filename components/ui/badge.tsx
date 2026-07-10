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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-off-white-muted text-foreground",
        variant === "success" && "bg-pitch text-off-white",
        variant === "warning" && "bg-amber-100 text-amber-800",
        variant === "gold" && "bg-gold/25 text-foreground border border-gold/50",
        className
      )}
    >
      {children}
    </span>
  );
}
