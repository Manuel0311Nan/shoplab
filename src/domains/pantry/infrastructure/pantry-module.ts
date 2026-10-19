import "server-only";
import { AddStockCommand } from "@/domains/pantry/application/commands/add-stock.command";
import { ConsumeStockCommand } from "@/domains/pantry/application/commands/consume-stock.command";
import { RemoveStockCommand } from "@/domains/pantry/application/commands/remove-stock.command";
import { StoreShoppingCommand } from "@/domains/pantry/application/commands/store-shopping.command";
import {
  CreateUbicacionCommand,
  CrearUbicacionesPorDefectoCommand,
  DeleteUbicacionCommand,
  UpdateUbicacionCommand,
} from "@/domains/pantry/application/commands/ubicaciones.commands";
import { UpdateStockCommand } from "@/domains/pantry/application/commands/update-stock.command";
import { GetPantryQuery } from "@/domains/pantry/application/queries/get-pantry.query";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaPantryRepository } from "./prisma-pantry-repository";

export function pantryModule(auth: Pick<AuthContext, "hogarId">) {
  const despensa = new PrismaPantryRepository(auth);
  return {
    getPantry: new GetPantryQuery(despensa, systemClock),
    addStock: new AddStockCommand(despensa, systemClock),
    storeShopping: new StoreShoppingCommand(despensa, systemClock),
    consumeStock: new ConsumeStockCommand(despensa, systemClock),
    updateStock: new UpdateStockCommand(despensa, systemClock),
    removeStock: new RemoveStockCommand(despensa, systemClock),
    createUbicacion: new CreateUbicacionCommand(despensa, systemClock),
    updateUbicacion: new UpdateUbicacionCommand(despensa, systemClock),
    deleteUbicacion: new DeleteUbicacionCommand(despensa, systemClock),
    crearUbicacionesPorDefecto: new CrearUbicacionesPorDefectoCommand(despensa, systemClock),
  };
}

export type PantryModule = ReturnType<typeof pantryModule>;
