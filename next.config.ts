import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pg",
    "kysely",
    "@dynamic-labs-wallet/node-evm",
    "@dynamic-labs-wallet/core",
  ],
};

export default nextConfig;
