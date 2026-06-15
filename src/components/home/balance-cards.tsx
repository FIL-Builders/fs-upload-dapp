"use client";

import { CreditCard, HardDrive, Wallet } from "lucide-react";
import { DECIMAL_PLACES, formatBalance } from "@/lib/format";
import { useBalances } from "@/hooks/use-balances";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceCardProps {
  icon: React.ElementType;
  label: string;
  value: string; // Decimal string for precision
  unit: string;
  isLoading: boolean;
  subValue?: string;
}

function BalanceCard({ icon: Icon, label, value, unit, isLoading, subValue }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <CardDescription>{label}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <>
            <p className="text-2xl font-bold">
              {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
            </p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function BalanceCards() {
  const { data: balances, isLoading } = useBalances();

  const hasLocked = balances.warmStorageLockedFunds > 0n;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <BalanceCard
        icon={Wallet}
        label="FIL Balance"
        value={formatBalance(balances.filBalance, 18, DECIMAL_PLACES.FIL)}
        unit="FIL"
        isLoading={isLoading}
      />
      <BalanceCard
        icon={CreditCard}
        label="USDFC Balance"
        value={formatBalance(balances.usdfcBalance, 18, DECIMAL_PLACES.USDFC)}
        unit="USDFC"
        isLoading={isLoading}
      />
      <BalanceCard
        icon={HardDrive}
        label="Storage Balance (available)"
        value={formatBalance(balances.warmStorageBalance, 18, DECIMAL_PLACES.USDFC)}
        unit="USDFC"
        isLoading={isLoading}
        subValue={
          hasLocked
            ? `+ ${formatBalance(balances.warmStorageLockedFunds, 18, DECIMAL_PLACES.USDFC)} USDFC locked (refundable reserves & runway)`
            : undefined
        }
      />
    </div>
  );
}
