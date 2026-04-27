/**
 * File-backed CMS routes must not write on Vercel/serverless (ephemeral FS).
 * Local/dev and self-hosted Node can persist to disk.
 */
export const IS_VERCEL_READONLY =
  process.env.VERCEL === "1" || process.env.VERCEL === "true";
