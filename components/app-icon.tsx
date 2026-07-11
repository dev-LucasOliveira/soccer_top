import { GiSoccerBall } from "react-icons/gi";
import { cn } from "@/lib/utils";

export function AppIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <GiSoccerBall
      size={size}
      className={cn("text-off-white", className)}
      aria-label="Bola de futebol"
    />
  );
}
