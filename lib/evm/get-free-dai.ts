import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import {
  createPublicClient,
  defineChain,
  encodeFunctionData,
  http,
  type TransactionSerializable,
} from "viem";

/** Same ABI as your thirdweb `getContract` snippet — faucet USDC / test token. */
export const getFreeDaiAbi = [
  {
    inputs: [],
    name: "getFreeDai",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function isGetFreeDaiConfigured(): boolean {
  return Boolean(
    process.env.USDC_FAUCET_CONTRACT_ADDRESS?.startsWith("0x") &&
      process.env.FAUCET_RPC_URL &&
      process.env.FAUCET_CHAIN_ID,
  );
}

function faucetChain() {
  const id = Number(process.env.FAUCET_CHAIN_ID);
  const url = process.env.FAUCET_RPC_URL;
  if (!url || !Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid FAUCET_CHAIN_ID or FAUCET_RPC_URL");
  }
  return defineChain({
    id,
    name: "Faucet chain",
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: { default: { http: [url] } },
  });
}

/**
 * Signs with Dynamic MPC (same password as wallet creation) and broadcasts via RPC.
 * Requires the new account to have enough native gas on `FAUCET_RPC_URL`’s chain.
 */
export async function sendGetFreeDaiTransaction(params: {
  evmClient: DynamicEvmWalletClient;
  walletAddress: `0x${string}`;
  password: string;
}): Promise<`0x${string}`> {
  const contract = process.env.USDC_FAUCET_CONTRACT_ADDRESS as `0x${string}`;
  const chain = faucetChain();
  const publicClient = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });

  const data = encodeFunctionData({
    abi: getFreeDaiAbi,
    functionName: "getFreeDai",
    args: [],
  });

  const nonce = await publicClient.getTransactionCount({
    address: params.walletAddress,
  });

  const gas = await publicClient.estimateGas({
    account: params.walletAddress,
    to: contract,
    data,
  });

  let tx: TransactionSerializable;

  try {
    const fees = await publicClient.estimateFeesPerGas();
    tx = {
      type: "eip1559",
      chainId: chain.id,
      nonce,
      to: contract,
      data,
      gas,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    };
  } catch {
    const gasPrice = await publicClient.getGasPrice();
    tx = {
      type: "legacy",
      chainId: chain.id,
      nonce,
      to: contract,
      data,
      gas,
      gasPrice,
    };
  }

  const serializedSigned = await params.evmClient.signTransaction({
    senderAddress: params.walletAddress,
    transaction: tx,
    password: params.password,
  });

  return publicClient.sendRawTransaction({
    serializedTransaction: serializedSigned,
  });
}
