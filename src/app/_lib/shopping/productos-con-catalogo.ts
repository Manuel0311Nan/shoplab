import "server-only";
import type { AddItemInput } from "@/domains/shopping/application/commands/add-item.command";
import type { UpdateItemInput } from "@/domains/shopping/application/commands/update-item.command";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { catalogHogarModule } from "@/domains/catalog/infrastructure/catalog-module";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import type { AuthContext } from "@/shared/kernel/auth-context";
import type { Result } from "@/shared/kernel/result";

/**
 * Orquestador Shopping ↔ Catalog (D1, vista 3): los dos contextos no se importan entre
 * sí. Lo usan igual la API y las Server Actions.
 *
 * Al añadir: el catálogo resuelve vínculo y categoría (lista base, sinónimo, memoria
 * del hogar u «otros»), y después el texto libre se apunta en la memoria del hogar,
 * igual que el pack con el que se compra.
 */
export async function anadirProducto(
  auth: AuthContext,
  input: AddItemInput,
): Promise<Result<ShoppingItemSnapshot>> {
  const catalogo = catalogHogarModule(auth);
  const resuelto = await catalogo.resolverProducto.execute({
    nombre: input.nombre,
    productoBaseId: input.productoBaseId ?? null,
  });
  const datos: AddItemInput = resuelto.ok
    ? {
        ...input,
        productoBaseId: resuelto.value.productoBaseId,
        categoria: input.categoria ?? resuelto.value.categoria,
      }
    : input;

  const shopping = shoppingModule(auth);
  const result = await shopping.addItem.execute(datos);
  if (result.ok && result.value.productoBaseId === null) {
    await recordar(auth, result.value, "uso");
  }
  if (result.ok) {
    try {
      await shopping.recordarPack.execute({
        nombre: input.nombre,
        unidad: input.cantidad.unidad,
        unidadesPorPack: input.unidadesPorPack ?? null,
      });
    } catch (error) {
      console.error("[shopping] no se pudo recordar el pack", error);
    }
  }
  return result;
}

/**
 * PATCH de un ítem; si cambia la categoría, el hogar la recuerda para la próxima vez.
 * Al renombrar, el catálogo vincula el nombre nuevo y, si no se eligió categoría, la
 * decide; el texto libre nuevo se apunta en la memoria del hogar.
 */
export async function actualizarProducto(
  auth: AuthContext,
  input: UpdateItemInput,
): Promise<Result<ShoppingItemSnapshot>> {
  let datos = input;
  if (input.producto !== undefined) {
    const resuelto = await catalogHogarModule(auth).resolverProducto.execute(input.producto);
    if (resuelto.ok) {
      datos = {
        ...input,
        producto: { nombre: input.producto.nombre, productoBaseId: resuelto.value.productoBaseId },
        categoria: input.categoria ?? resuelto.value.categoria,
      };
    }
  }
  const result = await shoppingModule(auth).updateItem.execute(datos);
  if (result.ok && input.categoria !== undefined) {
    await recordar(auth, result.value, "categoria");
  } else if (result.ok && input.producto !== undefined && result.value.productoBaseId === null) {
    await recordar(auth, result.value, "uso");
  }
  return result;
}

/**
 * La memoria es una ayuda: si falla, el producto ya está guardado y no se deshace.
 * Se registra el error y se sigue.
 */
async function recordar(
  auth: AuthContext,
  item: ShoppingItemSnapshot,
  motivo: "uso" | "categoria",
): Promise<void> {
  try {
    await catalogHogarModule(auth).recordarProducto.execute({
      nombre: item.nombre,
      categoria: item.categoria,
      unidad: item.cantidad.unidad,
      motivo,
    });
  } catch (error) {
    console.error("[catalogo] no se pudo recordar el producto", error);
  }
}
