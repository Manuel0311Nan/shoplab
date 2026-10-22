import "server-only";
import type {
  CambiosDespensa,
  PantryRepository,
} from "@/domains/pantry/application/ports/pantry-repository";
import type { InventoryItem, MovimientoSnapshot } from "@/domains/pantry/domain/inventory-item";
import type { Ubicacion } from "@/domains/pantry/domain/ubicacion";
import { convertirCantidad } from "@/shared/kernel/cantidad";
import { Dia } from "@/shared/kernel/dia";
import type { TenantPrismaClient } from "@/shared/kernel/tenant-prisma";
import { TenantRepository } from "@/shared/kernel/tenant-repository";
import { lineaToDomain, movimientoToSnapshot, ubicacionToDomain } from "./pantry.mapper";

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

  async buscarMovimiento(
    id: string,
  ): Promise<{ movimiento: MovimientoSnapshot; linea: InventoryItem } | null> {
    const fila = await this.db.movimientoDespensa.findFirst({
      where: { id },
      include: { inventoryItem: true },
    });
    if (fila === null) return null;
    return { movimiento: movimientoToSnapshot(fila), linea: lineaToDomain(fila.inventoryItem) };
  }

  async existeMovimiento(id: string): Promise<boolean> {
    return (await this.db.movimientoDespensa.count({ where: { id } })) > 0;
  }

  async ubicacionesRecordadas(): Promise<ReadonlyMap<string, string>> {
    const filas = await this.db.ubicacionRecordada.findMany({
      select: { nombreNormalizado: true, ubicacionId: true },
    });
    return new Map(filas.map((f) => [f.nombreNormalizado, f.ubicacionId]));
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
          abiertoEl: s.abiertoEl === null ? null : Dia.aFechaBd(s.abiertoEl),
          avisoAbiertoAmarillo: s.avisoAbierto?.amarillo ?? null,
          avisoAbiertoRojo: s.avisoAbierto?.rojo ?? null,
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
      // Después de las ubicaciones: la memoria apunta a ellas.
      ...(cambios.recordar ?? []).map((r) =>
        this.db.ubicacionRecordada.upsert({
          where: {
            hogarId_nombreNormalizado: {
              hogarId: this.hogarId,
              nombreNormalizado: r.nombreNormalizado,
            },
          },
          create: { ...r, hogarId: this.hogarId },
          update: { ubicacionId: r.ubicacionId },
        }),
      ),
      ...reubicar(this.db, cambios.reubicarRecordadas),
      ...((cambios.olvidar ?? []).length === 0
        ? []
        : [
            this.db.ubicacionRecordada.deleteMany({
              where: { nombreNormalizado: { in: [...(cambios.olvidar ?? [])] } },
            }),
          ]),
    ]);
  }
}

function reubicar(db: TenantPrismaClient, cambio: CambiosDespensa["reubicarRecordadas"]) {
  if (cambio === undefined) return [];
  const where = { ubicacionId: cambio.desde };
  return cambio.hacia === null
    ? [db.ubicacionRecordada.deleteMany({ where })]
    : [db.ubicacionRecordada.updateMany({ where, data: { ubicacionId: cambio.hacia } })];
}
