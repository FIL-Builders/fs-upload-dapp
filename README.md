# Filecoin Onchain Cloud dApp

A starter kit for building on [Filecoin Onchain Cloud](https://docs.filecoin.cloud/) — upload, manage, and pay for decentralized storage using the [Synapse SDK](https://github.com/FilOzone/synapse-sdk).

## What's Inside

- **Multi-file, multi-copy uploads** with three modes: standard, [Filecoin Beam](https://docs.filecoin.cloud/core-concepts/fwss-overview.md) (CDN addon), and Filecoin Pin (IPFS addon)
- **Store-pull-commit workflow** — upload once, providers replicate from each other, saving bandwidth
- **USDFC payments** — deposit, withdraw, and auto-topup with balance sufficiency checks
- **Session keys** — optional delegated signing for seamless multi-operation workflows
- **Dashboard** — real-time balances, storage metrics, and per-dataset cost breakdowns
- **Dataset & file browsing** — inspect pieces, download with CID validation, delete

## Quick Start

```bash
git clone https://github.com/FIL-Builders/fs-upload-dapp
cd fs-upload-dapp
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need a web3 wallet with testnet tokens — the app includes a built-in faucet under the wallet menu's **Add Funds** option in the navbar, or use these directly:

- **tFIL** — [Calibration Faucet](https://faucet.calibnet.chainsafe-fil.io/funds.html)
- **tUSDFC** — [ChainSafe Faucet](https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc) (limit $5/request)

For a detailed code walkthrough of every workflow, see [tutorial.md](tutorial.md).

## Documentation

| Resource | Description |
| -------- | ----------- |
| [tutorial.md](tutorial.md) | Code walkthrough of every workflow in this dApp |
| [AGENTS.md](AGENTS.md) | Agent-optimized codebase reference (architecture, file map, all APIs) |
| [Filecoin Onchain Cloud Docs](https://docs.filecoin.cloud/) | Core concepts, developer guides, API reference |
| [Synapse SDK](https://github.com/FilOzone/synapse-sdk) | SDK source and examples |
| [USDFC Docs](https://docs.secured.finance/usdfc-stablecoin/getting-started) | Stablecoin used for storage payments |

## Stack

Next.js 16 (static export) · React 19 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Wagmi 3 · RainbowKit · TanStack Query · Zustand

## Contributing

Contributions welcome — feel free to open a PR.

## License

MIT
