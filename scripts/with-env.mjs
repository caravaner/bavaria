import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

// Repo-root-relative env loading, so this works no matter which workspace
// invokes it (apps/web, apps/admin, packages/db all share the root env files).
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Precedence: real shell env > .env.local > .env.
// loadEnvFile doesn't override already-set vars, so the first file loaded wins.
for (const file of [".env.local", ".env"]) {
  const path = join(repoRoot, file);
  if (existsSync(path)) process.loadEnvFile(path);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("usage: with-env <command> [args...]");
  process.exit(1);
}

// `shell: true` lets us resolve binaries from PATH (npm injects each
// workspace's and the root's node_modules/.bin), e.g. `next`, `prisma`.
const child = spawn(command, args, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
