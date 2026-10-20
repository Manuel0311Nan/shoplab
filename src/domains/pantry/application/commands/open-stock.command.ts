import {
  type InventoryItemSnapshot,
  MAX_LINEAS_DESPENSA,
} from "@/domains/pantry/domain/inventory-item";
import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import { AVISO_ABIERTO_POR_CATEGORIA } from "@/shared/kernel/abierto";
import type { Clock } from "@/shared/kernel/clock";
import { Dia, hoyEn, ZONA_HOGAR } from "@/shared/kernel/dia";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { AvisosAbierto } from "../ports/avisos-abierto";
import type { PantryRepository } from "../ports/pantry-repository";

export interface OpenStockInput {
  readonly itemId: string;
  /** AAAA-MM-DD; sin él, hoy en la zona del hogar. */
  readonly abiertoEl?: string;
  /** Id de la línea que se separa si hay varias unidades: un reintento no separa otra. */
  readonly lineaNuevaId?: string;
  readonly usuarioId: string;
}

export interface OpenStockResult {
  readonly abierta: InventoryItemSnapshot;
  /** La línea original con lo que queda cerrado; null si se abrió entera. */
  readonly resto: InventoryItemSnapshot | null;
}

/** Sin catálogo: el aviso de la categoría (los tests y quien no tenga excepciones). */
export const avisosPorCategoria: AvisosAbierto = {
  para: async (_producto, categoria) => AVISO_ABIERTO_POR_CATEGORIA[categoria],
};

/**
 * «Lo he abierto»: marca el paquete con el día de apertura y fija el aviso (verde,
 * amarillo, rojo) del producto o de su categoría. No cambia la caducidad.
 */
export class OpenStockCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
    private readonly avisos: AvisosAbierto,
  ) {}

  async execute(input: OpenStockInput): Promise<Result<OpenStockResult>> {
    // Reintento: la línea separada ya existe (y está abierta).
    if (input.lineaNuevaId !== undefined) {
      const ya = await this.despensa.findLinea(input.lineaNuevaId);
      if (ya !== null) {
        const original = await this.despensa.findLinea(input.itemId);
        return ok({ abierta: ya.toSnapshot(), resto: original?.toSnapshot() ?? null });
      }
    }

    let abiertoEl = hoyEn(ZONA_HOGAR, this.clock);
    if (input.abiertoEl !== undefined) {
      const dia = Dia.create(input.abiertoEl);
      if (!dia.ok) return dia;
      abiertoEl = dia.value;
    }

    const linea = await this.despensa.findLinea(input.itemId);
    if (linea === null) return err(PantryErrors.lineaNoEncontrada());
    const { productoBaseId, categoria } = linea.toSnapshot();
    const aviso = await this.avisos.para(productoBaseId, categoria);
    if (aviso === null) return err(PantryErrors.noSeAbre());
    // Con varias unidades se separa una línea: tiene que caber (D9).
    if (linea.cantidad.unidad === "unidad" && linea.cantidad.valor > 1 && !linea.estaAbierta) {
      const lineas = await this.despensa.listarLineas();
      if (lineas.length >= MAX_LINEAS_DESPENSA) {
        return err(PantryErrors.despensaLlena(MAX_LINEAS_DESPENSA));
      }
    }

    const ahora = this.clock.now();
    const result = linea.abrir({
      abiertoEl,
      aviso,
      nuevaLinea: { id: input.lineaNuevaId ?? newId(), movimientoId: newId() },
      contexto: { id: newId(), usuarioId: input.usuarioId },
      ahora,
    });
    if (!result.ok) return result;

    const { abierta, movimientos } = result.value;
    const separada = abierta !== linea;
    await this.despensa.guardar({
      lineas: separada ? [linea, abierta] : [linea],
      movimientos,
    });
    return ok({ abierta: abierta.toSnapshot(), resto: separada ? linea.toSnapshot() : null });
  }
}
