import type { Position } from "./types";
import { FILTER_NATIONALITIES } from "./nationality-codes";

export const POSITIONS: { value: Position; label: string }[] = [
  { value: "Goleiro", label: "Goleiro" },
  { value: "Defensor", label: "Defensor" },
  { value: "Meia", label: "Meia" },
  { value: "Atacante", label: "Atacante" },
];

export const NATIONALITIES = FILTER_NATIONALITIES;

export const POPULAR_TEAMS = [
  "Barcelona",
  "Real Madrid",
  "Santos",
  "Flamengo",
  "Manchester United",
  "Liverpool",
  "Bayern Munich",
  "AC Milan",
  "Juventus",
  "PSG",
  "Boca Juniors",
  "River Plate",
];

export const GUEST_TOKEN_KEY = "soccer_top_guest_token";
