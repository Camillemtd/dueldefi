import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import {
  createPublicClient,
  getAddress,
  http,
  type Address,
  type Chain,
  type Hex,
  type TransactionSerializable,
} from "viem";

import { getFaucetChain } from "@/lib/evm/faucet-chain";
import type { UniswapApiTx } from "@/lib/uniswap/trade-gateway";

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

/** Signe et envoie une `TransactionRequest` renvoyée par l’API Uniswap (avec `value` optionnel). */
export async function dynamicSignAndSendUniswapTx(params: {
  evmClient: DynamicEvmWalletClient;
  walletAddress: Address;
  password: string;
  tx: UniswapApiTx;
  /** Réseau RPC utilisé pour nonce, gas et diffusion (doit correspondre à `tx.chainId`). */
  chain: Chain;
}): Promise<`0x${string}`> {
  const { chain } = params;
  if (Number(params.tx.chainId) !== chain.id) {
    throw new Error(
      `La transaction Uniswap cible la chaîne ${params.tx.chainId} ; le client RPC fourni est ${chain.id}.`,
    );
  }
  if (getAddress(params.tx.from) !== params.walletAddress) {
    throw new Error('Le champ "from" de la transaction ne correspond pas au wallet.');
  }

  const data = params.tx.data as Hex;
  if (!data || data === "0x") {
    throw new Error("Transaction invalide : champ data vide.");
  }

  const to = getAddress(params.tx.to as Address);
  const value = BigInt(params.tx.value ?? "0");

  const transport = http(chain.rpcUrls.default.http[0]);
  const publicClient = createPublicClient({ chain, transport });

  const nonce = await publicClient.getTransactionCount({
    address: params.walletAddress,
  });

  const gas = params.tx.gasLimit
    ? BigInt(params.tx.gasLimit)
    : await publicClient.estimateGas({
        account: params.walletAddress,
        to,
        data,
        value,
      });

  let serializable: TransactionSerializable;

  if (params.tx.maxFeePerGas && params.tx.maxPriorityFeePerGas) {
    serializable = {
      type: "eip1559",
      chainId: chain.id,
      nonce,
      to,
      data,
      value,
      gas,
      maxFeePerGas: BigInt(params.tx.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(params.tx.maxPriorityFeePerGas),
    };
  } else if (params.tx.gasPrice) {
    serializable = {
      type: "legacy",
      chainId: chain.id,
      nonce,
      to,
      data,
      value,
      gas,
      gasPrice: BigInt(params.tx.gasPrice),
    };
  } else {
    try {
      const fees = await publicClient.estimateFeesPerGas();
      serializable = {
        type: "eip1559",
        chainId: chain.id,
        nonce,
        to,
        data,
        value,
        gas,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      };
    } catch {
      const gasPrice = await publicClient.getGasPrice();
      serializable = {
        type: "legacy",
        chainId: chain.id,
        nonce,
        to,
        data,
        value,
        gas,
        gasPrice,
      };
    }
  }

  const serializedSigned = await params.evmClient.signTransaction({
    senderAddress: params.walletAddress,
    transaction: serializable,
    password: params.password,
  });

  return publicClient.sendRawTransaction({
    serializedTransaction: serializedSigned,
  });
}
