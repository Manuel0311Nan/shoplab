import "server-only";
import { ListBaseProductsQuery } from "@/domains/catalog/application/queries/list-base-products.query";
import { PrismaProductoBaseRepository } from "./prisma-producto-base-repository";

/** Catálogo global: no depende del hogar, así que no recibe AuthContext. */
export function catalogModule() {
  return { listBaseProducts: new ListBaseProductsQuery(new PrismaProductoBaseRepository()) };
}
