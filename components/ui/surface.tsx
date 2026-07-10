import { cn } from "@/lib/utils";

export function Surface({
  className,
  variant = "light",
  children,
}: {
  className?: string;
  variant?: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        variant === "light" && "card-football p-5",
        variant === "dark" && "glass-dark rounded-2xl p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
