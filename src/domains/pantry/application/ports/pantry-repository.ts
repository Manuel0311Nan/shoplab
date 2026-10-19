import type { InventoryItem, MovimientoSnapshot } from "@/domains/pantry/domain/inventory-item";
import type { Ubicacion } from "@/domains/pantry/domain/ubicacion";

export interface CambiosDespensa {
  readonly ubicaciones?: readonly Ubicacion[];
  readonly lineas?: readonly InventoryItem[];
  readonly movimientos?: readonly MovimientoSnapshot[];
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
  /** Para no repetir un envío: el cliente genera el id de cada movimiento. */
  existeMovimiento(id: string): Promise<boolean>;
  /** Todo o nada, en una transacción. */
  guardar(cambios: CambiosDespensa): Promise<void>;
}
