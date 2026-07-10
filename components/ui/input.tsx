import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border-2 border-card-border bg-off-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-text-muted/70 focus:border-pitch focus:ring-2 focus:ring-pitch/20",
        className
      )}
      {...props}
    />
  );
}
