export type WeightUnit = "kg" | "lb";

const KG_PER_LB = 0.45359237;

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** Weights are stored in kg; this converts for display. */
export const toDisplayWeight = (kg: number, unit: WeightUnit) =>
  unit === "lb" ? round(kg / KG_PER_LB, 1) : round(kg, 2);

/** Converts a value the user typed in their unit back to kg for storage. */
export const toKg = (value: number, unit: WeightUnit) =>
  unit === "lb" ? round(value * KG_PER_LB, 3) : value;

export const formatWeight = (kg: number, unit: WeightUnit) =>
  `${toDisplayWeight(kg, unit).toLocaleString("en-US")} ${unit}`;
