import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/shared/kernel/**", "src/domains/*/infrastructure/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/shared/kernel/prisma", "@/shared/kernel/tenant-prisma", "@/generated/*"],
              message: "Prisma solo se usa en infrastructure/. Desde aquí, llama a un use case.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
