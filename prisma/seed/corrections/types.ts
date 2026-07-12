import type { Position, TeamEntry } from "../../../lib/types";

export type PlayerCorrection = {
  name: string;
  primaryPosition?: Position;
  nationality?: string;
  teams?: TeamEntry[];
  careerStart?: number;
  careerEnd?: number;
  note?: string;
};
