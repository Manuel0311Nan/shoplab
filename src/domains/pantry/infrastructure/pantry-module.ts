import "server-only";
import { AddStockCommand } from "@/domains/pantry/application/commands/add-stock.command";
import { DeshacerConsumoCommand } from "@/domains/pantry/application/commands/deshacer-consumo.command";
import { ConsumeStockCommand } from "@/domains/pantry/application/commands/consume-stock.command";
import {
  avisosPorCategoria,
  OpenStockCommand,
} from "@/domains/pantry/application/commands/open-stock.command";
import type { AvisosAbierto } from "@/domains/pantry/application/ports/avisos-abierto";
import { RemoveStockCommand } from "@/domains/pantry/application/commands/remove-stock.command";
import { RenombrarEnDespensaCommand } from "@/domains/pantry/application/commands/renombrar-en-despensa.command";
import { StoreShoppingCommand } from "@/domains/pantry/application/commands/store-shopping.command";
import {
  CreateUbicacionCommand,
  CrearUbicacionesPorDefectoCommand,
  DeleteUbicacionCommand,
  UpdateUbicacionCommand,
} from "@/domains/pantry/application/commands/ubicaciones.commands";
import { UpdateStockCommand } from "@/domains/pantry/application/commands/update-stock.command";
import { GetPantryQuery } from "@/domains/pantry/application/queries/get-pantry.query";
import { ListUbicacionesRecordadasQuery } from "@/domains/pantry/application/queries/list-ubicaciones-recordadas.query";
import type { AuthContext } from "@/shared/kernel/auth-context";
import { systemClock } from "@/shared/kernel/clock";
import { PrismaPantryRepository } from "./prisma-pantry-repository";

/**
 * `avisosAbierto`: de dónde salen los días de aviso al abrir un paquete. El orquestador
 * pasa el catálogo (excepciones por producto); sin él, solo la categoría.
 */
export function pantryModule(
  auth: Pick<AuthContext, "hogarId">,
  deps: { avisosAbierto?: AvisosAbierto } = {},
) {
  const despensa = new PrismaPantryRepository(auth);
  return {
    getPantry: new GetPantryQuery(despensa, systemClock),
    ubicacionesRecordadas: new ListUbicacionesRecordadasQuery(despensa),
    addStock: new AddStockCommand(despensa, systemClock),
    storeShopping: new StoreShoppingCommand(despensa, systemClock),
    consumeStock: new ConsumeStockCommand(despensa, systemClock),
    deshacerConsumo: new DeshacerConsumoCommand(despensa, systemClock),
    openStock: new OpenStockCommand(
      despensa,
      systemClock,
      deps.avisosAbierto ?? avisosPorCategoria,
    ),
    updateStock: new UpdateStockCommand(despensa, systemClock),
    renombrarEnDespensa: new RenombrarEnDespensaCommand(despensa, systemClock),
    removeStock: new RemoveStockCommand(despensa, systemClock),
    createUbicacion: new CreateUbicacionCommand(despensa, systemClock),
    updateUbicacion: new UpdateUbicacionCommand(despensa, systemClock),
    deleteUbicacion: new DeleteUbicacionCommand(despensa, systemClock),
    crearUbicacionesPorDefecto: new CrearUbicacionesPorDefectoCommand(despensa, systemClock),
  };
}

export type PantryModule = ReturnType<typeof pantryModule>;
