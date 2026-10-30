import type { Prisma } from "@/generated/prisma/client";
import { InventoryItem, type MovimientoSnapshot } from "@/domains/pantry/domain/inventory-item";
import { Ubicacion } from "@/domains/pantry/domain/ubicacion";
import { Cantidad } from "@/shared/kernel/cantidad";
import { Dia } from "@/shared/kernel/dia";

type FilaLinea = Prisma.InventoryItemGetPayload<object>;
type FilaUbicacion = Prisma.UbicacionGetPayload<object>;
type FilaMovimiento = Prisma.MovimientoDespensaGetPayload<object>;

function cantidadDesdeBd(valor: Prisma.Decimal, unidad: string): Cantidad {
  const r = Cantidad.create(valor.toNumber(), unidad);
  if (!r.ok) throw new Error(`Cantidad corrupta en base de datos: ${r.error.code}`);
  return r.value;
}

export function lineaToDomain(fila: FilaLinea): InventoryItem {
  return InventoryItem.rehydrate({
    id: fila.id,
    nombre: fila.nombre,
    nombreNormalizado: fila.nombreNormalizado,
    productoBaseId: fila.productoBaseId,
    categoria: fila.categoria,
    ubicacionId: fila.ubicacionId,
    cantidad: cantidadDesdeBd(fila.cantidadValor, fila.cantidadUnidad),
    // La referencia siempre se guarda en la unidad de la línea.
    cantidadReferencia: cantidadDesdeBd(fila.cantidadReferencia, fila.cantidadUnidad),
    caducaEl: fila.caducaEl === null ? null : Dia.desdeFechaBd(fila.caducaEl),
    abiertoEl: fila.abiertoEl === null ? null : Dia.desdeFechaBd(fila.abiertoEl),
    avisoAbierto:
      fila.avisoAbiertoAmarillo === null || fila.avisoAbiertoRojo === null
        ? null
        : { amarillo: fila.avisoAbiertoAmarillo, rojo: fila.avisoAbiertoRojo },
    porOrganizar: fila.porOrganizar,
    createdAt: fila.createdAt,
    updatedAt: fila.updatedAt,
    deletedAt: fila.deletedAt,
  });
}

export function ubicacionToDomain(fila: FilaUbicacion): Ubicacion {
  return Ubicacion.rehydrate({
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    orden: fila.orden,
    createdAt: fila.createdAt,
    updatedAt: fila.updatedAt,
    deletedAt: fila.deletedAt,
  });
}

export function movimientoToSnapshot(fila: FilaMovimiento): MovimientoSnapshot {
  return {
    id: fila.id,
    inventoryItemId: fila.inventoryItemId,
    tipo: fila.tipo,
    cantidad: cantidadDesdeBd(fila.cantidadValor, fila.cantidadUnidad),
    origen: fila.origen,
    listaId: fila.listaId,
    usuarioId: fila.usuarioId,
    createdAt: fila.createdAt,
  };
}
