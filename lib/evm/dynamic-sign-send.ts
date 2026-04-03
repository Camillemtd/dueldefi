import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  type TransactionSerializable,
} from "viem";

import { getFaucetChain } from "@/lib/evm/faucet-chain";

/** Build, sign with Dynamic MPC, broadcast raw tx (same chain as FAUCET_*). */
export async function dynamicSignAndSendTransaction(params: {
  evmClient: DynamicEvmWalletClient;
  walletAddress: Address;
  password: string;
  to: Address;
  data: Hex;
}): Promise<`0x${string}`> {
  const chain = getFaucetChain();
  const transport = http(chain.rpcUrls.default.http[0]);
  const publicClient = createPublicClient({ chain, transport });

  const nonce = await publicClient.getTransactionCount({
    address: params.walletAddress,
  });

  const gas = await publicClient.estimateGas({
    account: params.walletAddress,
    to: params.to,
    data: params.data,
  });

  let tx: TransactionSerializable;

  try {
    const fees = await publicClient.estimateFeesPerGas();
    tx = {
      type: "eip1559",
      chainId: chain.id,
      nonce,
      to: params.to,
      data: params.data,
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
      to: params.to,
      data: params.data,
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
