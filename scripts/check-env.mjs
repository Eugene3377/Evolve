#!/usr/bin/env node
// scripts/check-env.mjs
//
// Runs automatically before `npm run dev` / `npm run build` (see the
// "predev"/"prebuild" scripts in package.json). Fails fast with a plain
// message instead of letting a missing .env.local cascade into confusing
// Turbopack/webpack errors deep inside the dev server.

import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envPath = resolve(root, ".env.local");
const REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function fail(message) {
  console.error("\n\x1b[31m✖ " + message + "\x1b[0m\n");
  process.exit(1);
}

if (!existsSync(envPath)) {
  // Common Windows/Notepad trap: the file got saved as ".env.local.txt"
  // because File Explorer hides known extensions by default.
  const misnamed = readdirSync(root).find(
    (f) => f.toLowerCase() === ".env.local.txt"
  );

  if (misnamed) {
    fail(
      `Found "${misnamed}" instead of ".env.local" — your text editor added ` +
        `a hidden .txt extension. Rename it (remove ".txt") so the file is ` +
        `exactly ".env.local", then run this command again.`
    );
  }

  fail(
    `Missing .env.local in ${root}\n\n` +
      `  Run:  cp .env.example .env.local   (macOS/Linux)\n` +
      `        copy .env.example .env.local   (Windows)\n\n` +
      `Then fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ` +
      `from your Supabase project's API settings, and re-run this command.`
  );
}

// Load .env.local without adding a dependency — this only reads it for
// this pre-flight check; Next.js loads it for real on its own.
const raw = await import("node:fs").then((fs) =>
  fs.readFileSync(envPath, "utf8")
);
const values = Object.fromEntries(
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const missing = REQUIRED.filter((key) => !values[key]);
if (missing.length > 0) {
  fail(
    `${envPath} is missing: ${missing.join(", ")}\n\n` +
      `Open .env.local and set these from your Supabase project's ` +
      `Settings → API page, then re-run this command.`
  );
}

console.log("\x1b[32m✓ .env.local looks good\x1b[0m");
