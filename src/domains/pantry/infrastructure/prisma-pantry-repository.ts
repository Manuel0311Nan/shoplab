import "server-only";
import type {
  CambiosDespensa,
  PantryRepository,
} from "@/domains/pantry/application/ports/pantry-repository";
import type { InventoryItem } from "@/domains/pantry/domain/inventory-item";
import type { Ubicacion } from "@/domains/pantry/domain/ubicacion";
import { convertirCantidad } from "@/shared/kernel/cantidad";
import { Dia } from "@/shared/kernel/dia";
import { TenantRepository } from "@/shared/kernel/tenant-repository";
import { lineaToDomain, ubicacionToDomain } from "./pantry.mapper";

export class PrismaPantryRepository extends TenantRepository implements PantryRepository {
  async listarUbicaciones(): Promise<Ubicacion[]> {
    const filas = await this.db.ubicacion.findMany({
      where: { deletedAt: null },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
    });
    return filas.map(ubicacionToDomain);
  }

  async listarLineas(): Promise<InventoryItem[]> {
    const filas = await this.db.inventoryItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return filas.map(lineaToDomain);
  }

  async findLinea(id: string): Promise<InventoryItem | null> {
    const fila = await this.db.inventoryItem.findFirst({ where: { id, deletedAt: null } });
    return fila === null ? null : lineaToDomain(fila);
  }

  async existeMovimiento(id: string): Promise<boolean> {
    return (await this.db.movimientoDespensa.count({ where: { id } })) > 0;
  }

  async guardar(cambios: CambiosDespensa): Promise<void> {
    // Orden: ubicaciones antes que las líneas que apuntan a ellas, y líneas antes que
    // sus movimientos (claves foráneas).
    await this.db.$transaction([
      ...(cambios.ubicaciones ?? []).map((u) => {
        const { id, ...datos } = u.toSnapshot();
        return this.db.ubicacion.upsert({
          where: { id },
          create: { id, ...datos, hogarId: this.hogarId },
          update: datos,
        });
      }),
      ...(cambios.lineas ?? []).map((l) => {
        const s = l.toSnapshot();
        const referencia = convertirCantidad(s.cantidadReferencia, s.cantidad.unidad) ?? s.cantidad;
        const datos = {
          nombre: s.nombre,
          nombreNormalizado: s.nombreNormalizado,
          productoBaseId: s.productoBaseId,
          categoria: s.categoria,
          ubicacionId: s.ubicacionId,
          cantidadValor: s.cantidad.valor,
          cantidadUnidad: s.cantidad.unidad,
          cantidadReferencia: referencia.valor,
          caducaEl: s.caducaEl === null ? null : Dia.aFechaBd(s.caducaEl),
          updatedAt: s.updatedAt,
          deletedAt: s.deletedAt,
        };
        return this.db.inventoryItem.upsert({
          where: { id: s.id },
          create: { ...datos, id: s.id, hogarId: this.hogarId, createdAt: s.createdAt },
          update: datos,
        });
      }),
      ...(cambios.movimientos ?? []).map((m) =>
        this.db.movimientoDespensa.create({
          data: {
            id: m.id,
            hogarId: this.hogarId,
            inventoryItemId: m.inventoryItemId,
            tipo: m.tipo,
            cantidadValor: m.cantidad.valor,
            cantidadUnidad: m.cantidad.unidad,
            origen: m.origen,
            listaId: m.listaId,
            usuarioId: m.usuarioId,
            createdAt: m.createdAt,
          },
        }),
      ),
    ]);
  }
}
