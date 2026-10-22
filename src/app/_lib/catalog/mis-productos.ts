import "server-only";
import type { EstandarizarProductoResponse, MisProductosResponse } from "@/contracts/catalog";
import { catalogHogarModule } from "@/domains/catalog/infrastructure/catalog-module";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import type { AuthContext } from "@/shared/kernel/auth-context";
import type { Categoria } from "@/shared/kernel/categoria";
import { ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import type { Unidad } from "@/shared/kernel/unidad";
import { emojisProductos, packsRecordados } from "../memoria-hogar";

/**
 * Orquestador de «Mis productos» (Catalog ↔ Shopping ↔ Pantry): la memoria de texto
 * libre del hogar, con su pack, y la estandarización que se propaga a listas y despensa.
 */
export async function misProductos(auth: AuthContext): Promise<Result<MisProductosResponse>> {
  const [result, packs, emojis] = await Promise.all([
    catalogHogarModule(auth).misProductos.execute(),
    packsRecordados(auth),
    emojisProductos(auth),
  ]);
  if (!result.ok) return result;
  return ok({
    items: result.value.productos.map((p) => ({
      nombreNormalizado: p.nombreNormalizado,
      nombre: p.nombre,
      categoria: p.categoria,
      unidad: p.unidad,
      usos: p.usos,
      unidadesPorPack: packs[p.nombreNormalizado]?.unidadesPorPack ?? null,
      emoji: emojis[p.nombreNormalizado] ?? null,
    })),
    parecidos: result.value.parecidos.map((g) => ({
      productos: g.productos.map(({ nombreNormalizado, nombre }) => ({
        nombreNormalizado,
        nombre,
      })),
      base: g.base,
    })),
  });
}

export interface EstandarizarInput {
  /** Nombre normalizado del producto que se edita. */
  readonly desde: string;
  readonly nombre: string;
  /** Elegido en el autocompletado: unir con un producto de la lista base. */
  readonly productoBaseId?: string | null;
  readonly categoria?: Categoria;
  readonly unidad?: Unidad;
  /** undefined: no se toca; null: se olvida; número: ese tamaño. */
  readonly unidadesPorPack?: number | null;
}

/**
 * Renombrar o unir un producto del hogar en todas partes: memoria del hogar, listas
 * activas, despensa y memorias de pack y ubicación. El catálogo decide primero vínculo,
 * categoría y unidad del destino; si algo no es válido, no se toca nada.
 */
export async function estandarizarProducto(
  auth: AuthContext,
  input: EstandarizarInput,
): Promise<Result<EstandarizarProductoResponse>> {
  const catalogo = catalogHogarModule(auth);
  const [resuelto, actual] = await Promise.all([
    catalogo.resolverProducto.execute({
      nombre: input.nombre,
      productoBaseId: input.productoBaseId ?? null,
    }),
    catalogo.listHouseholdProducts.execute(),
  ]);
  if (!resuelto.ok) return resuelto;
  const deAntes = actual.ok
    ? actual.value.find((p) => p.nombreNormalizado === input.desde)
    : undefined;

  const nombre = input.nombre.trim().replace(/\s+/g, " ");
  const destino = {
    nombre,
    productoBaseId: resuelto.value.productoBaseId,
    // Lo elegido manda; si no, lo que tenía (al renombrar) o lo del catálogo (al unir).
    categoria:
      input.categoria ??
      (input.productoBaseId == null && deAntes !== undefined
        ? deAntes.categoria
        : resuelto.value.categoria),
    unidad: input.unidad ?? deAntes?.unidad ?? resuelto.value.unidad ?? "unidad",
  };

  const memoria = await catalogo.estandarizarProducto.execute({ desde: input.desde, ...destino });
  if (!memoria.ok) return memoria;

  const shopping = shoppingModule(auth);
  const enListas = await shopping.renombrarEnListas.execute({ desde: input.desde, ...destino });
  if (!enListas.ok) return enListas;
  const enDespensa = await pantryModule(auth).renombrarEnDespensa.execute({
    desde: input.desde,
    ...destino,
    usuarioId: auth.userId,
  });
  if (!enDespensa.ok) return enDespensa;
  const pack = await shopping.editarPack.execute({
    desde: input.desde,
    hacia: normalizarNombre(nombre),
    ...(input.unidadesPorPack === undefined ? {} : { unidadesPorPack: input.unidadesPorPack }),
  });
  if (!pack.ok) return pack;

  return ok({ enListas: enListas.value, enDespensa: enDespensa.value });
}

/** Deja de sugerirse (y de recordar su pack). Las listas y la despensa no cambian. */
export async function olvidarProducto(
  auth: AuthContext,
  nombreNormalizado: string,
): Promise<Result<void>> {
  const r = await catalogHogarModule(auth).olvidarProducto.execute(nombreNormalizado);
  if (!r.ok) return r;
  return shoppingModule(auth).editarPack.execute({
    desde: nombreNormalizado,
    hacia: nombreNormalizado,
    unidadesPorPack: null,
  });
}
