import type { InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { ok, type Result } from "@/shared/kernel/result";
import { Despensa, type ProductoEntrante } from "../despensa";
import type { PantryRepository } from "../ports/pantry-repository";

export interface AddStockInput extends ProductoEntrante {
  readonly usuarioId: string;
  /** Id del movimiento de entrada, generado en el cliente: un reintento no suma dos veces. */
  readonly movimientoId?: string;
}

/** Alta manual (botón +). Suma en la línea igual o abre una nueva (D2). */
export class AddStockCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: AddStockInput): Promise<Result<InventoryItemSnapshot | null>> {
    const movimientoId = input.movimientoId ?? newId();
    // Reintento de un alta que ya entró: no se repite.
    if (await this.despensa.existeMovimiento(movimientoId)) return ok(null);

    const [lineas, ubicaciones, recordadas] = await Promise.all([
      this.despensa.listarLineas(),
      this.despensa.listarUbicaciones(),
      this.despensa.ubicacionesRecordadas(),
    ]);
    const despensa = new Despensa(
      lineas,
      ubicaciones.map((u) => u.toSnapshot()),
      recordadas,
    );

    const linea = despensa.dar(
      input,
      { id: movimientoId, usuarioId: input.usuarioId },
      this.clock.now(),
    );
    if (!linea.ok) return linea;

    await this.despensa.guardar({
      lineas: despensa.lineasCambiadas(),
      movimientos: despensa.movimientos,
      recordar: despensa.ubicacionesARecordar(),
    });
    return ok(linea.value.toSnapshot());
  }
}
