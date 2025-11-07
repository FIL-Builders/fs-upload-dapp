import { createConfig, http } from "wagmi";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";
import { calibration, mainnet } from '@filoz/synapse-core/chains'

export const config = createConfig({
  chains: [calibration],
  connectors: [injected(), metaMask(), coinbaseWallet()],
  transports: {
    [calibration.id]: http(undefined, {
      batch: false,
    }),
  },
  batch: {
    multicall: false,
  },
})
