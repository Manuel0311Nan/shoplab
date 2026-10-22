import "server-only";
import { AddItemCommand } from "@/domains/shopping/application/commands/add-item.command";
import { CreateShoppingListCommand } from "@/domains/shopping/application/commands/create-shopping-list.command";
import { DeleteShoppingListCommand } from "@/domains/shopping/application/commands/delete-shopping-list.command";
import { FinishShoppingCommand } from "@/domains/shopping/application/commands/finish-shopping.command";
import { RecordarPackCommand } from "@/domains/shopping/application/commands/recordar-pack.command";
import { PurgeExpiredListsCommand } from "@/domains/shopping/application/commands/purge-expired-lists.command";
import { RemoveItemCommand } from "@/domains/shopping/application/commands/remove-item.command";
import { UpdateItemCommand } from "@/domains/shopping/application/commands/update-item.command";
import { UpdateShoppingListCommand } from "@/domains/shopping/application/commands/update-shopping-list.command";
import { GetShoppingListQuery } from "@/domains/shopping/application/queries/get-shopping-list.query";
import { ListPacksRecordadosQuery } from "@/domains/shopping/application/queries/list-packs-recordados.query";
import { ListShoppingListsQuery } from "@/domains/shopping/application/queries/list-shopping-lists.query";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaListasCaducadasRepository } from "./prisma-listas-caducadas-repository";
import { PrismaPackRecordadoRepository } from "./prisma-pack-recordado-repository";
import { PrismaShoppingListRepository } from "./prisma-shopping-list-repository";

export function shoppingModule(auth: AuthContext) {
  const lists = new PrismaShoppingListRepository(auth, systemClock);
  const packs = new PrismaPackRecordadoRepository(auth);
  return {
    getShoppingList: new GetShoppingListQuery(lists),
    listLists: new ListShoppingListsQuery(lists),
    createList: new CreateShoppingListCommand(lists, systemClock),
    updateList: new UpdateShoppingListCommand(lists, systemClock),
    deleteList: new DeleteShoppingListCommand(lists, systemClock),
    addItem: new AddItemCommand(lists, systemClock),
    updateItem: new UpdateItemCommand(lists, systemClock),
    removeItem: new RemoveItemCommand(lists, systemClock),
    finishShopping: new FinishShoppingCommand(lists, systemClock),
    recordarPack: new RecordarPackCommand(packs),
    packsRecordados: new ListPacksRecordadosQuery(packs),
  };
}

export type ShoppingModule = ReturnType<typeof shoppingModule>;

/** Solo para el cron de limpieza: trabaja sobre todos los hogares, sin sesión. */
export function purgaDeListasModule() {
  return {
    purgeExpiredLists: new PurgeExpiredListsCommand(
      new PrismaListasCaducadasRepository(),
      systemClock,
    ),
  };
}
