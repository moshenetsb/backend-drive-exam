export const Answer = {
  A: "A",
  B: "B",
  C: "C",
  T: "T",
  N: "N",
} as const;
export type Answer = (typeof Answer)[keyof typeof Answer];

export const Level = {
  PODSTAWOWY: "PODSTAWOWY",
  SPECJALISTYCZNY: "SPECJALISTYCZNY",
} as const;
export type Level = (typeof Level)[keyof typeof Level];

export const Category = {
  AM: "AM",
  A1: "A1",
  A2: "A2",
  A: "A",
  B1: "B1",
  B: "B",
  B_E: "B+E",
  C: "C",
  C1: "C1",
  C1_E: "C1+E",
  C_E: "C+E",
  D: "D",
  D1: "D1",
  D1_E: "D1+E",
  D_E: "D+E",
  T: "T",
  PT: "PT",
} as const;
export type Category = (typeof Category)[keyof typeof Category];
