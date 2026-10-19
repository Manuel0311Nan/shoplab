import type { InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import { Cantidad } from "@/shared/kernel/cantidad";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { PantryRepository } from "../ports/pantry-repository";

export interface ConsumeStockInput {
  readonly itemId: string;
  /** Sin cantidad, todo lo que queda. */
  readonly cantidad?: { readonly valor: number; readonly unidad: string };
  readonly motivo: "gastado" | "tirado";
  readonly usuarioId: string;
  readonly movimientoId?: string;
}

export interface Consumo {
  readonly linea: InventoryItemSnapshot;
  readonly agotada: boolean;
  /**
   * D8: proponer "¿Añadir a la lista?". Cuando no queda ninguna otra línea de ese
   * producto y esta se ha acabado o queda poco (1 ud., o el 20 % en g, kg, ml o l).
   */
  readonly avisarLista: boolean;
}

/** Gastar o tirar (D7): resta y deja el movimiento de consumo o desecho. */
export class ConsumeStockCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ConsumeStockInput): Promise<Result<Consumo>> {
    let cantidad: Cantidad | undefined;
    if (input.cantidad !== undefined) {
      const c = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);
      if (!c.ok) return c;
      cantidad = c.value;
    }

    const lineas = await this.despensa.listarLineas();
    const linea = lineas.find((l) => l.id === input.itemId);
    if (linea === undefined) return err(PantryErrors.lineaNoEncontrada());

    const r = linea.consumir(
      cantidad,
      input.motivo,
      { id: input.movimientoId ?? newId(), usuarioId: input.usuarioId },
      this.clock.now(),
    );
    if (!r.ok) return r;

    await this.despensa.guardar({ lineas: [linea], movimientos: [r.value.movimiento] });

    const otras = lineas.some((l) => l.id !== linea.id && l.esMismoProducto(linea.clave()));
    return ok({
      linea: linea.toSnapshot(),
      agotada: r.value.agotada,
      avisarLista: !otras && (r.value.agotada || linea.quedaPoco()),
    });
  }
}
