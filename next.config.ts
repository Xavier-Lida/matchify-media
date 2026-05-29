import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Module natif : exclu du bundling serveur (chargé via require Node).
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
