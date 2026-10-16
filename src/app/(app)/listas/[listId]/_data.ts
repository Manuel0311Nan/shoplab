import "server-only";

import { cache } from "react";
import { z } from "zod";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { err } from "@/shared/kernel/result";

const idSchema = z.uuid();

export const loadShoppingList = cache(async (listId: string) => {
  if (!idSchema.safeParse(listId).success) return err(ShoppingErrors.listaNoEncontrada());
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  return shoppingModule(auth.value).getShoppingList.execute({ listId });
});
