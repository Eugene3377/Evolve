import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Turbopack will
  // try to infer it and can get confused if a stray lockfile exists in a
  // parent folder (e.g. cloning into `Evolve/Evolve`) — that's what
  // produced the "multiple lockfiles" warning.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
