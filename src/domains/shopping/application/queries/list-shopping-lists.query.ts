import { DIAS_EN_ARCHIVADAS } from "@/domains/shopping/domain/shopping-list";
import { codificarCursor, decodificarCursor, type Cursor } from "@/shared/kernel/cursor";
import { ok, type Result } from "@/shared/kernel/result";
import type { ResumenLista, ShoppingListRepository } from "../ports/shopping-list-repository";

export const LIMITE_ARCHIVADAS_POR_DEFECTO = 20;
export const LIMITE_ARCHIVADAS_MAXIMO = 50;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

export type EstadoListas = "activas" | "archivadas";

export interface ListShoppingListsInput {
  readonly estado: EstadoListas;
  /** Solo archivadas: el `nextCursor` de la página anterior. */
  readonly cursor?: string;
  readonly limite?: number;
}

export interface TarjetaLista extends ResumenLista {
  /** Archivadas: cuándo se borrará (archivadaAt + 15 días). */
  readonly caducaEl: Date | null;
}

export interface PaginaListas {
  readonly items: TarjetaLista[];
  /** null cuando no hay más. Las activas (máx. 15) siempre llegan en una página. */
  readonly nextCursor: string | null;
}

/**
 * Mis listas. Activas: todas, la última modificada primero (sin paginar: son 15 como
 * mucho y su orden cambia con cada edición, lo que rompería un cursor).
 * Archivadas: por fecha de archivado, paginadas con cursor opaco.
 */
export class ListShoppingListsQuery {
  constructor(private readonly lists: ShoppingListRepository) {}

  async execute(input: ListShoppingListsInput): Promise<Result<PaginaListas>> {
    if (input.estado === "activas") {
      const activas = await this.lists.listarActivas();
      return ok({ items: activas.map(tarjeta), nextCursor: null });
    }

    let despuesDe: Cursor | undefined;
    if (input.cursor !== undefined) {
      const cursor = decodificarCursor(input.cursor);
      if (!cursor.ok) return cursor;
      despuesDe = cursor.value;
    }
    const limite = Math.min(
      Math.max(1, Math.trunc(input.limite ?? LIMITE_ARCHIVADAS_POR_DEFECTO)),
      LIMITE_ARCHIVADAS_MAXIMO,
    );

    // Se pide una de más para saber si hay otra página sin una consulta extra.
    const filas = await this.lists.listarArchivadas({
      limite: limite + 1,
      ...(despuesDe ? { despuesDe } : {}),
    });
    const pagina = filas.slice(0, limite);
    const ultima = pagina.at(-1);
    const hayMas = filas.length > limite && ultima?.archivadaAt != null;

    return ok({
      items: pagina.map(tarjeta),
      nextCursor:
        hayMas && ultima?.archivadaAt
          ? codificarCursor({ fecha: ultima.archivadaAt, id: ultima.id })
          : null,
    });
  }
}

function tarjeta(lista: ResumenLista): TarjetaLista {
  return {
    ...lista,
    caducaEl:
      lista.archivadaAt === null
        ? null
        : new Date(lista.archivadaAt.getTime() + DIAS_EN_ARCHIVADAS * MS_POR_DIA),
  };
}
