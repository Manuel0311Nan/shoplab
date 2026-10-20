import "server-only";
import { anadirProducto } from "@/app/_lib/shopping/productos-con-catalogo";
import type { Evaluacion, Existencia } from "@/domains/recipes/domain/disponibilidad";
import type { Sugerencias } from "@/domains/recipes/application/queries/sugerir-recetas.query";
import { recipesModule } from "@/domains/recipes/infrastructure/recipes-module";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { notFoundError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

/**
 * Orquestador Pantry → Recipes (vista 4): Recetas no importa la despensa; aquí se
 * traducen las líneas del hogar a existencias. Lo usan igual la API y las páginas.
 */

async function existenciasDelHogar(
  auth: Pick<AuthContext, "hogarId">,
): Promise<Result<Existencia[]>> {
  const despensa = await pantryModule(auth).getPantry.execute();
  if (!despensa.ok) return despensa;
  return ok(
    despensa.value.lineas.map((l) => ({
      nombre: l.nombre,
      productoBaseId: l.productoBaseId,
      nombreNormalizado: l.nombreNormalizado,
      cantidad: l.cantidad,
      caducaEnDias: l.caducidad.dias,
    })),
  );
}

export async function sugerirRecetas(
  auth: Pick<AuthContext, "hogarId">,
): Promise<Result<Sugerencias & { readonly despensaVacia: boolean }>> {
  const existencias = await existenciasDelHogar(auth);
  if (!existencias.ok) return existencias;
  const sugerencias = await recipesModule().sugerirRecetas.execute({
    existencias: existencias.value,
  });
  if (!sugerencias.ok) return sugerencias;
  return ok({ ...sugerencias.value, despensaVacia: existencias.value.length === 0 });
}

export async function verReceta(
  auth: Pick<AuthContext, "hogarId">,
  recetaId: string,
  raciones?: number,
): Promise<Result<Evaluacion>> {
  const existencias = await existenciasDelHogar(auth);
  if (!existencias.ok) return existencias;
  return recipesModule().getReceta.execute({
    recetaId,
    existencias: existencias.value,
    ...(raciones === undefined ? {} : { raciones }),
  });
}

export interface FaltantesAnadidos {
  readonly listaId: string;
  readonly listaNombre: string;
  readonly anadidos: number;
  readonly yaEstaban: number;
}

/**
 * Lo que falta para cocinar la receta con esas raciones, a la lista de la compra.
 * Se calcula aquí, no se fía de lo que mande el cliente. Lo que ya está en la lista
 * no se toca (POSIBLE_DUPLICADO cuenta como «ya estaba»).
 */
export async function anadirFaltantes(
  auth: AuthContext,
  input: { recetaId: string; raciones: number; listaId?: string },
): Promise<Result<FaltantesAnadidos>> {
  const receta = await verReceta(auth, input.recetaId, input.raciones);
  if (!receta.ok) return receta;

  const activas = await shoppingModule(auth).listLists.execute({ estado: "activas" });
  if (!activas.ok) return activas;
  const lista = input.listaId
    ? activas.value.items.find((l) => l.id === input.listaId)
    : activas.value.items.at(0);
  if (lista === undefined) {
    return err(notFoundError("SIN_LISTA_ACTIVA", "No tienes ninguna lista activa"));
  }

  let anadidos = 0;
  let yaEstaban = 0;
  for (const ingrediente of receta.value.ingredientes) {
    if (ingrediente.estado !== "falta" && ingrediente.estado !== "poco") continue;
    if (ingrediente.producto === null) continue;
    const result = await anadirProducto(auth, {
      listId: lista.id,
      nombre: ingrediente.producto.nombre,
      productoBaseId: ingrediente.producto.id,
      // Sin cantidad («2 dientes»): una unidad.
      cantidad: ingrediente.falta ?? { valor: 1, unidad: "unidad" },
    });
    if (result.ok) anadidos++;
    else if (result.error.code === "POSIBLE_DUPLICADO") yaEstaban++;
    else return result;
  }

  return ok({ listaId: lista.id, listaNombre: lista.nombre, anadidos, yaEstaban });
}
