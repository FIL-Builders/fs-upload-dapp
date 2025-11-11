import { filecoinCalibration, filecoin } from "viem/chains";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [filecoinCalibration, filecoin],
  connectors: [injected()],
  transports: {
    [filecoin.id]: http(undefined, {
      batch: true,
    }),
    [filecoinCalibration.id]: http(undefined, {
      batch: true,
    }),
  },
  batch: {
    multicall: false,
  },
});
