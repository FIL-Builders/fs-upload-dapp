import { Synapse } from "@filoz/synapse-sdk";
import { CONTRACT_ABIS, CONTRACT_ADDRESSES } from "@filoz/synapse-sdk";
import { ethers } from "ethers";

export const getRails = async (synapse: Synapse, railIDs: number[]) => {
  const multicall = new ethers.Contract(
    CONTRACT_ADDRESSES.MULTICALL3[synapse.getNetwork()],
    CONTRACT_ABIS.MULTICALL3,
    synapse.getProvider()
  );
  const railCalls = railIDs.map((railId) => ({
    target: synapse.getPaymentsAddress(),
    allowFailure: false,
    callData: new ethers.Interface(CONTRACT_ABIS.PAYMENTS).encodeFunctionData(
      "getRail",
      [railId]
    ),
  }));

  const railResults = await multicall.aggregate3.staticCall(railCalls);

  const map = {
    0: "token",
    1: "from",
    2: "to",
    3: "operator",
    4: "validator",
    5: "paymentRate",
    6: "lockupPeriod",
    7: "lockupFixed",
    8: "settledUpTo",
    9: "endEpoch",
    10: "commissionRateBps",
    11: "serviceFeeRecipient",
  };
  const railAbi = new ethers.Interface(CONTRACT_ABIS.PAYMENTS).getFunction(
    "getRail"
  )?.outputs;

  const rails = railResults.map((result: any, index: number) => {
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      railAbi as any,
      result.returnData
    )[0];

    // Convert the tuple to an object using the map
    // railId comes from the corresponding index in railIDs array
    return {
      railId: railIDs[index],
      ...Object.fromEntries(
        Object.entries(map).map(([mapIndex, key]) => [
          key,
          decoded[Number(mapIndex)],
        ])
      ),
    };
  }) as {
    railId: number;
    token: string;
    from: string;
    to: string;
    operator: string;
    validator: string;
    paymentRate: bigint;
    lockupPeriod: bigint;
    lockupFixed: bigint;
    settledUpTo: bigint;
    endEpoch: bigint;
    commissionRateBps: bigint;
    serviceFeeRecipient: string;
  }[];

  return rails;
};
