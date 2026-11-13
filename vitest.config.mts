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
        "src/actions/{submit-contact,subscribe-newsletter,admin-auth,admin-contact}.ts",
        "src/server/admin/**/*.ts",
        "src/server/auth/**/*.ts",
        "src/server/security/**/*.ts",
        "src/lib/admin-contact-presentation.ts",
        "src/lib/admin-dashboard-chart.ts",
        "src/components/admin/admin-request-trend-chart.tsx",
        "src/components/admin/admin-status-distribution.tsx",
        "src/app/(admin)/admin/(protected)/page.tsx",
        "src/app/(admin)/admin/(protected)/loading.tsx",
        "src/app/(admin)/admin/(protected)/lien-he/**/*.tsx",
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
