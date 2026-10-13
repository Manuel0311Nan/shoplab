import { toShoppingItemResponse } from "@/app/_lib/shopping/to-response";
import { parseId, parseJson } from "@/app/api/_lib/parse";
import { errorResponse, resultResponse } from "@/app/api/_lib/responses";
import { addItemRequestSchema } from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { ok } from "@/shared/kernel/result";

type Params = { params: Promise<{ listId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth.ok) return errorResponse(auth.error);
  const listId = parseId((await params).listId);
  if (!listId.ok) return errorResponse(listId.error);
  const body = await parseJson(request, addItemRequestSchema);
  if (!body.ok) return errorResponse(body.error);

  const result = await shoppingModule(auth.value).addItem.execute({
    listId: listId.value,
    itemId: body.value.id,
    nombre: body.value.nombre,
    cantidad: body.value.cantidad,
    nota: body.value.nota ?? null,
  });
  if (!result.ok) return errorResponse(result.error);
  return resultResponse(ok(toShoppingItemResponse(result.value)), 201);
}
