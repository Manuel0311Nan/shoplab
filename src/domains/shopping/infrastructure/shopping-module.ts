import "server-only";
import { AddItemCommand } from "@/domains/shopping/application/commands/add-item.command";
import { CreateShoppingListCommand } from "@/domains/shopping/application/commands/create-shopping-list.command";
import { FinishShoppingCommand } from "@/domains/shopping/application/commands/finish-shopping.command";
import { RemoveItemCommand } from "@/domains/shopping/application/commands/remove-item.command";
import { UpdateItemCommand } from "@/domains/shopping/application/commands/update-item.command";
import { GetShoppingListQuery } from "@/domains/shopping/application/queries/get-shopping-list.query";
import { ListShoppingListsQuery } from "@/domains/shopping/application/queries/list-shopping-lists.query";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaShoppingListRepository } from "./prisma-shopping-list-repository";

export function shoppingModule(auth: AuthContext) {
  const lists = new PrismaShoppingListRepository(auth);
  return {
    getShoppingList: new GetShoppingListQuery(lists),
    listLists: new ListShoppingListsQuery(lists),
    createList: new CreateShoppingListCommand(lists, systemClock),
    addItem: new AddItemCommand(lists, systemClock),
    updateItem: new UpdateItemCommand(lists, systemClock),
    removeItem: new RemoveItemCommand(lists, systemClock),
    finishShopping: new FinishShoppingCommand(lists, systemClock),
  };
}

export type ShoppingModule = ReturnType<typeof shoppingModule>;
