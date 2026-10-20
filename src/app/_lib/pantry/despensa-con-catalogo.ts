import "server-only";
import type { AddStockInput } from "@/domains/pantry/application/commands/add-stock.command";
import type {
  CompraGuardada,
  StoreShoppingInput,
} from "@/domains/pantry/application/commands/store-shopping.command";
import type {
  OpenStockInput,
  OpenStockResult,
} from "@/domains/pantry/application/commands/open-stock.command";
import type { UpdateStockInput } from "@/domains/pantry/application/commands/update-stock.command";
import type { InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import { catalogHogarModule, catalogModule } from "@/domains/catalog/infrastructure/catalog-module";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import type { AuthContext } from "@/shared/kernel/auth-context";
import type { Result } from "@/shared/kernel/result";

/** Lo que llega sin categoría todavía (la decide el catálogo). */
type SinCategoria<T extends { categoria: string }> = Omit<T, "categoria"> & {
  readonly categoria?: string;
};

/**
 * Orquestador Pantry ↔ Catalog (D1, vista 3), igual que el de la lista: Catalog vincula
 * el producto y decide la categoría; el texto libre se apunta en la memoria del hogar.
 */
async function resolver<
  T extends { nombre: string; productoBaseId?: string | null; categoria?: string },
>(
  auth: AuthContext,
  producto: T,
): Promise<T & { productoBaseId: string | null; categoria: string }> {
  const r = await catalogHogarModule(auth).resolverProducto.execute({
    nombre: producto.nombre,
    productoBaseId: producto.productoBaseId ?? null,
  });
  return {
    ...producto,
    productoBaseId: r.ok ? r.value.productoBaseId : null,
    categoria: producto.categoria ?? (r.ok ? r.value.categoria : "otros"),
  };
}

async function recordar(
  auth: AuthContext,
  linea: InventoryItemSnapshot,
  motivo: "uso" | "categoria",
): Promise<void> {
  try {
    await catalogHogarModule(auth).recordarProducto.execute({
      nombre: linea.nombre,
      categoria: linea.categoria,
      unidad: linea.cantidad.unidad,
      motivo,
    });
  } catch (error) {
    // La memoria es una ayuda: si falla, la despensa ya está guardada.
    console.error("[catalogo] no se pudo recordar el producto", error);
  }
}

export async function anadirADespensa(
  auth: AuthContext,
  input: SinCategoria<AddStockInput>,
): Promise<Result<InventoryItemSnapshot | null>> {
  const result = await pantryModule(auth).addStock.execute(await resolver(auth, input));
  if (result.ok && result.value !== null && result.value.productoBaseId === null) {
    await recordar(auth, result.value, "uso");
  }
  return result;
}

/** "Guardar en la despensa" (D6). Los productos vienen de la lista con su categoría. */
export async function guardarCompra(
  auth: AuthContext,
  input: Omit<StoreShoppingInput, "productos"> & {
    readonly productos: readonly SinCategoria<StoreShoppingInput["productos"][number]>[];
  },
): Promise<Result<CompraGuardada>> {
  const productos = await Promise.all(input.productos.map((p) => resolver(auth, p)));
  return pantryModule(auth).storeShopping.execute({ ...input, productos });
}

/** PATCH; si cambia la categoría, el hogar la recuerda. */
export async function actualizarEnDespensa(
  auth: AuthContext,
  input: UpdateStockInput,
): Promise<Result<InventoryItemSnapshot>> {
  const result = await pantryModule(auth).updateStock.execute(input);
  if (result.ok && input.categoria !== undefined) await recordar(auth, result.value, "categoria");
  return result;
}

/**
 * «Lo he abierto»: los días de aviso los decide el catálogo (excepción del producto en
 * la lista base o, si no, su categoría).
 */
export async function abrirEnDespensa(
  auth: AuthContext,
  input: OpenStockInput,
): Promise<Result<OpenStockResult>> {
  const catalogo = catalogModule();
  return pantryModule(auth, {
    avisosAbierto: {
      para: async (productoBaseId, categoria) => {
        const aviso = await catalogo.avisoAbierto.execute({ productoBaseId, categoria });
        return aviso.ok ? aviso.value : null;
      },
    },
  }).openStock.execute(input);
}
