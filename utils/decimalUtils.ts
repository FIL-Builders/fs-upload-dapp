/**
 * High-precision calculation utilities using decimal.js
 * Provides precise arithmetic for financial calculations and storage metrics
 */

import Decimal from 'decimal.js';
import { SIZE_CONSTANTS } from '@filoz/synapse-sdk';

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 34, // High precision for financial calculations
  rounding: Decimal.ROUND_HALF_UP, // Standard rounding
  toExpNeg: -21, // Use exponential notation for very small numbers
  toExpPos: 21, // Use exponential notation for very large numbers
  maxE: 9e15, // Maximum exponent
  minE: -9e15, // Minimum exponent
  modulo: Decimal.ROUND_DOWN, // Default modulo
});

/**
 * Decimal-based unit conversion utilities for storage calculations
 */
export class DecimalUnitConverter {
  /**
   * Convert bytes to GiB with high precision using decimal.js
   * @param bytes - Bytes as BigInt or string
   * @returns Decimal representing GiB
   */
  static bytesToGiB(bytes: bigint | string | number): Decimal {
    const bytesDecimal = new Decimal(bytes.toString());
    const gibConstant = new Decimal(SIZE_CONSTANTS.GiB.toString());
    return bytesDecimal.div(gibConstant);
  }

  /**
   * Convert bytes to MiB with high precision using decimal.js
   * @param bytes - Bytes as BigInt or string
   * @returns Decimal representing MiB
   */
  static bytesToMiB(bytes: bigint | string | number): Decimal {
    const bytesDecimal = new Decimal(bytes.toString());
    const mibConstant = new Decimal(SIZE_CONSTANTS.MiB.toString());
    return bytesDecimal.div(mibConstant);
  }

  /**
   * Convert bytes to KiB with high precision using decimal.js
   * @param bytes - Bytes as BigInt or string
   * @returns Decimal representing KiB
   */
  static bytesToKiB(bytes: bigint | string | number): Decimal {
    const bytesDecimal = new Decimal(bytes.toString());
    const kibConstant = new Decimal(SIZE_CONSTANTS.KiB.toString());
    return bytesDecimal.div(kibConstant);
  }

  /**
   * Convert GiB to bytes with high precision using decimal.js
   * @param gib - GiB as number, string, or Decimal
   * @returns Decimal representing bytes
   */
  static gibToBytes(gib: number | string | Decimal): Decimal {
    const gibDecimal = gib instanceof Decimal ? gib : new Decimal(gib.toString());
    const gibConstant = new Decimal(SIZE_CONSTANTS.GiB.toString());
    return gibDecimal.mul(gibConstant);
  }

  /**
   * Convert TiB to bytes with high precision using decimal.js
   * @param tib - TiB as number, string, or Decimal
   * @returns Decimal representing bytes
   */
  static tibToBytes(tib: number | string | Decimal): Decimal {
    const tibDecimal = tib instanceof Decimal ? tib : new Decimal(tib.toString());
    const tibConstant = new Decimal(SIZE_CONSTANTS.TiB.toString());
    return tibDecimal.mul(tibConstant);
  }
}

/**
 * High-precision financial math utilities using decimal.js
 */
export class DecimalFinancialMath {
  /**
   * Calculate percentage with high precision
   * @param numerator - Numerator value
   * @param denominator - Denominator value
   * @returns Decimal representing percentage (0-100)
   */
  static calculatePercentage(
    numerator: bigint | string | number | Decimal,
    denominator: bigint | string | number | Decimal
  ): Decimal {
    const num = numerator instanceof Decimal ? numerator : new Decimal(numerator.toString());
    const den = denominator instanceof Decimal ? denominator : new Decimal(denominator.toString());

    if (den.isZero()) {
      return new Decimal(0);
    }

    return num.div(den).mul(100);
  }

  /**
   * Calculate ratio with high precision
   * @param numerator - Numerator value
   * @param denominator - Denominator value
   * @returns Decimal representing ratio (0-1)
   */
  static calculateRatio(
    numerator: bigint | string | number | Decimal,
    denominator: bigint | string | number | Decimal
  ): Decimal {
    const num = numerator instanceof Decimal ? numerator : new Decimal(numerator.toString());
    const den = denominator instanceof Decimal ? denominator : new Decimal(denominator.toString());

    if (den.isZero()) {
      return new Decimal(0);
    }

    return num.div(den);
  }

  /**
   * Multiply value by ratio with high precision
   * @param value - Value to scale
   * @param ratio - Ratio to apply (0-1)
   * @returns Decimal representing scaled value
   */
  static multiplyByRatio(
    value: bigint | string | number | Decimal,
    ratio: number | string | Decimal
  ): Decimal {
    const valueDecimal = value instanceof Decimal ? value : new Decimal(value.toString());
    const ratioDecimal = ratio instanceof Decimal ? ratio : new Decimal(ratio.toString());

    return valueDecimal.mul(ratioDecimal);
  }

