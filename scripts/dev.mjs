import { spawn } from "node:child_process";
import { resolve } from "node:path";

const processes = [
  spawn(resolve("node_modules/.bin/tsx"), ["server/index.ts"], { stdio: "inherit" }),
  spawn(resolve("node_modules/.bin/vite"), [], { stdio: "inherit" }),
];

function stopAll(exitCode = 0) {
  processes.forEach((child) => child.kill());
  process.exit(exitCode);
}

process.on("SIGINT", () => stopAll());
process.on("SIGTERM", () => stopAll());
processes.forEach((child) => child.on("exit", (code) => stopAll(code ?? 1)));
