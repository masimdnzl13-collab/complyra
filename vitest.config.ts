import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // "server-only" throws unconditionally outside Next.js's bundler (it
      // only no-ops under the "react-server" export condition Next sets) —
      // stub it out so server-only-guarded modules can be unit tested directly.
      "server-only": path.resolve(__dirname, "./test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
