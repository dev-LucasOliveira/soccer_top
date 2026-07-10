import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-card-border bg-off-white/90 px-3 py-2.5 text-sm text-foreground outline-none backdrop-blur transition-colors duration-200 placeholder:text-text-muted/70 focus:border-gold/60 focus:ring-2 focus:ring-gold/15",
        className
      )}
      {...props}
    />
  );
}