  /**
   * Calculate cost per unit with high precision
   * @param totalCost - Total cost
   * @param units - Number of units
   * @returns Decimal representing cost per unit
   */
  static calculateCostPerUnit(
    totalCost: bigint | string | number | Decimal,
    units: bigint | string | number | Decimal
  ): Decimal {
    const costDecimal = totalCost instanceof Decimal ? totalCost : new Decimal(totalCost.toString());
    const unitsDecimal = units instanceof Decimal ? units : new Decimal(units.toString());

    if (unitsDecimal.isZero()) {
      return new Decimal(0);
    }

    return costDecimal.div(unitsDecimal);
  }

  /**
   * Round to specific decimal places using banker's rounding
   * @param value - Value to round
   * @param decimalPlaces - Number of decimal places
   * @returns Decimal with specified precision
   */
  static roundToPrecision(value: Decimal | number | string, decimalPlaces: number): Decimal {
    const decimal = value instanceof Decimal ? value : new Decimal(value.toString());
    return decimal.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
  }
}

/**
 * Safe aggregation utilities using decimal.js
 */
export class DecimalAggregation {
  /**
   * Sum array of values with high precision
   * @param values - Array of values to sum
   * @returns Decimal representing the sum
   */
  static sum(values: (bigint | string | number | Decimal)[]): Decimal {
    return values.reduce((acc: Decimal, value) => {
      const decimal = value instanceof Decimal ? value : new Decimal(value.toString());
      return acc.plus(decimal);
    }, new Decimal(0));
  }

  /**
   * Calculate average of array of values with high precision
   * @param values - Array of values to average
   * @returns Decimal representing the average
   */
  static average(values: (bigint | string | number | Decimal)[]): Decimal {
    if (values.length === 0) {
      return new Decimal(0);
    }

    const sum = this.sum(values);
    return sum.div(values.length);
  }

  /**
   * Aggregate values from array of objects using accessor function
   * @param items - Array of objects
   * @param accessor - Function to extract value from each object
   * @returns Decimal representing the sum
   */
  static aggregateBy<T>(
    items: T[],
    accessor: (item: T) => bigint | string | number | Decimal
  ): Decimal {
    return items.reduce((acc, item) => {
      const value = accessor(item);
      const decimal = value instanceof Decimal ? value : new Decimal(value.toString());
      return acc.plus(decimal);
    }, new Decimal(0));
  }
}

/**
 * Display formatting utilities for decimal values
 */
export class DecimalFormatter {
  /**
   * Format storage amount with appropriate units
   * @param bytes - Bytes as any numeric type
   * @param options - Formatting options
   * @returns Formatted string with appropriate unit
   */
  static formatStorageAmount(
    bytes: bigint | string | number | Decimal,
    options: {
      minUnit?: 'B' | 'KB' | 'MB' | 'GB';
      maxDecimals?: number;
      showZero?: boolean;
    } = {}
  ): string {
    const { minUnit = 'B', maxDecimals = 4, showZero = true } = options;

    const bytesDecimal = bytes instanceof Decimal ? bytes : new Decimal(bytes.toString());

    if (bytesDecimal.isZero()) {
      return showZero ? '0 B' : '< 0.0001 B';
    }

    // Convert to different units
    const gb = DecimalUnitConverter.bytesToGiB(bytesDecimal.toString());
    const mb = DecimalUnitConverter.bytesToMiB(bytesDecimal.toString());
    const kb = DecimalUnitConverter.bytesToKiB(bytesDecimal.toString());

    // Choose appropriate unit based on magnitude and minimum unit
    if (gb.gte(0.1) && minUnit !== 'MB' && minUnit !== 'KB' && minUnit !== 'B') {
      return `${gb.toDecimalPlaces(maxDecimals).toString()} GB`;
    }

    if (mb.gte(0.1) && minUnit !== 'KB' && minUnit !== 'B') {
      return `${mb.toDecimalPlaces(maxDecimals).toString()} MiB`;
    }

    if (kb.gte(0.1) && minUnit !== 'B') {
      return `${kb.toDecimalPlaces(maxDecimals).toString()} KiB`;
    }

    return `${bytesDecimal.toDecimalPlaces(0).toString()} B`;
  }

  /**
   * Format percentage with meaningful precision
   * @param ratio - Decimal ratio (0-1)
   * @param options - Formatting options
   * @returns Formatted percentage string
   */
  static formatPercentage(
    ratio: Decimal | number | string,
    options: {
      minDecimals?: number;
      maxDecimals?: number;
      showZero?: boolean;
    } = {}
  ): string {
    const { minDecimals = 0, maxDecimals = 2, showZero = true } = options;
    const ratioDecimal = ratio instanceof Decimal ? ratio : new Decimal(ratio.toString());

    if (ratioDecimal.isZero()) {
      return showZero ? '0%' : '< 0.01%';
    }

    const percentage = ratioDecimal.mul(100);

    if (percentage.lt(0.01) && !showZero) {
      return '< 0.01%';
    }

    // Use appropriate precision based on magnitude
    let decimals = maxDecimals;
    if (percentage.gte(10)) {
      decimals = Math.max(minDecimals, 1);
    } else if (percentage.gte(1)) {
      decimals = Math.max(minDecimals, 2);
    }

    return `${percentage.toDecimalPlaces(decimals).toString()}%`;
  }

