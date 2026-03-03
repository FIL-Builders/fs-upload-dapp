"use client";

import { useForm } from "react-hook-form";
import { useDepositAndApprove } from "@filoz/synapse-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatUnits, parseUnits } from "viem";
import { useConnection } from "wagmi";
import { z } from "zod";
import { queryKeys } from "@/lib/query-keys";
import { useBalances } from "@/hooks/use-balances";
import { useStorageConfig } from "@/providers/storage-config";
import { ExplorerLink } from "@/components/layout/explorer-link";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const numericString = z
  .string()
  .min(1, "Amount is required")
  .transform((v) => v.replace(/,/g, "").trim())
  .refine((v) => /^\d+\.?\d*$/.test(v), "Must be a valid number")
  .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0");

export const depositSchema = z.object({ amount: numericString });
export type DepositFormValues = z.infer<typeof depositSchema>;

export function DepositForm() {
  const { data: balances, isLoading } = useBalances();
  const { config } = useStorageConfig();
  const { address, chainId } = useConnection();
  const queryClient = useQueryClient();

  const depositNeeded = balances.depositNeeded > 0n ? formatUnits(balances.depositNeeded, 18) : "0";

  const depositForm = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: balances.depositNeeded > 0n ? depositNeeded : "" },
  });

  const { mutate: depositAndApprove, isPending: depositAndApprovePending } = useDepositAndApprove({
    onHash: (hash) => {
      toast.loading("Depositing funds...", {
        id: "deposit",
        description: <ExplorerLink hash={hash} />,
      });
    },
    mutation: {
      onSuccess: () => {
        toast.success("Deposit complete!", { id: "deposit" });
        depositForm.reset();
        queryClient.invalidateQueries({ queryKey: queryKeys.balances(address, config, chainId) });
      },
      onError: (error) => {
        toast.error(error.message);
        queryClient.invalidateQueries({ queryKey: queryKeys.balances(address, config, chainId) });
      },
    },
  });

  const watchedAmount = depositForm.watch("amount");
  const displayAmount = watchedAmount ? Number(Number(watchedAmount).toFixed(4)) : "";

  return (
    <div className="p-4 rounded-lg border bg-muted/30 border-muted">
      {balances.depositNeeded > 0n && (
        <div className="flex justify-between mb-4">
          <span className="text-sm text-muted-foreground">Suggested Deposit</span>
          <span className="font-semibold">
            {parseFloat(depositNeeded).toLocaleString(undefined, { maximumFractionDigits: 4 })} USDFC
          </span>
        </div>
      )}

      <Form {...depositForm}>
        <form
          onSubmit={depositForm.handleSubmit((values) =>
            depositAndApprove({ amount: parseUnits(values.amount, 18) }),
          )}
          className="space-y-3"
        >
          <Label htmlFor="deposit-amount">Deposit Amount (USDFC)</Label>
          <div className="flex gap-2">
            <FormField
              control={depositForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      id="deposit-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder={balances.depositNeeded > 0n ? depositNeeded : "0.0"}
                      disabled={depositAndApprovePending}
                      {...field}
                      onChange={(e) => {
                        // Allow digits, decimal point, and commas (will be sanitized on submit)
                        const value = e.target.value.replace(/[^\d.,]/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={depositAndApprovePending || isLoading}>
              <CreditCard className="h-4 w-4 mr-2" />
              {depositAndApprovePending
                ? "Processing..."
                : displayAmount
                  ? `Deposit ${displayAmount}`
                  : balances.depositNeeded > 0n
                    ? `Deposit ${parseFloat(depositNeeded).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
                    : "Configure & Deposit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
