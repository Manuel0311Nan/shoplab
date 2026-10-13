import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
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

  // "prettier" va el último: desactiva las reglas de estilo que chocan con Prettier.
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

  // Reglas que necesitan información de tipos (projectService lee el tsconfig).
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
    rules: {
      // `import type` para lo que solo es tipo: no arrastra módulos al bundle.
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      // Una promesa sin await ni catch es un error que se pierde en silencio.
      "@typescript-eslint/no-floating-promises": "error",
      // Pasar una función async donde se espera una que devuelve void (salvo en props JSX).
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // Con noUncheckedIndexedAccess, comprueba el undefined en lugar de usar `!`.
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },

  // Prisma solo desde el kernel e infrastructure/.
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
