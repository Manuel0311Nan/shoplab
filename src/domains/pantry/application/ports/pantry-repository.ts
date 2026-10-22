import type { InventoryItem, MovimientoSnapshot } from "@/domains/pantry/domain/inventory-item";
import type { Ubicacion, UbicacionRecordada } from "@/domains/pantry/domain/ubicacion";

export interface CambiosDespensa {
  readonly ubicaciones?: readonly Ubicacion[];
  readonly lineas?: readonly InventoryItem[];
  readonly movimientos?: readonly MovimientoSnapshot[];
  /** Memoria del hogar: crea o reemplaza la ubicación de cada producto. */
  readonly recordar?: readonly UbicacionRecordada[];
  /**
   * Al borrar una ubicación: lo que se recordaba en `desde` pasa a `hacia` (donde se han
   * movido sus productos) o, con null, se olvida y se vuelve a proponer por categoría.
   */
  readonly reubicarRecordadas?: { readonly desde: string; readonly hacia: string | null };
  /** Memoria del hogar: deja de recordar dónde va cada uno de estos nombres normalizados. */
  readonly olvidar?: readonly string[];
}

/**
 * La despensa del hogar del AuthContext. Un solo repositorio para ubicaciones, líneas y
 * movimientos porque varias operaciones los cambian a la vez (borrar una ubicación
 * mueve sus líneas) y todo debe guardarse en una transacción.
 */
export interface PantryRepository {
  /** Ubicaciones vivas, por orden. */
  listarUbicaciones(): Promise<Ubicacion[]>;
  /** Líneas vivas (como mucho 500, D9). */
  listarLineas(): Promise<InventoryItem[]>;
  /** Una línea viva. */
  findLinea(id: string): Promise<InventoryItem | null>;
  /** Un movimiento y su línea (aunque esté dada de baja): para deshacer un gasto. */
  buscarMovimiento(
    id: string,
  ): Promise<{ movimiento: MovimientoSnapshot; linea: InventoryItem } | null>;
  /** Para no repetir un envío: el cliente genera el id de cada movimiento. */
  existeMovimiento(id: string): Promise<boolean>;
  /** Memoria del hogar: nombre normalizado → ubicación (puede estar borrada). */
  ubicacionesRecordadas(): Promise<ReadonlyMap<string, string>>;
  /** Todo o nada, en una transacción. */
  guardar(cambios: CambiosDespensa): Promise<void>;
}
