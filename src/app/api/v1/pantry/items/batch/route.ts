import { guardarCompra } from "@/app/_lib/pantry/despensa-con-catalogo";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { storeShoppingRequestSchema, type StoreShoppingResponse } from "@/contracts/pantry";
import { mapResult } from "@/shared/kernel/result";

/** "Guardar en la despensa" al terminar la compra: todo en una transacción. */
export const POST = apiRoute({ body: storeShoppingRequestSchema }, async ({ auth, body }) => {
  const result = await guardarCompra(auth, {
    listaId: body.listaId,
    usuarioId: auth.userId,
    productos: body.productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      productoBaseId: p.productoBaseId ?? null,
      ...(p.categoria === undefined ? {} : { categoria: p.categoria }),
      ...(p.ubicacionId === undefined ? {} : { ubicacionId: p.ubicacionId }),
      cantidad: p.cantidad,
      caducaEl: p.caducaEl ?? null,
    })),
  });
  return resultResponse(
    mapResult(result, (r): StoreShoppingResponse => ({
      guardados: r.guardados,
      repetidos: r.repetidos,
    })),
    201,
  );
});
