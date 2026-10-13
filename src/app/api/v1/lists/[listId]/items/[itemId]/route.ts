import { toShoppingItemResponse, toShoppingListResponse } from "@/app/_lib/shopping/to-response";
import { parseId, parseJson } from "@/app/api/_lib/parse";
import { errorResponse, resultResponse } from "@/app/api/_lib/responses";
import { updateItemRequestSchema } from "@/contracts/shopping";
import { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { validationError } from "@/shared/kernel/errors";
import { ok, Result } from "@/shared/kernel/result";

type Params = { params: Promise<{ listId: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth.ok) return errorResponse(auth.error);

  const { listId: rawListId, itemId: rawItemId } = await params;
  const listId = parseId(rawListId);
  if (!listId.ok) return errorResponse(listId.error);

  const itemId = parseId(rawItemId);
  if (!itemId.ok) return errorResponse(itemId.error);

  const body = await parseJson(request, updateItemRequestSchema);
  if (!body.ok) return errorResponse(body.error);

  const shopping = shoppingModule(auth.value);
  const ids = { listId: listId.value, itemId: itemId.value };

  let actualizado: Result<ShoppingItemSnapshot> | null = null;

  if (body.value.cantidad !== undefined) {
    actualizado = await shopping.updateItemQuantity.execute({
      ...ids,
      cantidad: body.value.cantidad,
    });
    if (!actualizado.ok) return errorResponse(actualizado.error);
  }

  if (body.value.comprado !== undefined) {
    actualizado = await shopping.setItemPurchased.execute({
      ...ids,
      comprado: body.value.comprado,
      usuarioId: auth.value.userId,
    });
    if (!actualizado.ok) return errorResponse(actualizado.error);
  }
  // El .refine del contrato garantiza que se ha ejecutado al menos uno.
  if (actualizado === null)
    return errorResponse(validationError("PETICION_VACIA", "Nada que actualizar"));
  return resultResponse(ok(toShoppingItemResponse(actualizado.value)));
}
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth.ok) return errorResponse(auth.error);

  const { listId: rawListId, itemId: rawItemId } = await params;
  const listId = parseId(rawListId);
  if (!listId.ok) return errorResponse(listId.error);

  const itemId = parseId(rawItemId);
  if (!itemId.ok) return errorResponse(itemId.error);

  const result = await shoppingModule(auth.value).removeItem.execute({
    listId: listId.value,
    itemId: itemId.value,
  });
  if (!result.ok) return errorResponse(result.error);

  return new Response(null, { status: 204 });
}
