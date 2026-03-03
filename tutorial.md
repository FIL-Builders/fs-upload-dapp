# 🚀 Understanding the Filecoin Synapse dApp

This tutorial explains how the **fs-upload-dapp** works—a production-ready Next.js application demonstrating file storage on Filecoin using the **synapse-sdk**. Instead of building from scratch, you'll explore the core workflows and understand how hooks and utilities power the application. 📚

[synapse-sdk](https://github.com/FilOzone/synapse-sdk) is a JS/TS SDK for interacting with **Filecoin Synapse** — a smart-contract based marketplace for a collection of services derived from the Filecoin ecosystem, such as Filecoin onchain payment service, hot storage service using PDP, retrieval service, etc. 🛠️

## ⚡ Quick Start

1. **Clone and Setup:** 📥

```sh
# Clone the repository and start the app
git clone https://github.com/FIL-Builders/fs-upload-dapp
cd fs-upload-dapp
pnpm install
pnpm dev
```

2. **Prerequisites:** 📋

- [Node.js](https://nodejs.org/en) 20.9+ and [pnpm](https://pnpm.io/) 📦
- A Web3 wallet (like MetaMask) with some test USDFC & tFIL tokens 💰
- Basic knowledge of React and TypeScript 💻
- Basic understanding of blockchain concepts ⛓️

3. **Acquire Testnet Tokens:** 🪙

- **tFIL**: [Filecoin Calibration Faucet](https://faucet.calibnet.chainsafe-fil.io/funds.html) for gas fees. ⛽
- **tUSDFC**: [ChainSafe USDFC Faucet](https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc) (limit \$5 per request). 💵

## 📁 Project Structure

```
src/
  app/                        # Next.js pages and route-scoped features
    page.tsx                  # Dashboard (/)
    layout.tsx                # Root layout with providers and shell
    upload/                   # /upload route — file upload flow
      page.tsx
      types.ts                # UploadMode, UploadPhase, PieceResult, etc.
      hooks/                  # useUpload, useFilecoinPinUpload, useUploadPhase
      lib/                    # uploadToContexts, CAR builder, IPNI polling
      components/
        uploader.tsx          # Main upload orchestrator component
        upload-results/       # Upload result display
        upload-section/       # File drop zone, mode selector, file list
        upload-status-panel/  # Per-provider progress timeline
    datasets/                 # /datasets route — dataset list and detail
      page.tsx
      components/             # DatasetsList, DatasetDetail, PieceRow
    files/                    # /files route — cross-dataset file view
      page.tsx
      components/             # FilesContent, FileRow
  components/
    ui/                       # Reusable primitives (shadcn/Radix)
    layout/                   # Navbar, Footer, WalletGuard, WalletMenu
    home/                     # BalanceCards, StorageDashboard, QuickActions
    storage/                  # PiecePreviewModal, PieceActions, FilePreview, CostBreakdown
    pay/                      # Deposit, Withdraw
  hooks/                      # Shared data-fetching hooks
    use-balances.ts           # FIL, USDFC, Synapse balances + storage metrics (React Query)
    use-storage-overview.ts   # useStorageOverview — combined dashboard data
    use-download.ts           # Piece download with CID validation
    use-delete.ts             # Piece and dataset deletion mutations
  lib/                        # Pure utilities and constants
    synapse-client.ts         # getSynapseClient() factory with session key integration
    datasets.ts               # transformDatasets, computeUniquePieces, getDatasetsCostInfo
    storage-metrics.ts        # fetchStorageMetrics, computeDashboardMetrics
    query-keys.ts             # Centralized React Query keys
    format.ts                 # Number and capacity formatting
    decimal.ts                # Precision math and storage cost calculations
    piece.ts                  # Piece URL builder
  providers/                  # React context providers + Zustand stores
    web3-provider/            # Wagmi + RainbowKit + TanStack Query setup
    wallet/                   # Wallet connection modal and store
    session-key/              # Session key lifecycle (create, extend, revoke)
    storage-config/           # User storage preferences (localStorage)
```

## 📱 App Overview

The application is organized into several primary workflows, powered by custom hooks and utilities:

- **💰 Balance & Storage Management:** [`useBalances`](src/hooks/use-balances.ts), [`fetchStorageMetrics`](src/lib/storage-metrics.ts)
- **💳 Storage Payments with USDFC:** [`deposit`](src/components/pay/deposit.tsx), [`withdraw`](src/components/pay/withdraw.tsx)
- **📤 File Uploads:** [`useUpload`](src/app/upload/hooks/use-upload.ts), [`useFilecoinPinUpload`](src/app/upload/hooks/use-pin-upload.ts)
- **🔍 Dataset Management:** [`useDataSets`](https://github.com/FilOzone/synapse-sdk) (from `@filoz/synapse-react`), [`transformDatasets`](src/lib/datasets.ts)
- **📥 File Downloads:** [`useDownload`](src/hooks/use-download.ts)

## 🔑 Session Key Flow

Session keys allow the app to sign storage operations without prompting the wallet each time. **They are optional** — the app works without them, but for workflows involving multiple files and copies, session keys dramatically improve UX by eliminating repeated wallet popups. ✨

1. 🖱️ **User clicks "Create Session"** in the session modal (or is prompted automatically on first upload)
2. ⚡ **`SessionKey.login()`** creates a delegated key with `DefaultFwssPermissions`
3. 💾 **Key is stored** in the Zustand session store (persisted to localStorage, scoped per address + chain)
4. 🔧 **`getSynapseClient()`** builds a Synapse client using the stored session key — if no session exists and one is needed, it opens the session modal and waits
5. 📤 **Upload, delete, and dataset operations** use this client transparently
6. 🔄 **Users can extend or revoke** sessions at any time (1–31 day duration)

Key files:

- [`session-store.ts`](src/providers/session-key/session-store.ts) — Zustand store with status derivation (`none` / `expired` / `expiring` / `valid`)
- [`use-session.ts`](src/providers/session-key/use-session.ts) — Login, revoke, and on-chain validation hooks
- [`synapse-client.ts`](src/lib/synapse-client.ts) — Factory that integrates session key into Synapse client

## 💰 Balance & Storage Management

The dashboard and payment UI are built around these modules:

### How it Works

The [`useBalances`](src/hooks/use-balances.ts) hook gives a complete overview of a user's tokens and storage-related balances:

- **💰 Wallet Balances**: FIL and USDFC in your wallet
- **🏦 Synapse Contract Balance**: USDFC deposited in Synapse for storage payments (`warmStorageBalance`)
- **📊 Storage Sufficiency**: Whether current balance covers your configured storage needs
- **⏰ Persistence**: Days remaining at current usage rate and at maximum configured capacity
- **💸 Deposit Needed**: Exact shortfall amount if balance is insufficient

Under the hood, `useBalances` calls [`fetchStorageMetrics`](src/lib/storage-metrics.ts) — the main calculation engine that determines:

- **Rate and lockup allowance sufficiency** — checks that Synapse contract approvals are set
- **Deposit needs** — calculates the exact USDFC shortfall considering:
  - On-chain `minimumPricePerMonth` (~$0.06/month per dataset minimum rate)
  - 1 USDFC upfront cost for CDN-enabled dataset creation
  - Your configured storage capacity and persistence period
- **Withdraw safety** — `availableToFreeUp` shows excess funds beyond your configured needs, so you can withdraw without affecting storage

The [`useStorageOverview`](src/hooks/use-storage-overview.ts) hook combines balances and datasets into dashboard metrics, returning `{ balances, datasets, metrics, isLoading }`.

Pure calculations live in [`storage-metrics.ts`](src/lib/storage-metrics.ts) — days left, monthly rates, required capacity, and cost previews for configuration changes.

### 💸 How Payments Work

The Synapse payment system uses two complementary allowances:

#### 1. **Rate Allowance** (`rateAllowance`)

- **Definition:** Maximum USDFC the FilecoinWarmStorageService can spend per epoch.
- **Purpose:** Automates payments to storage providers for ongoing storage.
- **Calculation:** Proportional to your storage needs — higher storage requirements demand higher epoch rates. 📈

#### 2. **Lockup Allowance** (`lockupAllowance`)

- **Definition:** Total USDFC that FilecoinWarmStorageService can reserve upfront to guarantee storage provider payments for your target persistence duration.
- **Purpose:** Secures payment for the entire storage period and enables uninterrupted Proof of Data Possession (PDP) validation. 🔐
- **Calculation:** (Rate allowance × target persistence days) + existing lockup commitments

### ⚙️ Storage Configuration

Users can configure storage preferences via the storage config provider, persisted to localStorage:

- **Higher storage capacity** → Increased rate and lockup allowances 📈
- **Longer persistence period** → Higher lockup allowance (more epochs to cover) ⏰
- **CDN enabled** → Lightning ⚡ fast retrievals for a higher price 💰

Config store: [`storage-config-store.ts`](src/providers/storage-config/storage-config-store.ts)

## 📤 File Uploads with Synapse SDK

The upload system supports **multi-file, multi-copy** uploads across three modes:

| Mode         | Description                                                      | Hook                   |
| ------------ | ---------------------------------------------------------------- | ---------------------- |
| **Standard** | Store files on Filecoin storage providers                                        | `useUpload`            |
| **CDN**      | Standard + Filecoin Beam (CDN service addon) for fast retrieval                  | `useUpload`            |
| **Pin**      | Standard + Filecoin Pin (IPFS service addon) — builds a CAR file, produces a root CID | `useFilecoinPinUpload` |

### How it Works

The [`useUpload`](src/app/upload/hooks/use-upload.ts) hook orchestrates the full upload process:

1. 🔧 **Session Key Initialization**: Calls `getSynapseClient()` which checks for a stored session key. If none exists, it automatically opens the session creation modal and waits. Session keys are **optional** but dramatically improve UX for multi-copy, multi-file workflows by avoiding wallet prompts on every operation.

2. 📦 **Context Creation**: Based on the number of copies requested, `synapse.storage.createContexts()` creates or reuses datasets (one per provider/copy).

3. 💰 **Balance & Cost Check**: Calls [`fetchStorageMetrics`](src/lib/storage-metrics.ts) with `totalSize * copies` to determine if the user's balance can cover the upload. This accounts for:
   - The minimum rate of ~$0.06/month per dataset (on-chain `minimumPricePerMonth`)
   - 1 USDFC auto-topup of Filecoin Beam credits on dataset creation with CDN addon
   - Rate and lockup allowance approvals

   If the balance is insufficient, it automatically triggers a `depositAndApprove()` with the exact shortfall — the user doesn't need to manually calculate and deposit.

4. 📤 **Store-Pull-Commit**: [`uploadToContexts`](src/app/upload/lib/upload-to-contexts.ts) executes the core upload workflow:
   - **Store** 📦: Files are uploaded **once** to the primary storage provider
   - **Pull** 🔄: All secondary providers pull files **from the primary provider** — this is key because you save upload bandwidth proportional to your copy count (e.g., 3 copies = 1 upload instead of 3)
   - **Commit** ✅: Each provider confirms the pieces are committed to their dataset on-chain (presigned to avoid wallet prompts during commit)

5. 📊 **Results**: Returns `{ pieces, failures }` — pre-grouped by piece, with provider details per piece

### 📌 Filecoin Pin Mode

For **Pin mode**, [`useFilecoinPinUpload`](src/app/upload/hooks/use-pin-upload.ts) wraps your files into a **CAR file** (Content-Addressable Archive) — the native way to structure files on IPFS:

- [`car-builder.ts`](src/app/upload/lib/filecoin-pin/car-builder.ts) 🏗️ — Builds a CAR file from selected files, preserving directory structure. Single files get a direct CID; multiple files/folders get a directory CID as root.

- **IPFS Indexing**: Uploading with `withIPFSIndexing` metadata tells storage providers to **announce your content on IPNI** (part of the IPFS network). This means your files become publicly retrievable from **any IPFS gateway** (e.g., `https://ipfs.io/ipfs/<rootCid>`).

- **IPFS Root CID vs Piece CID**: The `ipfsRootCid` (the IPFS content hash) is different from the `pieceCid` (Filecoin's storage identifier). The IPFS root CID is stored as **on-chain metadata** alongside the piece, so you don't need to recompute it — it's always available when querying your datasets.

- [`wait-ipni-advertisement.ts`](src/app/upload/lib/filecoin-pin/wait-ipni-advertisement.ts) 📡 — After upload, polls IPNI indexers (up to 20 retries, 5s intervals) to verify that providers have announced your content and it's accessible from public gateways.

### 📊 Upload Progress

The [`useUploadPhase`](src/app/upload/hooks/use-upload-phase.ts) hook merges pure state transforms with React state for real-time progress tracking per provider.

## 🔍 Dataset Management & Files

### Dataset Viewer

Browse datasets and inspect individual pieces with the datasets page ([`page.tsx`](src/app/datasets/page.tsx)):

- `useDataSets` (from `@filoz/synapse-react`) — fetches all datasets associated with your address from on-chain data
- [`transformDatasets()`](src/lib/datasets.ts) — normalizes raw SDK datasets into app-friendly format, extracting **size info for each piece** from the piece CID via `getPieceInfoFromCid()` and accumulating total dataset size
- [`getDatasetsCostInfo()`](src/lib/datasets.ts) — calculates per-dataset monthly storage costs, showing utilization percentage, whether the minimum rate applies, and remaining free capacity within the minimum-rate threshold
- [`computeUniquePieces()`](src/lib/datasets.ts) — deduplicates pieces across multiple datasets for the cross-dataset file view, merging metadata and tracking which datasets contain each piece

### 📥 File Downloads

The [`useDownload`](src/hooks/use-download.ts) hook downloads pieces from storage providers, validates the content against the expected piece CID, auto-detects the MIME type, and triggers a browser download.

### 🗑️ Delete Operations

The [`useDelete`](src/hooks/use-delete.ts) hook handles piece and dataset deletion mutations, using the session key for signing when available.

## 🚀 Next Steps

- **📊 Monitor Storage**: Use the dataset viewer to track your stored data
- **💡 Optimize Costs**: Adjust persistence periods based on usage patterns
- **📈 Scale Up**: Increase storage capacity and deposit additional USDFC as your data usage grows
- **🔧 Integrate**: Use the patterns to build your own decentralized powered storage applications

## 📚 Resources

- **Filecoin Onchain Cloud**: [Documentation](https://docs.filecoin.cloud/) — core concepts, developer guides, and API reference for Synapse SDK
- **Source Code**: [GitHub Repository](https://github.com/FIL-Builders/fs-upload-dapp)
- **Synapse SDK**: [NPM Package](https://www.npmjs.com/package/@filoz/synapse-sdk)
- **PDP**: [PDP Docs](https://github.com/FilOzone/pdp/blob/main/docs/design.md)
- **Payments contract**: [Payments Contracts](https://github.com/FilOzone/filecoin-services-payments/blob/main/README.md)
- **FilecoinWarmStorageService**: [FilecoinWarmStorageService Contracts](https://github.com/FilOzone/filecoin-services/blob/main/README.md)
- **USDFC Documentation**: [Secured Finance](https://docs.secured.finance/usdfc-stablecoin/getting-started)

## 🛠️ Useful Commands

```sh
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm lint           # Run ESLint
pnpm format         # Format all source files
pnpm format:check   # Check formatting without writing
```
