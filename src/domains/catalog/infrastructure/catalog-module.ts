import "server-only";
import { AvisoAbiertoQuery } from "@/domains/catalog/application/queries/aviso-abierto.query";
import {
  EstandarizarProductoCommand,
  OlvidarProductoCommand,
} from "@/domains/catalog/application/commands/estandarizar-producto.command";
import {
  CambiarEmojiCommand,
  ListEmojisQuery,
} from "@/domains/catalog/application/commands/cambiar-emoji.command";
import { RecordarProductoCommand } from "@/domains/catalog/application/commands/recordar-producto.command";
import { ListBaseProductsQuery } from "@/domains/catalog/application/queries/list-base-products.query";
import { ListHouseholdProductsQuery } from "@/domains/catalog/application/queries/list-household-products.query";
import { MisProductosQuery } from "@/domains/catalog/application/queries/mis-productos.query";
import { ResolverProductoQuery } from "@/domains/catalog/application/queries/resolver-producto.query";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaEmojiProductoRepository } from "./prisma-emoji-producto-repository";
import { PrismaProductoBaseRepository } from "./prisma-producto-base-repository";
import { PrismaProductoRecordadoRepository } from "./prisma-producto-recordado-repository";

/** Catálogo global: no depende del hogar, así que no recibe AuthContext. */
export function catalogModule() {
  const base = new PrismaProductoBaseRepository();
  return {
    listBaseProducts: new ListBaseProductsQuery(base),
    avisoAbierto: new AvisoAbiertoQuery(base),
  };
}

/** Lo del catálogo que depende del hogar: su memoria de productos. */
export function catalogHogarModule(auth: Pick<AuthContext, "hogarId">) {
  const base = new PrismaProductoBaseRepository();
  const recordados = new PrismaProductoRecordadoRepository(auth);
  const emojis = new PrismaEmojiProductoRepository(auth);
  return {
    resolverProducto: new ResolverProductoQuery(base, recordados),
    recordarProducto: new RecordarProductoCommand(recordados, systemClock),
    listHouseholdProducts: new ListHouseholdProductsQuery(recordados),
    misProductos: new MisProductosQuery(base, recordados),
    estandarizarProducto: new EstandarizarProductoCommand(recordados, systemClock, emojis),
    cambiarEmoji: new CambiarEmojiCommand(emojis),
    emojis: new ListEmojisQuery(emojis),
    olvidarProducto: new OlvidarProductoCommand(recordados),
  };
}

export type CatalogHogarModule = ReturnType<typeof catalogHogarModule>;
