import { SIZE_CONSTANTS } from "@filoz/synapse-sdk";
import Decimal from "decimal.js";

export const AppDecimal = Decimal.clone({
  precision: 30, // Covers FIL/USDFC 18 decimals + headroom for intermediate math
  rounding: Decimal.ROUND_UP, // Conservative — overestimates costs rather than underestimates
  toExpNeg: -18, // Avoid scientific notation for token-scale values (>= 1e-18)
  toExpPos: 30, // Avoid scientific notation for large values (<= 1e30)
});

type DecimalValue = InstanceType<typeof AppDecimal>;

export function bigIntToDecimal(value: bigint, decimals: number = 18): DecimalValue {
  return new AppDecimal(value.toString()).div(new AppDecimal(10).pow(decimals));
}

export function safeDivide(
  numerator: DecimalValue | string | number,
  denominator: DecimalValue | string | number,
): DecimalValue {
  const num = new AppDecimal(numerator);
  const den = new AppDecimal(denominator);
  if (den.isZero()) return new AppDecimal(0);
  return num.div(den);
}

export const toDecimal = (value: bigint | string | number) => new AppDecimal(value.toString());

export const bytesToKiB = (bytes: bigint): DecimalValue =>
  toDecimal(bytes).div(toDecimal(SIZE_CONSTANTS.KiB));

export const bytesToMiB = (bytes: bigint): DecimalValue =>
  toDecimal(bytes).div(toDecimal(SIZE_CONSTANTS.MiB));

export const bytesToGiB = (bytes: bigint): DecimalValue =>
  toDecimal(bytes).div(toDecimal(SIZE_CONSTANTS.GiB));

const GIB_PER_TIB = new AppDecimal(1024);

function gibToTiB(gib: DecimalValue | string | number): DecimalValue {
  return new AppDecimal(gib).div(GIB_PER_TIB);
}

function tibToGiB(tib: DecimalValue | string | number): DecimalValue {
  return new AppDecimal(tib).mul(GIB_PER_TIB);
}

export function computeMonthlyStorageCost(
  capacityGiB: DecimalValue | string | number,
  pricing: { pricePerTiBPerMonthNoCDN: bigint; minimumPricePerMonth: bigint },
): { perMonth: DecimalValue; isMinimumApplied: boolean } {
  const pricePerTiB = bigIntToDecimal(pricing.pricePerTiBPerMonthNoCDN, 18);
  const minimum = bigIntToDecimal(pricing.minimumPricePerMonth, 18);

  const capacityTiB = gibToTiB(new AppDecimal(capacityGiB));
  const calculatedCost = capacityTiB.mul(pricePerTiB);
  const isMinimumApplied = calculatedCost.lt(minimum);

  return {
    perMonth: AppDecimal.max(calculatedCost, minimum),
    isMinimumApplied,
  };
}

export function calculateMinimumCapacityThreshold(
  pricePerTiBPerMonth: DecimalValue | string | number | bigint,
  minimumPerMonth: DecimalValue | string | number | bigint,
): DecimalValue {
  const pricePerTiB = new AppDecimal(pricePerTiBPerMonth);
  const minimum = new AppDecimal(minimumPerMonth);

  if (pricePerTiB.isZero()) return new AppDecimal(0);

  const capacityTiB = safeDivide(minimum, pricePerTiB);
  return tibToGiB(capacityTiB);
}
