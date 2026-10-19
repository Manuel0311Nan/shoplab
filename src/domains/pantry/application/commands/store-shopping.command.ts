import type { InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import type { Clock } from "@/shared/kernel/clock";
import { ok, type Result } from "@/shared/kernel/result";
import { Despensa, type ProductoEntrante } from "../despensa";
import type { PantryRepository } from "../ports/pantry-repository";

export interface ProductoDeLaCompra extends ProductoEntrante {
  /** Id del movimiento de entrada, generado en el cliente. */
  readonly id: string;
}

export interface StoreShoppingInput {
  readonly listaId: string;
  readonly usuarioId: string;
  readonly productos: readonly ProductoDeLaCompra[];
}

export interface CompraGuardada {
  readonly guardados: number;
  /** Ya guardados en un envío anterior (doble pulsación, reintento). */
  readonly repetidos: number;
  readonly lineas: InventoryItemSnapshot[];
}

/**
 * "Guardar en la despensa" al terminar la compra (D6): varias altas en una transacción,
 * con origen compra. Si un producto falla, no se guarda ninguno.
 */
export class StoreShoppingCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: StoreShoppingInput): Promise<Result<CompraGuardada>> {
    const [lineas, ubicaciones] = await Promise.all([
      this.despensa.listarLineas(),
      this.despensa.listarUbicaciones(),
    ]);
    const despensa = new Despensa(
      lineas,
      ubicaciones.map((u) => u.toSnapshot()),
    );
    const ahora = this.clock.now();

    let repetidos = 0;
    const tocadas = new Map<string, InventoryItemSnapshot>();
    for (const producto of input.productos) {
      if (await this.despensa.existeMovimiento(producto.id)) {
        repetidos += 1;
        continue;
      }
      const linea = despensa.dar(
        producto,
        { id: producto.id, usuarioId: input.usuarioId, origen: "compra", listaId: input.listaId },
        ahora,
      );
      if (!linea.ok) return linea;
      tocadas.set(linea.value.id, linea.value.toSnapshot());
    }

    if (despensa.movimientos.length > 0) {
      await this.despensa.guardar({
        lineas: despensa.lineasCambiadas(),
        movimientos: despensa.movimientos,
      });
    }
    return ok({
      guardados: input.productos.length - repetidos,
      repetidos,
      lineas: [...tocadas.values()],
    });
  }
}
