import type { LineaDespensaResponse, PantryResponse, UbicacionResponse } from "@/contracts/pantry";
import {
  abiertoDe,
  type LineaDespensa,
  type VistaDespensa,
} from "@/domains/pantry/application/queries/get-pantry.query";
import { estadoCaducidad } from "@/domains/pantry/domain/estado-caducidad";
import { InventoryItem, type InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import type { UbicacionSnapshot } from "@/domains/pantry/domain/ubicacion";
import { systemClock } from "@/shared/kernel/clock";
import { hoyEn, ZONA_HOGAR } from "@/shared/kernel/dia";

export function toUbicacionResponse(u: UbicacionSnapshot): UbicacionResponse {
  return { id: u.id, nombre: u.nombre, tipo: u.tipo, orden: u.orden };
}

export function toLineaResponse(l: LineaDespensa): LineaDespensaResponse {
  return {
    id: l.id,
    nombre: l.nombre,
    productoBaseId: l.productoBaseId,
    categoria: l.categoria,
    ubicacionId: l.ubicacionId,
    cantidad: { valor: l.cantidad.valor, unidad: l.cantidad.unidad },
    caducaEl: l.caducaEl,
    caducidad: l.caducidad,
    quedaPoco: l.quedaPoco,
    abierto:
      l.abiertoEl === null || l.avisoAbierto === null || l.abierto === null
        ? null
        : {
            el: l.abiertoEl,
            dias: l.abierto.dias,
            color: l.abierto.color,
            aviso: { amarillo: l.avisoAbierto.amarillo, rojo: l.avisoAbierto.rojo },
          },
    updatedAt: l.updatedAt.toISOString(),
  };
}

export function toPantryResponse(vista: VistaDespensa): PantryResponse {
  return {
    hoy: vista.hoy,
    ubicaciones: vista.ubicaciones.map(toUbicacionResponse),
    lineas: vista.lineas.map(toLineaResponse),
  };
}

/** Tras un cambio: la línea con su caducidad calculada hoy, en hora del hogar. */
export function toLineaDesdeSnapshot(s: InventoryItemSnapshot): LineaDespensaResponse {
  const hoy = hoyEn(ZONA_HOGAR, systemClock);
  return toLineaResponse({
    ...s,
    caducidad: estadoCaducidad(s.caducaEl, hoy),
    quedaPoco: InventoryItem.rehydrate(s).quedaPoco(),
    abierto: abiertoDe(s, hoy),
  });
}
