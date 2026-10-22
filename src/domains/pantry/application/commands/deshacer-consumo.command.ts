import type { InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import { Despensa } from "../despensa";
import type { PantryRepository } from "../ports/pantry-repository";

/** Lo que dura el «Deshacer»: el aviso se ve unos segundos; esto es el margen del servidor. */
export const MINUTOS_PARA_DESHACER = 10;

export interface DeshacerConsumoInput {
  /** El movimiento de consumo o desecho que se deshace. */
  readonly movimientoId: string;
  /** Id del ajuste, generado en el cliente: un reintento no devuelve dos veces. */
  readonly id: string;
  readonly usuarioId: string;
}

/**
 * «Deshacer» tras gastar con un toque: devuelve lo gastado con un movimiento de ajuste
 * (el historial sigue cuadrando). Si la línea vuelve y coincide con otra, se juntan.
 */
export class DeshacerConsumoCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: DeshacerConsumoInput): Promise<Result<InventoryItemSnapshot>> {
    const encontrado = await this.despensa.buscarMovimiento(input.movimientoId);
    if (encontrado === null) return err(PantryErrors.movimientoNoEncontrado());
    const { movimiento, linea } = encontrado;
    // Reintento de un deshacer que ya entró.
    if (await this.despensa.existeMovimiento(input.id)) return ok(linea.toSnapshot());

    const ahora = this.clock.now();
    const pasados = (ahora.getTime() - movimiento.createdAt.getTime()) / 60_000;
    if (pasados > MINUTOS_PARA_DESHACER) return err(PantryErrors.noSePuedeDeshacer());

    const ajuste = linea.deshacerConsumo(
      movimiento,
      { id: input.id, usuarioId: input.usuarioId },
      ahora,
    );
    if (!ajuste.ok) return ajuste;

    const [lineas, ubicaciones] = await Promise.all([
      this.despensa.listarLineas(),
      this.despensa.listarUbicaciones(),
    ]);
    const despensa = new Despensa(
      [...lineas.filter((l) => l.id !== linea.id), linea],
      ubicaciones.map((u) => u.toSnapshot()),
    );
    despensa.registrar(linea, ajuste.value);
    const queda = despensa.juntarSiCoincide(linea, input.usuarioId, ahora);
    if (!queda.ok) return queda;

    await this.despensa.guardar({
      lineas: despensa.lineasCambiadas(),
      movimientos: despensa.movimientos,
    });
    return ok(queda.value.toSnapshot());
  }
}
