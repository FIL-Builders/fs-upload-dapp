"use client";

import { useAddUsdfc, useERC20Balance, useFundWallet } from "@filoz/synapse-react";
import { mainnet } from "@filoz/synapse-sdk";
import {
  ArrowUpRight,
  Check,
  CircleDot,
  Copy,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useBalance, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { formatBalance, truncate as truncateMiddle } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useClipboard } from "@/hooks/use-clipboard";
import { getSessionDisplay, useSessionStatus, useSessionStore } from "@/providers/session-key";
import { ExplorerLink } from "@/components/layout/explorer-link";
import { Filecoin, Usdfc } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CHAIN_NAMES, SUPPORTED_CHAINS } from "./wallet-constants";
import { useWalletStore } from "./wallet-store";

export function WalletModal() {
  const { modalOpen, closeModal } = useWalletStore();
  const { address, chain, isConnected } = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain } = useSwitchChain();
  const { copy } = useClipboard();
  const { hasValidSession, status: sessionStatus } = useSessionStatus();
  const openSessionModal = useSessionStore((s) => s.openModal);
  const { data: balance } = useBalance({ address });
  const { data: erc20Balance } = useERC20Balance({ address });
  const { mutate: addUsdfc } = useAddUsdfc();
  const { mutate: fundWallet } = useFundWallet({
    mutation: {
      onSuccess: () => {
        toast.success("Funded wallet", { id: "fund-wallet" });
      },
      onError: () => {
        if (chain?.id === mainnet.id) {
          toast.error("Funding wallet is not supported on mainnet", { id: "fund-wallet" });
        } else {
          toast.error("Funding wallet failed", { id: "fund-wallet" });
        }
      },
    },
    onHash: (hash) => {
      toast.loading("Funding wallet...", {
        description: <ExplorerLink hash={hash} />,
        id: "fund-wallet",
      });
    },
  });

  const {
    label: sessionLabel,
    iconClass: sessionIconClass,
    badgeClass: sessionBadgeClass,
  } = getSessionDisplay(sessionStatus, hasValidSession);

  if (!isConnected) return null;

  return (
    <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden">
        {/* Header with address */}
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <WalletIcon className="size-5" />
              Wallet
            </span>
            <button
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-normal text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={() => {
                copy(address ?? "");
                toast.success("Copied to clipboard", { id: "copy-address" });
              }}
            >
              <span className="font-mono">{truncateMiddle(address ?? "", 6)}</span>
              <Copy className="size-3" />
            </button>
          </DialogTitle>
        </DialogHeader>

        {/* Balances */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-full flex items-center justify-center">
                  <Filecoin className="size-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">FIL</span>
              </div>
              <p className="text-lg font-semibold tabular-nums">
                {formatBalance(balance?.value ?? 0n, 18, 1)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-full  flex items-center justify-center">
                  <Usdfc className="size-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">USDFC</span>
              </div>
              <p className="text-lg font-semibold tabular-nums">
                {formatBalance(erc20Balance?.value ?? 0n, 18, 1)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Network */}
        <div className="px-5 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Network</p>
          <div className="flex gap-2">
            {SUPPORTED_CHAINS.map((c) => {
              const isActive = chain?.id === c.id;
              return (
                <button
                  key={c.id}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => !isActive && switchChain({ chainId: c.id })}
                >
                  {isActive && <Check className="size-3.5" />}
                  {CHAIN_NAMES[c.id]}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Session key */}
        <button
          className="flex w-full items-center justify-between px-5 py-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => {
            closeModal();
            openSessionModal();
          }}
        >
          <span className="flex items-center gap-2">
            <KeyRound className={cn("size-4", sessionIconClass)} />
            <span className="font-medium">Session Key</span>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              sessionBadgeClass,
            )}
          >
            <CircleDot className="size-3" />
            {sessionLabel}
          </span>
        </button>

        <Separator />

        {/* Quick actions */}
        <div className="px-5 py-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-2">Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full" onClick={() => addUsdfc()}>
              <Plus className="size-3.5" />
              Add USDFC
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => fundWallet()}>
              <RefreshCw className="size-3.5" />
              Fund Wallet
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => window.open("https://docs.filecoin.cloud", "_blank")}
          >
            Docs
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>

        <Separator />

        {/* Disconnect */}
        <div className="px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              disconnect();
              closeModal();
            }}
          >
            <LogOut className="size-3.5" />
            Disconnect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
