import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const prismaImportGuard = {
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "@prisma/client",
          message: "Import Prisma only through the shared client boundary.",
        },
        {
          name: "@/lib/db/prisma",
          message: "Use the shared client boundary or repository layer instead.",
        },
      ],
      patterns: [
        {
          group: ["@/generated/prisma", "@/generated/prisma/*"],
          message: "Import generated Prisma code only from the shared client boundary.",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "generated/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    rules: prismaImportGuard,
  },
  {
    files: ["lib/server/db/client.mjs"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/server/db/client.mjs",
              message: "Use repository modules instead of the Prisma client in app routes and actions.",
            },
          ],
          patterns: [
            {
              group: ["@/lib/server/db/*"],
              message: "Use repository modules instead of database internals in app routes and actions.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
