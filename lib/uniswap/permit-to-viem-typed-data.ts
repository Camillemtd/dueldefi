import type { SignTypedDataParameters, TypedDataDomain } from "viem";

function inferPrimaryType(
  types: Record<string, Array<{ name: string; type: string }>>,
  message: Record<string, unknown>,
): string {
  const candidates = Object.keys(types).filter((k) => k !== "EIP712Domain");
  if (candidates.length === 0) {
    throw new Error("permitData.types ne contient aucun type EIP-712.");
  }
  const msgKeys = new Set(Object.keys(message));
  for (const t of candidates) {
    const fields = types[t];
    if (!Array.isArray(fields)) continue;
    const fieldNames = new Set(fields.map((f) => f.name));
    if ([...msgKeys].every((k) => fieldNames.has(k))) {
      return t;
    }
  }
  if (candidates.includes("PermitSingle")) return "PermitSingle";
  return candidates[0]!;
}

/**
 * Convertit le bloc `permitData` renvoyé par l’API Uniswap (domain / types / values)
 * en paramètres `signTypedData` viem / Dynamic.
 */
export function permitDataToSignTypedDataParams(
  permitData: {
    domain: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    values: Record<string, unknown>;
  },
): SignTypedDataParameters {
  const types = { ...permitData.types };
  delete (types as Record<string, unknown>).EIP712Domain;

  const primaryType = inferPrimaryType(
    types as Record<string, Array<{ name: string; type: string }>>,
    permitData.values,
  );

  return {
    domain: permitData.domain as TypedDataDomain,
    types: types as unknown as SignTypedDataParameters["types"],
    primaryType,
    message: permitData.values,
  } as SignTypedDataParameters;
}
