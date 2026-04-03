import { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";

export async function authenticatedEvmClient({
  authToken,
  environmentId,
}: {
  authToken: string;
  environmentId: string;
}) {
  const client = new DynamicEvmWalletClient({
    environmentId,
    // true uniquement sur une infra compatible AWS Nitro Enclave (prod AWS).
    enableMPCAccelerator: false,
  });
  await client.authenticateApiToken(authToken);
  return client;
}
