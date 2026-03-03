# Filecoin Onchain Cloud dApp

A decentralized application that interacts with Filecoin Synapse, a smart-contract based marketplace for storage and related services in the Filecoin ecosystem.

## Overview

This dApp showcases:
- Connecting to Filecoin networks (Mainnet/Calibration)
- Integrating `synapse-sdk` and `synapse-react` into a Next.js project
- Session key management for signing storage operations without repeated wallet prompts
- Depositing and withdrawing USDFC funds to/from Synapse contracts
- Uploading files to Filecoin through Synapse in three modes: standard, CDN, and IPFS pin
- Browsing datasets and files with download, delete, and preview capabilities
- Dashboard with real-time balance, storage usage, and cost metrics

## Prerequisites

- Node.js 20.9+ and pnpm
- A web3 wallet (like MetaMask)
- Basic understanding of React and TypeScript
- tFIL tokens on Filecoin Calibration testnet [link to faucet](https://faucet.calibnet.chainsafe-fil.io/funds.html)
- USDFC tokens on Filecoin Calibration testnet [link to faucet](https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc)

## Getting Started

1. Clone this repository:
```bash
git clone https://github.com/FIL-Builders/fs-upload-dapp
cd fs-upload-dapp
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dApp.

For a detailed code walkthrough, see [tutorial.md](tutorial.md).

## Key Components

### Wallet Connection and Session Keys
The dApp uses RainbowKit for seamless wallet connection, configured for Filecoin Mainnet and Calibration (testnet). A session key system delegates signing to a local key, avoiding repeated wallet popups. Session keys are **optional** but significantly improve UX for multi-file, multi-copy upload workflows where many signing operations occur. Users can create, extend, and revoke sessions at any time.
- Session key provider: [link](src/providers/session-key/)
- Synapse client factory (integrates session key): [link](src/lib/synapse-client.ts)

### Dashboard
Shows how to:
- Query FIL, USDFC, and Synapse warm-storage balances for a complete user overview
- Determine storage sufficiency — whether current balance covers configured needs
- Calculate deposit shortfalls and safe withdrawal amounts via `fetchStorageMetrics`
- View storage usage, monthly cost rate, and remaining days of storage
- Per-dataset cost breakdowns with `getDatasetsCostInfo` (utilization, minimum rates, free capacity)
- Quick-action cards for common workflows
- Balance hook: [link](src/hooks/use-balances.ts)
- Storage metrics (core calculations): [link](src/lib/storage-metrics.ts)
- Storage overview hook: [link](src/hooks/use-storage-overview.ts)

### Pay for Storage with USDFC
Demonstrates how to:
- Deposit funds to Synapse contracts using USDFC (with ERC-20 approve flow)
- Withdraw unused balance at any time
- Dashboard shows remaining days of storage based on current usage and on-chain pricing
- Deposit flow: [link](src/components/pay/deposit.tsx)
- Withdraw flow: [link](src/components/pay/withdraw.tsx)

### File Upload
Shows how to:
- Upload **multiple files** with **multiple copies** across storage providers using synapse-sdk
- Use the **store-pull-commit** workflow — files are uploaded once to a primary provider, then secondary providers pull from it, saving bandwidth proportional to copy count
- Automatically check balance sufficiency before upload and trigger deposits if needed (considering minimum rates and CDN dataset creation costs)
- Three modes: standard (Filecoin Beam), CDN-enabled, and IPFS pin
- **Pin mode**: Wraps files into a CAR file (native IPFS format), uploads with IPFS indexing so storage providers announce on IPNI — making files retrievable from any public IPFS gateway
- Monitor per-provider upload progress in real time
- Upload hook: [link](src/app/upload/hooks/use-upload.ts)
- Pin upload hook: [link](src/app/upload/hooks/use-pin-upload.ts)
- Store-pull-commit workflow: [link](src/app/upload/lib/upload-to-contexts.ts)
- CAR builder: [link](src/app/upload/lib/filecoin-pin/car-builder.ts)
- IPNI advertisement verification: [link](src/app/upload/lib/filecoin-pin/wait-ipni-advertisement.ts)

### Datasets and Files
Shows how to:
- Browse datasets and inspect individual pieces, with size info extracted from piece CIDs
- Cross-dataset file view with deduplicated pieces across providers (`computeUniquePieces`)
- Per-dataset cost analysis with utilization and minimum-rate thresholds (`getDatasetsCostInfo`)
- Download files directly from Filecoin providers (with CID validation)
- Delete pieces and datasets
- Datasets page: [link](src/app/datasets/page.tsx)
- Dataset utilities: [link](src/lib/datasets.ts)
- Files page: [link](src/app/files/page.tsx)

## Learn More

- [Filecoin Onchain Cloud Documentation](https://docs.filecoin.cloud/)
- [Filecoin synapse-sdk](https://github.com/FilOzone/synapse-sdk)
- [USDFC Token Documentation](https://docs.secured.finance/usdfc-stablecoin/getting-started)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)
- Best practices in React!
  - [Tanstack Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
  - [Tanstack Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
