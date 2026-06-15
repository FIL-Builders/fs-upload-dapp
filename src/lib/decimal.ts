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

const toDecimal = (value: bigint | string | number) => new AppDecimal(value.toString());

export const bytesToKiB = (bytes: bigint): DecimalValue =>
  toDecimal(bytes).div(toDecimal(SIZE_CONSTANTS.KiB));

export const bytesToMiB = (bytes: bigint): DecimalValue =>
  toDecimal(bytes).div(toDecimal(SIZE_CONSTANTS.MiB));

export const bytesToGiB = (bytes: bigint): DecimalValue =>
  toDecimal(bytes).div(toDecimal(SIZE_CONSTANTS.GiB));
