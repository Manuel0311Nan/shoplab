import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

// Plantilla de eslint-plugin-boundaries: el destino debe ser del mismo contexto que el origen.
const SAME_CONTEXT = "{{ from.element.captured.context }}";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
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

  // Capas de Clean Architecture: las dependencias apuntan hacia dentro.
  // Detalle y motivos en CLAUDE.md (sección Arquitectura).
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true, project: "./tsconfig.json" } },
      "boundaries/elements": [
        { type: "domain", pattern: "src/domains/*/domain", capture: ["context"] },
        { type: "application", pattern: "src/domains/*/application", capture: ["context"] },
        { type: "infrastructure", pattern: "src/domains/*/infrastructure", capture: ["context"] },
        { type: "testing", pattern: "src/domains/*/testing", capture: ["context"] },
        { type: "contracts", pattern: "src/contracts" },
        { type: "kernel", pattern: "src/shared/kernel" },
        { type: "shared-lib", pattern: "src/shared/lib" },
        { type: "ui", pattern: "src/shared/ui" },
        { type: "generated", pattern: "src/generated" },
        { type: "app", pattern: "src/app" },
      ],
      "boundaries/files": [
        { category: "test", pattern: "**/*.test.ts" },
        { category: "env", pattern: "src/env.ts" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "Capas: «{{ from.element.types }}» no puede importar «{{ dependency.source }}». Revisa la sección Arquitectura del CLAUDE.md.",
          policies: [
            // Paquetes de npm, módulos de Node e imports dentro del mismo elemento.
            {
              allow: [
                { to: { module: { origin: "external" } } },
                { to: { module: { origin: "core" } } },
                { dependency: { relationship: { to: "internal" } } },
              ],
            },
            // Dominio: TypeScript puro. Solo su propio contexto y el kernel.
            {
              from: { element: { type: "domain" } },
              allow: [
                { to: { element: { type: "kernel" } } },
                { to: { element: { type: "domain", captured: { context: SAME_CONTEXT } } } },
              ],
            },
            // Aplicación: use cases y puertos de su contexto.
            {
              from: { element: { type: "application" } },
              allow: [
                { to: { element: { type: "kernel" } } },
                {
                  to: {
                    element: {
                      types: { anyOf: ["domain", "application"] },
                      captured: { context: SAME_CONTEXT },
                    },
                  },
                },
              ],
            },
            // Infraestructura: implementa los puertos con Prisma.
            {
              from: { element: { type: "infrastructure" } },
              allow: [
                { to: { element: { types: { anyOf: ["kernel", "generated"] } } } },
                { to: { file: { categories: "env" } } },
                {
                  to: {
                    element: {
                      types: { anyOf: ["domain", "application", "infrastructure"] },
                      captured: { context: SAME_CONTEXT },
                    },
                  },
                },
              ],
            },
            // Testing (builders, fakes, suites de contrato) de su contexto.
            {
              from: { element: { type: "testing" } },
              allow: [
                { to: { element: { type: "kernel" } } },
                {
                  to: {
                    element: {
                      types: { anyOf: ["domain", "application"] },
                      captured: { context: SAME_CONTEXT },
                    },
                  },
                },
              ],
            },
            // Los tests pueden usar builders y fakes (testing) y el kernel.
            {
              from: { file: { categories: "test" } },
              allow: { to: { element: { types: { anyOf: ["testing", "kernel"] } } } },
            },
            // Kernel: genérico; solo Prisma generado y env.
            {
              from: { element: { type: "kernel" } },
              allow: [
                { to: { element: { type: "generated" } } },
                { to: { file: { categories: "env" } } },
              ],
            },
            // UI compartida: sin lógica de negocio.
            {
              from: { element: { type: "ui" } },
              allow: { to: { element: { type: "shared-lib" } } },
            },
            // app/: entrada (rutas, actions, páginas). Prisma ya lo veta no-restricted-imports.
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        "domain",
                        "application",
                        "infrastructure",
                        "contracts",
                        "kernel",
                        "shared-lib",
                        "ui",
                        "app",
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      ],
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
