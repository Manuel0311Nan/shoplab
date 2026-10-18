import { toShoppingListResponse, toShoppingListSummary } from "@/app/_lib/shopping/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { createListRequestSchema, listListsQuerySchema } from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { mapResult } from "@/shared/kernel/result";

/** Mis listas: activas (todas) o archivadas (paginadas con cursor). */
export const GET = apiRoute({ query: listListsQuerySchema }, async ({ auth, query }) => {
  const result = await shoppingModule(auth).listLists.execute({
    estado: query.estado,
    ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
    ...(query.limite === undefined ? {} : { limite: query.limite }),
  });

  return resultResponse(
    mapResult(result, (pagina) => ({
      items: pagina.items.map(toShoppingListSummary),
      nextCursor: pagina.nextCursor,
    })),
  );
});

/** Crea una lista vacía. Con 15 activas: 409 LIMITE_DE_LISTAS salvo que llegue archivarListaId. */
export const POST = apiRoute({ body: createListRequestSchema }, async ({ auth, body }) => {
  const result = await shoppingModule(auth).createList.execute({
    nombre: body.nombre,
    ...(body.id === undefined ? {} : { listId: body.id }),
    ...(body.archivarListaId === undefined ? {} : { archivarListaId: body.archivarListaId }),
  });

  return resultResponse(
    mapResult(result, (lista) => toShoppingListResponse({ ...lista, items: [] })),
    201,
  );
});