  /**
   * Format decimal number with specified precision
   * @param value - Value to format
   * @param options - Formatting options
   * @returns Formatted number string
   */
  static formatNumber(
    value: Decimal | number | string,
    options: { maxDecimals?: number; showZero?: boolean } = {}
  ): string {
    const { maxDecimals = 4, showZero = true } = options;
    const decimal = value instanceof Decimal ? value : new Decimal(value.toString());

    if (decimal.isZero()) {
      return showZero ? '0' : '< 0.0001';
    }

    return decimal.toDecimalPlaces(maxDecimals).toString();
  }

  /**
   * Convert Decimal to BigInt (for blockchain interactions)
   * @param value - Decimal value
   * @returns BigInt representation
   */
  static toBigInt(value: Decimal): bigint {
    // Round to integer and convert to BigInt
    return BigInt(value.toDecimalPlaces(0, Decimal.ROUND_DOWN).toString());
  }

  /**
   * Convert Decimal to Number (with precision warning for large values)
   * @param value - Decimal value
   * @param context - Context for error messages
   * @returns Number representation
   */
  static toNumber(value: Decimal, context?: string): number {
    const num = value.toNumber();

    // Check if precision might be lost
    if (!Number.isSafeInteger(num) && value.isInteger()) {
      console.warn(
        `Potential precision loss in ${context || 'conversion'}: ${value.toString()} converted to ${num}`
      );
    }

    return num;
  }
}

/**
 * Storage-specific calculations using decimal.js
 */
export class DecimalStorageCalculations {
  /**
   * Calculate storage capacity from rate allowance
   * @param rateAllowance - Rate allowance in USDFC
   * @param pricePerTiBPerMonth - Price per TiB per month
   * @param epochsPerMonth - Number of epochs per month
   * @returns Decimal representing capacity in GiB
   */
  static calculateCapacityFromRate(
    rateAllowance: bigint | string | number | Decimal,
    pricePerTiBPerMonth: bigint | string | number | Decimal,
    epochsPerMonth: bigint | string | number | Decimal
  ): Decimal {
    const rateDecimal = rateAllowance instanceof Decimal ? rateAllowance : new Decimal(rateAllowance.toString());
    const priceDecimal = pricePerTiBPerMonth instanceof Decimal ? pricePerTiBPerMonth : new Decimal(pricePerTiBPerMonth.toString());
    const epochsDecimal = epochsPerMonth instanceof Decimal ? epochsPerMonth : new Decimal(epochsPerMonth.toString());

    if (priceDecimal.isZero()) {
      return new Decimal(0);
    }

    // capacity = (rateAllowance * epochsPerMonth * TiB) / pricePerTiBPerMonth / GiB
    const tibInBytes = DecimalUnitConverter.tibToBytes(1);
    const monthlyBudget = rateDecimal.mul(epochsDecimal);
    const capacityBytes = monthlyBudget.mul(tibInBytes).div(priceDecimal);

    return DecimalUnitConverter.bytesToGiB(capacityBytes.toString());
  }

  /**
   * Calculate persistence days from lockup allowance
   * @param lockupAllowance - Lockup allowance in USDFC
   * @param dailyBurnRate - Daily burn rate in USDFC
   * @returns Decimal representing days
   */
  static calculatePersistenceDays(
    lockupAllowance: bigint | string | number | Decimal,
    dailyBurnRate: bigint | string | number | Decimal
  ): Decimal {
    const lockupDecimal = lockupAllowance instanceof Decimal ? lockupAllowance : new Decimal(lockupAllowance.toString());
    const rateDecimal = dailyBurnRate instanceof Decimal ? dailyBurnRate : new Decimal(dailyBurnRate.toString());

    if (rateDecimal.isZero()) {
      return new Decimal(Infinity);
    }

    return lockupDecimal.div(rateDecimal);
  }

  /**
   * Calculate cost for storage amount
   * @param storageBytes - Storage amount in bytes
   * @param pricePerTiBPerMonth - Price per TiB per month
   * @returns Decimal representing monthly cost
   */
  static calculateMonthlyCost(
    storageBytes: bigint | string | number | Decimal,
    pricePerTiBPerMonth: bigint | string | number | Decimal
  ): Decimal {
    const bytesDecimal = storageBytes instanceof Decimal ? storageBytes : new Decimal(storageBytes.toString());
    const priceDecimal = pricePerTiBPerMonth instanceof Decimal ? pricePerTiBPerMonth : new Decimal(pricePerTiBPerMonth.toString());

    // cost = (storageBytes / TiB) * pricePerTiBPerMonth
    const tibInBytes = DecimalUnitConverter.tibToBytes(1);
    const storageInTiB = bytesDecimal.div(tibInBytes);

    return storageInTiB.mul(priceDecimal);
  }
}