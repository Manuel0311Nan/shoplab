import { getListaConItems } from "@/app/_lib/shopping/lista-con-items";
import { toShoppingListResponse } from "@/app/_lib/shopping/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { noContentResponse, resultResponse } from "@/app/api/_lib/responses";
import { updateListRequestSchema } from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { mapResult } from "@/shared/kernel/result";

export const GET = apiRoute({ ids: ["listId"] }, async ({ auth, ids }) => {
  const result = await shoppingModule(auth).getShoppingList.execute({ listId: ids.listId });

  return resultResponse(mapResult(result, toShoppingListResponse));
});

/** Renombrar, archivar o desarchivar (con 15 activas, `archivarListaId` hace el intercambio). */
export const PATCH = apiRoute(
  { ids: ["listId"], body: updateListRequestSchema },
  async ({ auth, ids, body }) => {
    const shopping = shoppingModule(auth);
    const result = await shopping.updateList.execute({
      listId: ids.listId,
      ...(body.nombre === undefined ? {} : { nombre: body.nombre }),
      ...(body.archivada === undefined ? {} : { archivada: body.archivada }),
      ...(body.archivarListaId === undefined ? {} : { archivarListaId: body.archivarListaId }),
    });
    if (!result.ok) return resultResponse(result);

    return resultResponse(await getListaConItems(shopping, ids.listId));
  },
);

/** Borrado definitivo para el usuario. 204 sin cuerpo. */
export const DELETE = apiRoute({ ids: ["listId"] }, async ({ auth, ids }) => {
  const result = await shoppingModule(auth).deleteList.execute({ listId: ids.listId });

  return result.ok ? noContentResponse() : resultResponse(result);
});
