import { cn } from "@/lib/utils";

export function AppIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("text-pitch", className)}
      role="img"
      aria-label="Bola de futebol"
    >
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <circle cx="16" cy="16" r="11" fill="#f5f5f0" />
      <path
        fill="#1a1a1a"
        d="M16 7.2 19.1 9.5 18.4 13.2 14.6 13.2 13.9 9.5z"
      />
      <path
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="0.9"
        d="M16 7.2v9.6M13.9 9.5 9.4 18.2M19.1 9.5 22.6 15.2M18.4 13.2 19.9 16.8M13.9 13.2 12.3 16.8M9.1 15.2 12.4 22.8M22.8 18.2 19.8 22.8M14.4 19.1 16.9 22.4"
      />
    </svg>
  );
}
