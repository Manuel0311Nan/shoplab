import "server-only";
import { AddItemCommand } from "@/domains/shopping/application/commands/add-item.command";
import { RemoveItemCommand } from "@/domains/shopping/application/commands/remove-item.command";
import { SetItemPurchasedCommand } from "@/domains/shopping/application/commands/set-item-purchased.command";
import { UpdateItemQuantityCommand } from "@/domains/shopping/application/commands/update-item-quantity.command";

import { GetShoppingListQuery } from "@/domains/shopping/application/queries/get-shopping-list.query";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaShoppingListRepository } from "./prisma-shopping-list-repository";

export function shoppingModule(auth: AuthContext) {
  const lists = new PrismaShoppingListRepository(auth);
  return {
    getShoppingList: new GetShoppingListQuery(lists),
    addItem: new AddItemCommand(lists, systemClock),
    setItemPurchased: new SetItemPurchasedCommand(lists, systemClock),
    updateItemQuantity: new UpdateItemQuantityCommand(lists, systemClock),
    removeItem: new RemoveItemCommand(lists, systemClock),
  };
}
export type ShoppingModule = ReturnType<typeof shoppingModule>;
