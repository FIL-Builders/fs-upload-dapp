"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useWithdraw } from "@filoz/synapse-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpFromLine } from "lucide-react";
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
import { numericString } from "./validation";

const withdrawSchema = z.object({ amount: numericString });
type WithdrawFormValues = z.infer<typeof withdrawSchema>;

export function WithdrawForm() {
  const { data: balances } = useBalances();
  const { config } = useStorageConfig();
  const { address, chainId } = useConnection();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const availableToFreeUp =
    balances.availableToFreeUp > 0n ? formatUnits(balances.availableToFreeUp, 18) : "0";

  const withdrawForm = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: balances.availableToFreeUp > 0n ? availableToFreeUp : "" },
  });

  const { mutate: withdraw, isPending: withdrawPending } = useWithdraw({
    onHash: (hash) => {
      toast.loading("Withdrawing funds...", {
        id: "withdraw",
        description: <ExplorerLink hash={hash} />,
      });
    },
    mutation: {
      onSuccess: () => {
        toast.success("Withdrawal complete!", { id: "withdraw" });
        withdrawForm.reset();
        setShowForm(false);
        queryClient.invalidateQueries({ queryKey: queryKeys.balances(address, config, chainId) });
      },
      onError: (error) => {
        toast.error(error.message);
        queryClient.invalidateQueries({ queryKey: queryKeys.balances(address, config, chainId) });
      },
    },
  });

  const watchedAmount = withdrawForm.watch("amount");
  const displayAmount = watchedAmount ? Number(Number(watchedAmount).toFixed(4)) : "";
  const formattedAvailable = Number(Number(formatUnits(balances.availableToFreeUp, 18)).toFixed(4));

  return (
    <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
            <ArrowUpFromLine className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-700 dark:text-green-300">Available to Withdraw</p>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">
              {formattedAvailable} USDFC
            </p>
          </div>
        </div>
        {!showForm && (
          <Button
            variant="outline"
            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"
            onClick={() => setShowForm(true)}
          >
            <ArrowUpFromLine className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        )}
      </div>

      {showForm && (
        <Form {...withdrawForm}>
          <form
            onSubmit={withdrawForm.handleSubmit((values) =>
              withdraw({ amount: parseUnits(values.amount, 18) }),
            )}
            className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 space-y-3"
          >
            <Label htmlFor="withdraw-amount" className="text-green-700 dark:text-green-300">
              Withdraw Amount (USDFC)
            </Label>
            <div className="flex gap-2">
              <FormField
                control={withdrawForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        id="withdraw-amount"
                        type="text"
                        inputMode="decimal"
                        placeholder={availableToFreeUp}
                        disabled={withdrawPending}
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
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  withdrawForm.reset();
                }}
                disabled={withdrawPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={withdrawPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                {withdrawPending
                  ? "Withdrawing..."
                  : displayAmount
                    ? `Withdraw ${displayAmount}`
                    : `Withdraw ${formattedAvailable}`}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
