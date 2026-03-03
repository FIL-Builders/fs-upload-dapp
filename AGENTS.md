# AGENTS.md

Agent-optimized reference for the fs-upload-dapp codebase. Every function includes its file path.

## Project

Filecoin Onchain Cloud dApp — Next.js app for uploading/managing files on Filecoin via Synapse SDK. Three upload modes (standard, CDN, IPFS pin), session key management, USDFC deposit/withdraw, dataset browsing.

**Stack:** Next.js 16 (static export, App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Wagmi 3, RainbowKit, TanStack Query, Zustand, Decimal.js

**Commands:**

```
pnpm dev              # Dev server at http://localhost:3000
pnpm build            # Production build (static export to out/)
pnpm lint             # ESLint
pnpm format           # Prettier (run after every change)
pnpm format:check     # Check formatting
```

No test suite exists.

## Architecture

**Path alias:** `@/*` → `./src/*`

### Layers

| Layer     | Location          | Rule                                                   |
| --------- | ----------------- | ------------------------------------------------------ |
| Pages     | `src/app/`        | Next.js App Router routes                              |
| Components| `src/components/` | Reusable UI; shadcn primitives in `ui/`                |
| Hooks     | `src/hooks/`      | Data fetching, mutations, React Query, toast, Zustand  |
| Libs      | `src/lib/`        | Pure stateless functions and transformations            |
| Providers | `src/providers/`  | Context providers wrapping Zustand stores              |

### Provider stack (root layout, `src/app/layout.tsx`)

`WagmiProvider` → `QueryClientProvider` → `StorageConfigProvider` → `SessionProvider` → `WalletProvider` → `RainbowKitProvider`

### Conventions

- Named exports only (no default exports except Next.js pages/layouts)
- Barrel files (`index.ts`) in every feature directory
- No prop drilling — components call hooks directly; React Query deduplicates
- Hooks = data + side effects; Libs = pure transforms
- Decimal.js for all FIL/USDFC arithmetic (precision: 30, rounding: UP)
- Chains: Filecoin Mainnet + Calibration (testnet)

## File Map

```
src/
  app/
    page.tsx                        # Dashboard (/)
    layout.tsx                      # Root layout with provider stack
    upload/                         # /upload route
      page.tsx
      types.ts                      # UploadMode, UploadPhase, PieceResult, ProviderFailure
      hooks/
        use-upload.ts               # Standard/CDN upload orchestrator
        use-pin-upload.ts           # IPFS pin upload orchestrator
        use-upload-phase.ts         # Phase state machine + progress tracking
      lib/
        upload-to-contexts.ts       # Store-pull-commit workflow
        filecoin-pin/
          car-builder.ts            # CAR file builder from browser files
          wait-ipni-advertisement.ts # IPNI polling for provider announcement
      components/
        uploader.tsx                # Main upload orchestrator component
        upload-controls/            # File drop zone, mode selector, copies selector
        upload-results/             # Result display with piece cards
        upload-status-panel/        # Per-provider progress timeline
    datasets/                       # /datasets route
      page.tsx                      # List + detail routing via ?id= param
      components/                   # DatasetCard, DatasetDetail, PieceRow, DatasetPreviewModal
    files/                          # /files route — cross-dataset piece view
      page.tsx
      components/                   # FilesContent, FileRow
  components/
    ui/                             # shadcn/Radix primitives, EmptyState, PageHeader
    layout/                         # Navbar, Footer, WalletGuard, WalletMenu
    home/                           # BalanceCards, StorageDashboard, QuickActions
    storage/                        # PiecePreviewModal, PieceActions, FilePreview, CostBreakdown
    pay/                            # Deposit, Withdraw components
  hooks/
    use-balances.ts                 # FIL + USDFC + warm storage balances + storage metrics
    use-storage-overview.ts         # Combined dashboard data: balances + datasets + metrics
    use-download.ts                 # Piece download with CID validation + MIME detection
    use-delete.ts                   # Piece and dataset deletion mutations
    use-clipboard.ts                # Copy-to-clipboard utility
    use-is-mounted.ts               # SSR hydration guard
  lib/
    synapse-client.ts               # getSynapseClient() — factory with session key integration
    datasets.ts                     # transformDatasets, computeUniquePieces, getDatasetsCostInfo
    storage-metrics.ts              # fetchStorageMetrics, computeDashboardMetrics, computeRequiredCapacity
    decimal.ts                      # Precision math, storage cost calculations
    format.ts                       # Number and capacity formatting
    piece.ts                        # Piece URL builder
    query-keys.ts                   # Centralized React Query keys
    utils.ts                        # cn() utility
  providers/
    web3-provider/                  # Wagmi + RainbowKit + TanStack Query setup
    wallet/                         # Wallet connection modal + Zustand store
    session-key/                    # Session key lifecycle (create, extend, revoke)
    storage-config/                 # User storage preferences (localStorage + Zustand)
```

## Session Keys

Optional delegated signing system. Stores a Secp256k1 key locally so upload/delete/dataset operations don't prompt the wallet each time. Critical for multi-file multi-copy workflows.

**Lifecycle:**
1. `getSynapseClient()` (`src/lib/synapse-client.ts`) checks for stored session key
2. If missing, opens session modal and waits for user to create one
3. `SessionKey.login(walletClient, { address, expiresAt })` creates key with `DefaultFwssPermissions`
4. Key saved to Zustand store, persisted in localStorage, scoped per `address + chainId`
5. Users can extend (1–31 days) or revoke at any time

**Status derivation:** `deriveSessionStatus(expiresAt)` → `"none" | "expired" | "expiring" | "valid"` (expiring = <1 hour remaining)

**Files:**
- `src/providers/session-key/session-store.ts` — Zustand store: `save()`, `clear()`, `hydrate()`, `getSessionData()`
- `src/providers/session-key/use-session.ts` — `useSessionStatus()`, `useLoginSession()`, `useRevokeSession()`, `getSessionKey()`
- `src/providers/session-key/session-provider.tsx` — Context wrapper, hydrates on connection change
- `src/providers/session-key/session-modal.tsx` — UI for create/extend (slider 1–31 days)
- `src/providers/session-key/session-display.ts` — Status → label/icon/badge color mapping
- `src/providers/session-key/constants.ts` — `DEFAULT_DURATION_DAYS = 7`, `DURATION_PRESETS = [1, 7, 14, 31]`
- `src/lib/synapse-client.ts` — `getSynapseClient(withSession?)` integrates key into `new Synapse({ client, sessionClient })`

## Balances & Storage Metrics

### useBalances (`src/hooks/use-balances.ts`)

React Query hook returning combined wallet + storage data:

```
filBalance: bigint          # Native FIL
usdfcBalance: bigint        # USDFC ERC-20 token
warmStorageBalance: bigint  # Available funds in Synapse Pay contract
depositNeeded: bigint       # USDFC shortfall (0 if sufficient)
availableToFreeUp: bigint   # Excess beyond configured needs (safe to withdraw)
daysLeft: string            # Days of storage at max configured capacity
daysLeftAtCurrentRate: string # Days at current usage rate
isSufficient: boolean       # Rate + lockup + deposit all OK
isRateSufficient: boolean   # Rate allowance set to unlimited
isLockupSufficient: boolean # Lockup allowance set to unlimited
totalConfiguredCapacity: number # GiB from user config
currentMonthlyRate: bigint  # Wei/month at current usage
maxMonthlyRate: bigint      # Wei/month if storage filled
```

### fetchStorageMetrics (`src/lib/storage-metrics.ts`)

Core calculation engine called by `useBalances` and by upload hooks before uploading.

**Inputs:** `client, address, config { storageCapacity, persistencePeriod, minDaysThreshold }, fileSize?, newDatasets? { count, withCDN }`

**What it calculates:**
- Monthly rate from on-chain pricing: `pricePerTiBPerMonth * (fileSize / TiB)`
- Minimum dataset rate: on-chain `minimumPricePerMonth` (~$0.06/month per dataset)
- CDN dataset creation cost: 1 USDFC upfront per new CDN dataset
- Deposit shortfall: exact amount needed to cover `persistencePeriod` days
- Withdraw safety: `availableToFreeUp` = excess beyond configured needs

**Other pure functions in same file:**
- `computeDashboardMetrics(balances, datasets, pricing)` — storage usage %, burn rate %
- `computeRequiredCapacity(monthlyRate, pricePerTiB)` — GB needed to match current rate
- `computeConfigCostPreview(capacityGiB, periodDays, warningDays, balance, pricing)` — cost preview for settings

### useStorageOverview (`src/hooks/use-storage-overview.ts`)

Combines `useBalances` + `useDataSets` into `{ balances, datasets, metrics, isLoading }` for dashboard.

## Payments

The Synapse payment system uses two allowances:

- **Rate Allowance** (`rateAllowance`): Max USDFC per epoch for ongoing storage payments. Proportional to storage capacity.
- **Lockup Allowance** (`lockupAllowance`): Total USDFC reserved upfront for persistence duration. Formula: `(rateAllowance * persistenceDays) + existing lockup`.

### Storage Config (`src/providers/storage-config/`)

User preferences persisted to localStorage via Zustand:
- `storageCapacity` (GiB) → affects rate + lockup allowances
- `persistencePeriod` (days) → affects lockup allowance
- CDN toggle → higher price, faster retrieval

**Files:**
- `src/providers/storage-config/storage-config-store.ts` — Zustand store
- `src/providers/storage-config/storage-config-modal.tsx` — Settings UI
- `src/components/pay/deposit.tsx` — Deposit flow (ERC-20 approve + deposit)
- `src/components/pay/withdraw.tsx` — Withdraw flow

## Upload System

Supports multi-file, multi-copy uploads. Three modes:

| Mode       | Hook                | Description                                           |
| ---------- | ------------------- | ----------------------------------------------------- |
| `standard` | `useUpload`         | Filecoin Beam datasets on storage providers           |
| `cdn`      | `useUpload`         | CDN-enabled providers for fast retrieval              |
| `pin`      | `useFilecoinPinUpload` | CAR file → IPFS indexing → public IPFS gateway access |

### Upload Flow (standard/CDN)

`src/app/upload/hooks/use-upload.ts`:

1. **Init Synapse client** — `getSynapseClient()` checks for session key, prompts creation if missing
2. **Create contexts** — `synapse.storage.createContexts()` creates/reuses datasets (one per provider per copy)
3. **Balance check** — `fetchStorageMetrics(client, address, config, totalSize * copies, { count: newDatasets, withCDN })` determines if balance is sufficient. If not, auto-triggers `depositAndApprove(depositNeeded)`
4. **Store-Pull-Commit** — `uploadToContexts()` (`src/app/upload/lib/upload-to-contexts.ts`):
   - **Store**: Upload files once to primary provider
   - **Pull**: Secondary providers pull from primary (saves bandwidth — 3 copies = 1 upload, not 3)
   - **Presign**: `ctx.presignForCommit()` before pull to avoid wallet prompts during commit
   - **Commit**: Each provider confirms pieces on-chain. Returns `{ pieces: PieceResult[], failures: ProviderFailure[] }`
5. **Results** — Pre-grouped by piece with provider details. Throws if all providers failed.

### Phase Tracking

`useUploadPhase` (`src/app/upload/hooks/use-upload-phase.ts`) — state machine tracking per-provider step progress (`upload` → `pull` → `confirm`), each with status `pending | active | done | failed`.

## Filecoin Pin Mode

`src/app/upload/hooks/use-pin-upload.ts`:

1. **Build CAR** — `buildCarFromFiles(files)` (`src/app/upload/lib/filecoin-pin/car-builder.ts`):
   - Returns `{ rootCid, carBytes, totalFiles, totalSize }`
   - Preserves directory structure via `webkitRelativePath`
   - Single file → root CID = file CID; multiple files → root CID = directory CID
   - Uses `ipfs-unixfs-importer` with CIDv1, rawLeaves

2. **Upload CAR** — Same store-pull-commit flow but with the CAR as a single file, metadata includes `{ withIPFSIndexing: "", ipfsRootCid: rootCid }`

3. **IPNI verification** — `waitForIpniProviderResults(rootCid)` (`src/app/upload/lib/filecoin-pin/wait-ipni-advertisement.ts`):
   - Polls `https://filecoinpin.contact/cid/{rootCid}` — 20 retries, 5s intervals
   - Success = response contains `ProviderResults` with multiaddrs
   - Confirms content is announced on IPNI and accessible from any public IPFS gateway

**ipfsRootCid vs pieceCid:** These are different identifiers. `ipfsRootCid` is the IPFS content hash; `pieceCid` is Filecoin's storage identifier. The IPFS root CID is stored as on-chain metadata alongside the piece — no need to recompute it when querying datasets.

## Datasets & Files

### Dataset Transformation (`src/lib/datasets.ts`)

- `transformDatasets(raw)` — Normalizes SDK datasets. Extracts piece size from CID via `getPieceInfoFromCid()`. Accumulates total dataset size. Filters terminated datasets (`pdpEndEpoch === 0n`).
- `computeUniquePieces(datasets)` — Deduplicates pieces across datasets by normalizing CIDs. Returns `UniquePiece[]` with all datasets containing each piece.
- `getDatasetsCostInfo(datasets, pricing)` — Per-dataset monthly cost: `monthlyRate`, `isMinimumApplied`, `paidCapacityGiB`, `utilizationPercent`, `remainingFreeCapacityGiB`.

### Dataset Pages

- `src/app/datasets/page.tsx` — Routes between list and detail view via `?id=` search param
- `useDataSets({ address })` from `@filoz/synapse-react` — fetches on-chain dataset data
- Components: `DatasetCard`, `DatasetDetailContent`, `PieceRow`, `DatasetPreviewModal`

### Download (`src/hooks/use-download.ts`)

`useDownloadPiece(pieceUrl, pieceCid, filename?)` — Downloads piece, validates against expected CID with `downloadAndValidate()`, detects MIME type with `fileTypeFromBuffer()`, triggers browser download.

### Delete (`src/hooks/use-delete.ts`)

- `useDeletePiece(dataSetId, pieceId)` — Uses session key, calls `context.deletePiece()`
- `useDeleteDataset(dataSetId)` — No session key needed, calls `context.terminate()`
- Both invalidate `datasets` and `balances` query keys on success

## Formatting

Prettier: printWidth 100, double quotes, semicolons, trailing commas.

Import order (`@ianvs/prettier-plugin-sort-imports`):
```
react → next → third-party → @/lib → @/hooks → @/providers → @/types → @/components → relative
```

## Environment Variables

- `NEXT_PUBLIC_IPFS_GATEWAY_URL` — IPFS gateway (default: `https://ipfs.io/ipfs/`)
- `NEXT_PUBLIC_DAPP_ID` — dApp identifier (default: `fs-upload-dapp`)

## Filecoin Onchain Cloud — SDK & Platform Reference

Full documentation: https://docs.filecoin.cloud/
LLM-optimized index: https://docs.filecoin.cloud/llms.txt

### Core Concepts

- [Foundations & Architecture](https://docs.filecoin.cloud/core-concepts/architecture.md): Architecture, design principles, and roles powering Filecoin's programmable, verifiable cloud
- [Filecoin Pay](https://docs.filecoin.cloud/core-concepts/filecoin-pay-overview.md): Programmable on-chain settlement engine powering service economics
- [Filecoin Warm Storage Service](https://docs.filecoin.cloud/core-concepts/fwss-overview.md): Warm storage layer optimized for frequent retrieval, verifiable availability
- [Proof of Data Possession (PDP)](https://docs.filecoin.cloud/core-concepts/pdp-overview.md): Cryptographic proof protocol for verifiable decentralized storage

### Developer Guides

- [React Integration](https://docs.filecoin.cloud/developer-guides/react-integration.md): Integrating Synapse into React apps using Synapse React hooks
- [Synapse SDK Overview](https://docs.filecoin.cloud/developer-guides/synapse.md): High-level SDK overview
- [Synapse Core](https://docs.filecoin.cloud/developer-guides/synapse-core.md): Low-level building blocks for direct contract interaction
- [Devnet Configuration](https://docs.filecoin.cloud/developer-guides/devnet.md): Configure SDK for local development
- [Migration Guide](https://docs.filecoin.cloud/developer-guides/migration-guide.md): SDK version migration

#### Payments

- [Payment Operations](https://docs.filecoin.cloud/developer-guides/payments/payment-operations.md): Fund accounts, manage payments
- [Rails & Settlement](https://docs.filecoin.cloud/developer-guides/payments/rails-settlement.md): Payment rails and settlement operations

#### Storage

- [Storage Costs](https://docs.filecoin.cloud/developer-guides/storage/storage-costs.md): Calculate costs, fund accounts
- [Split Operations](https://docs.filecoin.cloud/developer-guides/storage/storage-context.md): Manual store/pull/commit phases for advanced workflows
- [Storage Operations](https://docs.filecoin.cloud/developer-guides/storage/storage-operations.md): Store and retrieve data with Synapse SDK

### Synapse React API (`@filoz/synapse-react`)

Key hooks used by this dApp:

| Hook | Purpose |
| ---- | ------- |
| `useDataSets` | Fetch all datasets for an address |
| `useDepositAndApprove` | Deposit USDFC + set allowances in one tx |
| `useDeposit` | Deposit USDFC to Pay contract |
| `useWithdraw` | Withdraw USDFC from Pay contract |
| `useServicePrice` | On-chain storage pricing |
| `useAccountInfo` | Pay account info (balance, lockup, rate) |
| `useERC20Balance` | ERC-20 token balance |
| `useProviders` | List storage providers |
| `useApproveAllowance` | Set rate/lockup allowances |
| `useUpload` | SDK-level upload (this dApp uses custom hooks instead) |
| `useDeletePiece` | Delete a piece from a dataset |
| `useCreateDataSet` | Create a new dataset |

Key interfaces: `DataSetWithPieces`, `UseServicePriceResult`, `UseUploadVariables`

Full API reference: https://docs.filecoin.cloud/reference/filoz/synapse-react/toc.md

### Synapse Core API (`@filoz/synapse-core`)

Low-level modules used:

| Module | Purpose |
| ------ | ------- |
| `SessionKey` | Session key creation, login, revoke, permission management |
| `Synapse` | Main SDK class — `new Synapse({ client, sessionClient })` |
| `storage` | `createContexts()`, `createContext()`, storage operations |
| `pay` | Payment contract interactions (`accounts`, `deposit`, `withdraw`) |
| `chains` | Chain configs for Filecoin Mainnet + Calibration |
| `pieces` | Piece CID utilities (`asPieceCID`, `getPieceInfoFromCid`) |
| `providers` | Provider discovery and service URL resolution |

Contract ABIs available: `erc20`, `fwss`, `filecoinPayV1`, `pdpVerifier`, `sessionKeyRegistry`, `serviceProviderRegistry`

Full API reference: https://docs.filecoin.cloud/reference/filoz/synapse-core/toc.md
