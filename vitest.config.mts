import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage",
      include: [
        "src/schemas/**/*.ts",
        "src/actions/{submit-contact,subscribe-newsletter,admin-auth}.ts",
        "src/server/auth/**/*.ts",
        "src/server/security/**/*.ts",
      ],
      exclude: ["**/*.d.ts"],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 80,
        lines: 70,
      },
    },
  },
});
