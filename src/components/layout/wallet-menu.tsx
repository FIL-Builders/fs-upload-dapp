import { useAddUsdfc, useERC20Balance, useFundWallet } from "@filoz/synapse-react";
import { mainnet } from "@filoz/synapse-sdk";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowUpRight, ChevronDown, Copy, KeyRound, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useBalance, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { formatBalance, truncate as truncateMiddle } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useClipboard } from "@/hooks/use-clipboard";
import { getSessionDisplay, useSessionStatus, useSessionStore } from "@/providers/session-key";
import { CHAIN_NAMES, SUPPORTED_CHAINS, useWalletStore } from "@/providers/wallet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExplorerLink } from "./explorer-link";
import { Filecoin, Usdfc } from "./icons";

export function WalletMenu() {
  const { address, chain, isConnected } = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const { copy } = useClipboard();
  const { hasValidSession, status: sessionStatus } = useSessionStatus();
  const openSessionModal = useSessionStore((s) => s.openModal);
  const openWalletModal = useWalletStore((s) => s.openModal);
  const { data: balance } = useBalance({ address });

  const { mutate: switchChain } = useSwitchChain();

  const handleSwitchChain = (chainId: number) => {
    switchChain({ chainId });
  };

  const { mutate: addUsdfc } = useAddUsdfc();
  const { data: erc20Balance } = useERC20Balance({ address });
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
    menuLabel: sessionStatusLabel,
    iconClass: sessionIconClass,
  } = getSessionDisplay(sessionStatus, hasValidSession);

  const filBalancePreview = formatBalance(balance?.value ?? 0n, 18, 1);
  const usdfcBalancePreview = formatBalance(erc20Balance?.value ?? 0n, 18, 1);

  if (!isConnected) {
    return <ConnectButton chainStatus="name" accountStatus="avatar" showBalance={false} />;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Mobile: icon-only button → opens WalletModal */}
      <Button
        size="default"
        variant="outline"
        className="flex md:hidden items-center gap-2 cursor-pointer p-2"
        onClick={openWalletModal}
      >
        <KeyRound className={cn("size-4 transition-colors", sessionIconClass)} />
        <div className="h-8 w-px bg-border" />
        <Wallet className="size-4" />
      </Button>

      {/* Desktop: full balances dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="default"
            variant="outline"
            className="hidden md:flex items-center gap-2 cursor-pointer p-2"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <KeyRound className={cn("size-4 transition-colors", sessionIconClass)} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{sessionLabel}</TooltipContent>
            </Tooltip>
            <div className="h-8 w-px bg-border" />
            <span className="flex items-center justify-between gap-2 w-full">
              <span className="inline-flex items-center gap-2">
                {filBalancePreview}
                <Filecoin />
              </span>
              <div className="h-8 w-px bg-border" />
              <span className="inline-flex items-center gap-2">
                {usdfcBalancePreview}
                <Usdfc />
              </span>
              <div className="h-8 w-px bg-border" />
              <Wallet className="size-4" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Wallet</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                copy(address ?? "");
                toast.success("Copied to clipboard", { id: "copy-address" });
              }}
            >
              {truncateMiddle(address ?? "", 7)}
              <DropdownMenuShortcut>
                <Copy />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {filBalancePreview} FIL
              <DropdownMenuShortcut>
                <Filecoin />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {usdfcBalancePreview} USDFC
              <DropdownMenuShortcut>
                <Usdfc />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" onClick={openSessionModal}>
              {sessionStatusLabel}
              <DropdownMenuShortcut>
                <KeyRound className={cn("size-4 transition-colors", sessionIconClass)} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Tools</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" onClick={() => addUsdfc()}>
              Add USDFC Token
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => fundWallet()}>
              Fund Wallet
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => window.open("https://docs.filecoin.cloud", "_blank")}
            >
              Docs
              <DropdownMenuShortcut>
                <ArrowUpRight />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => disconnect()}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Chain selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="default" variant="outline" className="hidden md:flex items-center gap-1">
            <span className="hidden lg:inline">{chain?.name}</span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {SUPPORTED_CHAINS.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => handleSwitchChain(c.id)}>
                {CHAIN_NAMES[c.id]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
