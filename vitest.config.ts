import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Los de integración necesitan BD: van con `pnpm test:integration`.
    exclude: [...configDefaults.exclude, "src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      // Se mide la lógica: dominio, use cases, kernel y la capa HTTP compartida.
      include: [
        "src/domains/*/domain/**",
        "src/domains/*/application/**",
        "src/shared/kernel/**",
        "src/app/api/_lib/**",
      ],
      // Infraestructura del kernel: se cubre con tests de integración, no unitarios.
      exclude: [
        "**/*.test.ts",
        "src/domains/*/application/ports/**", // solo interfaces
        "src/shared/kernel/{prisma,tenant-prisma,tenant-repository,auth,auth-context,dev-identity,clock}.ts",
      ],
      // La CI falla si la cobertura de la lógica baja de aquí.
      thresholds: { statements: 95, lines: 95, functions: 90, branches: 90 },
    },
  },
});
