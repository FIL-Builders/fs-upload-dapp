import type { UsePriceListResult } from "@filoz/synapse-react";
import { bigIntToDecimal } from "@/lib/decimal";

/**
 * Per-operation cost helpers (validated against FilecoinWarmStorageService v1.3.0).
 *
 * Payment model: all one-time fees are PREPAID — debited from the client's
 * deposited USDFC inside the Payments contract, never pulled from the wallet at
 * operation time. Each dataset locks a lifecycle reserve at creation; fees are
 * paid out of that locked reserve (auto-replenished from available funds), so
 * fees don't reduce `availableFunds` directly — lockup growth does. On
 * termination the unused reserve is released back to available funds.
 *
 * Upload cost math lives in `@/app/upload/lib/upload-plan` (deriveUploadCosts),
 * which mirrors the SDK's calculateMultiContextCosts.
 */

export function terminateOperationCost(priceList: UsePriceListResult) {
  return {
    /** Charged on user-initiated termination only (drawn from the reserve). */
    fee: priceList.fees.terminateFee,
    /** Lifecycle lockup reserve, refunded when the rail is finalised. */
    reserveReleased: priceList.lockups.lifecycleReserveTarget,
  };
}

export function removalOperationCost(priceList: UsePriceListResult) {
  /** Per removal call (a batch of pieces), debited at the next proving period. */
  return { fee: priceList.fees.schedulePieceRemovalsFee };
}

/** Format a fee amount: enough precision for sub-cent fees, no trailing zeros. */
export function formatFee(value: bigint): string {
  const str = bigIntToDecimal(value, 18).toFixed(6);
  return str.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
