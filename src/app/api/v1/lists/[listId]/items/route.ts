import { toShoppingItemResponse } from "@/app/_lib/shopping/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { addItemRequestSchema } from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { mapResult } from "@/shared/kernel/result";

export const POST = apiRoute(
  { ids: ["listId"], body: addItemRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await shoppingModule(auth).addItem.execute({
      listId: ids.listId,
      itemId: body.id,
      nombre: body.nombre,
      cantidad: body.cantidad,
      nota: body.nota ?? null,
    });

    return resultResponse(mapResult(result, toShoppingItemResponse), 201);
  },
);
