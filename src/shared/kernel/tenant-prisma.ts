import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";

/**
 * Modelos que pertenecen a un hogar. Todo modelo con columna `hogarId`
 * que sea dato de un hogar DEBE estar aquí.
 */
const TENANT_MODELS: ReadonlySet<Prisma.ModelName> = new Set<Prisma.ModelName>([
  // Se irán añadiendo: "ShoppingList", "ShoppingItem", "InventoryItem"…
]);

type TenantArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
};

export function tenantPrisma(hogarId: string) {
  return prisma.$extends({
    name: "tenant",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) {
            return query(args);
          }

          const scoped = { ...args } as TenantArgs;

          switch (operation) {
            case "create":
              scoped.data = { ...scoped.data, hogarId };
              break;

            case "createMany":
            case "createManyAndReturn":
              scoped.data = Array.isArray(scoped.data)
                ? scoped.data.map((row) => ({ ...row, hogarId }))
                : { ...scoped.data, hogarId };
              break;

            case "upsert":
              scoped.where = { ...scoped.where, hogarId };
              scoped.create = { ...scoped.create, hogarId };
              break;

            default:
              scoped.where = { ...scoped.where, hogarId };
          }

          return query(scoped as typeof args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof tenantPrisma>;
