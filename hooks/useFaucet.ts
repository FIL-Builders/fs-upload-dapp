import { useMutation } from "@tanstack/react-query";

// Status Codes
// Status Code	Description
// 200	Token successfully claimed; response contains transaction hash
// 400	Bad request - invalid address
// 429	Too many requests - rate limited
// 500	Server error; response contains error message
// 418	I'm a teapot - mainnet not supported

const handleFaucetResponse = async (response: Response) => {
  if (response.status === 200) {
    return {
      hash: await response.text(),
      status: response.status,
    };
  } else if (response.status === 400) {
    return {
      error: "Invalid address",
      status: response.status,
    };
  } else if (response.status === 429) {
    return {
      error: "Too many requests",
      status: response.status,
    };
  } else if (response.status === 500) {
    return {
      error: "Server error",
      status: response.status,
    };
  } else if (response.status === 418) {
    return {
      error: "Mainnet not supported",
      status: response.status,
    };
  } else {
    return {
      error: "Unknown error",
      status: response.status,
    };
  }
};

export const useFaucet = () => {
  const getCalibFilMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch(
        `https://forest-explorer.chainsafe.dev/api/claim_token?faucet_info=CalibnetFIL&address=${address}`
      );

      const data = await handleFaucetResponse(response);
      return data;
    },
  });

  const getCalibUsdfcMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch(
        `https://forest-explorer.chainsafe.dev/api/claim_token?faucet_info=CalibnetUSDFC&address=${address}`
      );

      const data = await handleFaucetResponse(response);
      return data;
    },
  });

  return { getCalibFilMutation, getCalibUsdfcMutation };
};
