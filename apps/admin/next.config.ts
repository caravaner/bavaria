import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @bavaria/db and @bavaria/email ship as TypeScript source from the workspace;
  // let Next transpile them (and the generated Prisma client) rather than
  // pre-building them.
  transpilePackages: ["@bavaria/db", "@bavaria/email"],
};

export default nextConfig;
