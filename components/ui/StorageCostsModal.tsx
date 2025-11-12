"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/** Props for StorageCostsModal component */
type StorageCostsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal explaining Filecoin storage costs and pricing model.
 * Provides detailed breakdown of storage costs, CDN pricing, and real-world examples.
 * Helps users understand the pay-per-epoch model and budget effectively.
 *
 * @param isOpen - Modal visibility state
 * @param onClose - Callback to close modal
 *
 * @example
 * ```tsx
 * <StorageCostsModal
 *   isOpen={showCosts}
 *   onClose={() => setShowCosts(false)}
 * />
 * ```
 */
export function StorageCostsModal({ isOpen, onClose }: StorageCostsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Storage Costs"
      footer={
        <Button onClick={onClose} variant="primary">
          Got it
        </Button>
      }
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Introduction */}
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            Storage operates on a <strong>pay-per-epoch</strong> model where you
            deposit USDFC tokens and set allowances that control spending.
          </p>
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-medium mb-1"
              style={{ color: "var(--foreground)" }}
            >
              What is an Epoch?
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              An <strong>epoch</strong> is Filecoin&apos;s block time (30
              seconds). Storage costs are calculated per epoch, so you only pay
              for actual usage time.
            </p>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="space-y-2">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Pricing Components
          </h3>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: "var(--muted)" }}>
                  <th
                    className="text-left p-2 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Component
                  </th>
                  <th
                    className="text-left p-2 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Cost
                  </th>
                  <th
                    className="text-left p-2 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTopColor: "var(--border)" }}>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Storage
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    $2.50/TiB/month
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--muted-foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Min $0.06/month per dataset (~24.567 GiB threshold)
                  </td>
                </tr>
                <tr>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    CDN Egress
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    $14/TiB
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--muted-foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    1 USDFC top-up ≈ 71.5 GiB of downloads
                  </td>
                </tr>
                <tr>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    CDN Setup
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    1 USDFC
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--muted-foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    One-time per dataset; reusing datasets = no cost
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            className="text-xs italic"
            style={{ color: "var(--muted-foreground)" }}
          >
            * Per month means per 30 days, not calendar month
          </p>
        </div>

        {/* Pricing Logic */}
        <div className="space-y-2">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Pricing Logic
          </h3>
          <ul
            className="space-y-1 text-xs"
            style={{ color: "var(--foreground)" }}
          >
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>•</span>
              <span>
                Storage <strong>&lt; 24.567 GiB</strong>: Minimum $0.06/month
                applies
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>•</span>
              <span>
                Storage <strong>≥ 24.567 GiB</strong>: Actual cost = (bytes /
                TiB) × $2.50/month
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>•</span>
              <span>
                CDN datasets require 1 USDFC setup on first creation only
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>•</span>
              <span>CDN egress credits can be topped up anytime</span>
            </li>
          </ul>
        </div>

        {/* Example 1: NFT Collection */}
        <div className="space-y-2">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Example 1: NFT Collection
          </h3>
          <div
            className="p-3 rounded-lg space-y-2"
            style={{
              backgroundColor: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--foreground)" }}>
              <strong>10,000 × 5 KiB ≈ 48.82 MiB</strong> (below 24.567 GiB
              threshold)
            </p>
            <div
              className="rounded border overflow-hidden"
              style={{ borderColor: "var(--border)" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--background)" }}>
                    <th
                      className="text-left p-2 font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Duration
                    </th>
                    <th
                      className="text-right p-2 font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className="p-2 border-t"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      1 month
                    </td>
                    <td
                      className="p-2 border-t text-right"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      0.06 USDFC
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="p-2 border-t"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      24 months
                    </td>
                    <td
                      className="p-2 border-t text-right"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      1.44 USDFC
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Example 2: User Content Platform */}
        <div className="space-y-2">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Example 2: User Content Platform with CDN
          </h3>
          <div
            className="p-3 rounded-lg space-y-2"
            style={{
              backgroundColor: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="space-y-1 text-xs"
              style={{ color: "var(--foreground)" }}
            >
              <p>
                <strong>Storage:</strong> 1,000 users × 100 MiB ≈ 100,000 MiB
              </p>
              <p>
                <strong>Traffic:</strong> 1,000 users × 500 MiB/month ≈ 500,000
                MiB/month egress
              </p>
            </div>
            <div
              className="rounded border overflow-hidden"
              style={{ borderColor: "var(--border)" }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--background)" }}>
                    <th
                      className="text-left p-2 font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Cost Component
                    </th>
                    <th
                      className="text-right p-2 font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Per Month
                    </th>
                    <th
                      className="text-right p-2 font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      24 Months
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className="p-2 border-t"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Storage
                    </td>
                    <td
                      className="p-2 border-t text-right"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      ≈ 0.238 USDFC
                    </td>
                    <td
                      className="p-2 border-t text-right"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      ≈ 5.71 USDFC
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="p-2 border-t"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      CDN Egress
                    </td>
                    <td
                      className="p-2 border-t text-right"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      ≈ 3.332 USDFC
                    </td>
                    <td
                      className="p-2 border-t text-right"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      ≈ 79.97 USDFC
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: "var(--muted)" }}>
                    <td
                      className="p-2 border-t font-semibold"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Total
                    </td>
                    <td
                      className="p-2 border-t text-right font-semibold"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      ≈ 3.57 USDFC
                    </td>
                    <td
                      className="p-2 border-t text-right font-semibold"
                      style={{
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      ≈ 85.68 USDFC
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Key Takeaways */}
        <div
          className="p-3 rounded-lg border space-y-2"
          style={{
            backgroundColor: "var(--muted)",
            borderColor: "var(--border)",
          }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Key Takeaways
          </h3>
          <ul
            className="space-y-1 text-xs"
            style={{ color: "var(--foreground)" }}
          >
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>✓</span>
              <span>Costs are calculated per epoch (30 seconds)</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>✓</span>
              <span>
                Don&apos;t create lot of small datasets, create a few large
                datasets instead. This will help you save the minimum pricing
                per dataset.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>✓</span>
              <span>CDN adds egress costs but improves retrieval speed</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--primary)" }}>✓</span>
              <span>Always maintain 30+ days buffer to avoid data removal</span>
            </li>
          </ul>
        </div>

        {/* Service Approvals */}
        <div className="space-y-2">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Service Approvals
          </h3>
          <p className="text-xs" style={{ color: "var(--foreground)" }}>
            Before uploading, approve the <strong>WarmStorage operator</strong>{" "}
            and fund your account. FWSS requires a 30-day prepayment buffer—when
            your balance drops below 30 days, the provider may remove your data.
          </p>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: "var(--muted)" }}>
                  <th
                    className="text-left p-2 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Component
                  </th>
                  <th
                    className="text-left p-2 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Deposit Amount
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--muted-foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    USDFC tokens for storage duration
                  </td>
                </tr>
                <tr>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Rate Allowance
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--muted-foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Max spending per epoch (cumulative)
                  </td>
                </tr>
                <tr>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Lockup Allowance
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--muted-foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    30-day prepayment buffer (cumulative)
                  </td>
                </tr>
                <tr>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Max Lockup Period
                  </td>
                  <td
                    className="p-2 border-t"
                    style={{
                      color: "var(--muted-foreground)",
                      borderColor: "var(--border)",
                    }}
                  >
                    86,400 epochs (30 days safety limit)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
