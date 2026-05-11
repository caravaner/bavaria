import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

// Precedence: real shell env > .env.local > .env.
// loadEnvFile doesn't override already-set vars, so the first file loaded wins.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const args = process.argv.slice(2);
const next = "./node_modules/next/dist/bin/next";

const child = spawn(process.execPath, [next, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
