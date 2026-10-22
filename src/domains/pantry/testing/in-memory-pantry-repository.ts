import type {
  CambiosDespensa,
  PantryRepository,
} from "@/domains/pantry/application/ports/pantry-repository";
import {
  InventoryItem,
  type InventoryItemSnapshot,
  type MovimientoSnapshot,
} from "@/domains/pantry/domain/inventory-item";
import { Ubicacion, type UbicacionSnapshot } from "@/domains/pantry/domain/ubicacion";

/** Guarda snapshots: los cambios sin `guardar` no se ven, como en Prisma. */
export class InMemoryPantryRepository implements PantryRepository {
  private readonly ubicaciones = new Map<string, UbicacionSnapshot>();
  private readonly lineas = new Map<string, InventoryItemSnapshot>();
  readonly movimientos = new Map<string, MovimientoSnapshot>();
  /** Memoria del hogar: nombre normalizado → ubicación. */
  readonly recordadas = new Map<string, string>();
  guardados = 0;

  constructor(
    inicial: { ubicaciones?: readonly Ubicacion[]; lineas?: readonly InventoryItem[] } = {},
  ) {
    for (const u of inicial.ubicaciones ?? []) this.ubicaciones.set(u.id, u.toSnapshot());
    for (const l of inicial.lineas ?? []) this.lineas.set(l.id, l.toSnapshot());
  }

  async listarUbicaciones(): Promise<Ubicacion[]> {
    return [...this.ubicaciones.values()]
      .filter((u) => u.deletedAt === null)
      .sort((a, b) => a.orden - b.orden)
      .map((u) => Ubicacion.rehydrate(u));
  }

  async listarLineas(): Promise<InventoryItem[]> {
    return [...this.lineas.values()]
      .filter((l) => l.deletedAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((l) => InventoryItem.rehydrate(l));
  }

  async findLinea(id: string): Promise<InventoryItem | null> {
    const l = this.lineas.get(id);
    return l === undefined || l.deletedAt !== null ? null : InventoryItem.rehydrate(l);
  }

  async existeMovimiento(id: string): Promise<boolean> {
    return this.movimientos.has(id);
  }

  async ubicacionesRecordadas(): Promise<ReadonlyMap<string, string>> {
    return new Map(this.recordadas);
  }

  async guardar(cambios: CambiosDespensa): Promise<void> {
    for (const u of cambios.ubicaciones ?? []) this.ubicaciones.set(u.id, u.toSnapshot());
    for (const l of cambios.lineas ?? []) this.lineas.set(l.id, l.toSnapshot());
    for (const m of cambios.movimientos ?? []) this.movimientos.set(m.id, m);
    for (const r of cambios.recordar ?? []) this.recordadas.set(r.nombreNormalizado, r.ubicacionId);
    for (const nombre of cambios.olvidar ?? []) this.recordadas.delete(nombre);
    const cambio = cambios.reubicarRecordadas;
    if (cambio !== undefined) {
      for (const [nombre, ubicacionId] of this.recordadas) {
        if (ubicacionId !== cambio.desde) continue;
        if (cambio.hacia === null) this.recordadas.delete(nombre);
        else this.recordadas.set(nombre, cambio.hacia);
      }
    }
    this.guardados += 1;
  }

  /** Para los tests: incluidas las dadas de baja. */
  linea(id: string): InventoryItemSnapshot | undefined {
    return this.lineas.get(id);
  }
}
