"use client";

import { usePriceList } from "@filoz/synapse-react";
import { formatFee, removalOperationCost, terminateOperationCost } from "@/lib/operation-costs";

/**
 * Cost line for dataset termination confirmations. The user-initiated terminate
 * fee is drawn from the dataset's lifecycle lockup reserve; the reserve is
 * refunded when the payment rail is finalised.
 */
export function TerminateCostNote() {
  const { data: priceList } = usePriceList();
  if (!priceList) return null;

  const { fee, reserveReleased } = terminateOperationCost(priceList);

  return (
    <span>
      Termination fee: <strong>{formatFee(fee)} USDFC</strong> (user-initiated), drawn from this
      dataset&apos;s lockup reserve (~{formatFee(reserveReleased)} USDFC). The reserve is refundable
      and returned to your balance when the rail is finalised.
    </span>
  );
}

/**
 * Cost line for piece removal confirmations. A small per-call fee drawn from the
 * dataset's lifecycle lockup reserve (paid to the provider, like gas).
 */
export function RemovalCostNote() {
  const { data: priceList } = usePriceList();
  if (!priceList) return null;

  const { fee } = removalOperationCost(priceList);

  return (
    <span>
      Removal fee: <strong>{formatFee(fee)} USDFC</strong> per request, drawn from this
      dataset&apos;s lockup reserve (paid to the provider, like gas).
    </span>
  );
}
