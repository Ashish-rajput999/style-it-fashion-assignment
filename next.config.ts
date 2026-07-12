import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude heavy native binaries from the serverless bundle.
  // puppeteer / better-sqlite3 are only used in local dev or self-hosted.
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    'better-sqlite3',
    '@prisma/adapter-better-sqlite3',
    'pg',
    '@prisma/adapter-pg',
  ],
};

export default nextConfig;
