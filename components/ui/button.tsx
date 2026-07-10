import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-pitch text-off-white shadow-sm hover:bg-pitch-dark hover:shadow-md active:scale-[0.98] disabled:bg-pitch/40 disabled:text-off-white/70 disabled:shadow-none disabled:active:scale-100",
        variant === "secondary" &&
          "border border-card-border bg-white text-pitch hover:border-pitch/50 hover:bg-off-white disabled:border-card-border disabled:bg-off-white-muted disabled:text-foreground/50",
        variant === "gold" &&
          "bg-gradient-to-b from-gold-light to-gold text-foreground shadow-sm hover:from-gold hover:to-gold-dark disabled:border disabled:border-gold/30 disabled:bg-gold/35 disabled:from-gold/35 disabled:to-gold/35 disabled:text-foreground/60 disabled:shadow-none",
        variant === "ghost" &&
          "bg-transparent text-off-white/85 hover:bg-off-white/10 hover:text-off-white disabled:text-off-white/45",
        variant === "danger" &&
          "bg-red-600 text-off-white hover:bg-red-700 disabled:bg-red-600/40 disabled:text-off-white/70",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        className
      )}
      {...props}
    />
  );
}
