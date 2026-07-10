import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-pitch text-off-white shadow-md hover:bg-pitch-dark hover:shadow-lg active:scale-[0.98]",
        variant === "secondary" &&
          "bg-off-white text-foreground border-2 border-card-border hover:border-pitch/50 hover:bg-off-white-muted",
        variant === "gold" &&
          "bg-gold text-foreground shadow-md hover:bg-gold-dark",
        variant === "ghost" &&
          "bg-transparent text-pitch hover:bg-pitch/10",
        variant === "danger" && "bg-red-600 text-off-white hover:bg-red-700",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        className
      )}
      {...props}
    />
  );
}
