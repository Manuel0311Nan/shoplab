import "server-only";
import { RecordarProductoCommand } from "@/domains/catalog/application/commands/recordar-producto.command";
import { ListBaseProductsQuery } from "@/domains/catalog/application/queries/list-base-products.query";
import { ListHouseholdProductsQuery } from "@/domains/catalog/application/queries/list-household-products.query";
import { ResolverProductoQuery } from "@/domains/catalog/application/queries/resolver-producto.query";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaProductoBaseRepository } from "./prisma-producto-base-repository";
import { PrismaProductoRecordadoRepository } from "./prisma-producto-recordado-repository";

/** Catálogo global: no depende del hogar, así que no recibe AuthContext. */
export function catalogModule() {
  return { listBaseProducts: new ListBaseProductsQuery(new PrismaProductoBaseRepository()) };
}

/** Lo del catálogo que depende del hogar: su memoria de productos. */
export function catalogHogarModule(auth: Pick<AuthContext, "hogarId">) {
  const base = new PrismaProductoBaseRepository();
  const recordados = new PrismaProductoRecordadoRepository(auth);
  return {
    resolverProducto: new ResolverProductoQuery(base, recordados),
    recordarProducto: new RecordarProductoCommand(recordados, systemClock),
    listHouseholdProducts: new ListHouseholdProductsQuery(recordados),
  };
}

export type CatalogHogarModule = ReturnType<typeof catalogHogarModule>;
