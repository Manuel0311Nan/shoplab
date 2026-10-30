import {
  type InventoryItemSnapshot,
  MAX_LINEAS_DESPENSA,
  type MovimientoSnapshot,
} from "@/domains/pantry/domain/inventory-item";
import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import { Cantidad, sumarCantidades } from "@/shared/kernel/cantidad";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import { Despensa } from "../despensa";
import type { PantryRepository } from "../ports/pantry-repository";

export interface MoveStockInput {
  readonly itemId: string;
  readonly ubicacionId: string;
  /** Lo que se lleva; sin ella (o con todo), se mueve la línea entera. */
  readonly cantidad?: { readonly valor: number; readonly unidad: string };
  /** Id de la línea que se separa: un reintento no separa otra. */
  readonly lineaNuevaId?: string;
  readonly usuarioId: string;
}

export interface MoveStockResult {
  /** La línea que queda en el destino (nueva, la de siempre o una con la que se juntó). */
  readonly movida: InventoryItemSnapshot;
  /** La línea original con lo que se queda; null si se movió entera. */
  readonly resto: InventoryItemSnapshot | null;
}

/**
 * Mover a otra ubicación toda una línea o solo una parte («de las 6 leches, 1 a la
 * nevera»). Si en el destino ya hay una línea igual (mismo producto, fecha y apertura),
 * se suma en ella. Mover también da por organizado lo que estaba «por organizar».
 */
export class MoveStockCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: MoveStockInput): Promise<Result<MoveStockResult>> {
    if (input.lineaNuevaId !== undefined) {
      const ya = await this.despensa.findLinea(input.lineaNuevaId);
      if (ya !== null) {
        const original = await this.despensa.findLinea(input.itemId);
        return ok({ movida: ya.toSnapshot(), resto: original?.toSnapshot() ?? null });
      }
    }
    let cantidad: Cantidad | undefined;
    if (input.cantidad !== undefined) {
      const c = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);
      if (!c.ok) return c;
      cantidad = c.value;
    }

    const [lineas, ubicaciones] = await Promise.all([
      this.despensa.listarLineas(),
      this.despensa.listarUbicaciones(),
    ]);
    const linea = lineas.find((l) => l.id === input.itemId);
    if (linea === undefined) return err(PantryErrors.lineaNoEncontrada());
    if (!ubicaciones.some((u) => u.id === input.ubicacionId)) {
      return err(PantryErrors.ubicacionNoEncontrada());
    }

    const ahora = this.clock.now();
    const contexto = { id: newId(), usuarioId: input.usuarioId };
    const despensa = new Despensa(
      lineas,
      ubicaciones.map((u) => u.toSnapshot()),
    );

    const separada = linea.separar({
      cantidad: cantidad ?? linea.cantidad,
      ubicacionId: input.ubicacionId,
      nuevaLinea: { id: input.lineaNuevaId ?? newId(), movimientoId: newId() },
      contexto,
      ahora,
    });
    if (!separada.ok) return separada;
    const { movida, movimientos } = separada.value;

    // Toda la línea: es mover (y se recuerda el sitio, como al editarla).
    if (movida === linea) {
      despensa.recordarUbicacion(linea.nombre, input.ubicacionId);
      despensa.registrar(linea);
      const queda = despensa.juntarSiCoincide(linea, input.usuarioId, ahora);
      if (!queda.ok) return queda;
      await this.guardar(despensa);
      return ok({ movida: queda.value.toSnapshot(), resto: null });
    }

    // Una parte: se suma a una línea igual del destino o va a una nueva.
    const [movimientoResto, movimientoParte] = movimientos as [
      MovimientoSnapshot,
      MovimientoSnapshot,
    ];
    despensa.registrar(linea, movimientoResto);
    const destino = lineas.find((l) => l.id !== linea.id && l.esMismaLinea(movida.clave()));
    if (destino !== undefined) {
      const total = sumarCantidades([destino.cantidad, movida.cantidad], destino.cantidad.unidad);
      if (total === null) return err(PantryErrors.cantidadIncompatible());
      despensa.registrar(destino, destino.ajustar(total, { ...contexto, id: newId() }, ahora));
      await this.guardar(despensa);
      return ok({ movida: destino.toSnapshot(), resto: linea.toSnapshot() });
    }
    if (lineas.filter((l) => !l.estaDeBaja).length >= MAX_LINEAS_DESPENSA) {
      return err(PantryErrors.despensaLlena(MAX_LINEAS_DESPENSA));
    }
    despensa.registrar(movida, movimientoParte);
    await this.guardar(despensa);
    return ok({ movida: movida.toSnapshot(), resto: linea.toSnapshot() });
  }

  private async guardar(despensa: Despensa): Promise<void> {
    await this.despensa.guardar({
      lineas: despensa.lineasCambiadas(),
      movimientos: despensa.movimientos,
      recordar: despensa.ubicacionesARecordar(),
    });
  }
}
