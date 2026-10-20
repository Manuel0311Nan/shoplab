import { InventoryItem, type InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import { Ubicacion, type UbicacionSnapshot } from "@/domains/pantry/domain/ubicacion";
import { Cantidad } from "@/shared/kernel/cantidad";
import { Dia } from "@/shared/kernel/dia";
import { normalizarNombre } from "@/shared/kernel/texto";

export const AHORA = new Date("2026-10-20T10:00:00.000Z");
export const DESPUES = new Date("2026-10-20T10:05:00.000Z");
/** Hoy en Madrid a la hora AHORA. */
export const HOY = "2026-10-20";

export const USUARIO_ID = "0199c000-0000-7000-8000-0000000000e0";
export const NEVERA_ID = "0199c000-0000-7000-8000-0000000000e1";
export const CONGELADOR_ID = "0199c000-0000-7000-8000-0000000000e2";
export const ARMARIO_ID = "0199c000-0000-7000-8000-0000000000e3";
export const LINEA_ID = "0199c000-0000-7000-8000-0000000000f1";
export const OTRA_LINEA_ID = "0199c000-0000-7000-8000-0000000000f2";
export const LECHE_BASE_ID = "0199c000-0000-7000-8000-0000000000f9";

/** Ids distintos para movimientos y líneas de prueba (n de 1 a 999). */
export const idN = (n: number) => `0199c000-0000-7000-8000-000000001${String(n).padStart(3, "0")}`;

export function cantidad(valor: number, unidad: string): Cantidad {
  const r = Cantidad.create(valor, unidad);
  if (!r.ok) throw new Error(`Cantidad de prueba no válida: ${r.error.code}`);
  return r.value;
}

export function dia(texto: string): Dia {
  const r = Dia.create(texto);
  if (!r.ok) throw new Error(`Día de prueba no válido: ${texto}`);
  return r.value;
}

export function ubicacion(cambios: Partial<UbicacionSnapshot> = {}): Ubicacion {
  return Ubicacion.rehydrate({
    id: NEVERA_ID,
    nombre: "Nevera",
    tipo: "frio",
    orden: 1,
    createdAt: AHORA,
    updatedAt: AHORA,
    deletedAt: null,
    ...cambios,
  });
}

/** Nevera, Congelador y Armario, como las crea el alta del hogar. */
export function ubicacionesPorDefecto(): Ubicacion[] {
  return [
    ubicacion(),
    ubicacion({ id: CONGELADOR_ID, nombre: "Congelador", tipo: "congelado", orden: 2 }),
    ubicacion({ id: ARMARIO_ID, nombre: "Armario", tipo: "ambiente", orden: 3 }),
  ];
}

export function linea(cambios: Partial<InventoryItemSnapshot> = {}): InventoryItem {
  const nombre = cambios.nombre ?? "Leche";
  const c = cambios.cantidad ?? cantidad(2, "l");
  return InventoryItem.rehydrate({
    id: LINEA_ID,
    nombre,
    nombreNormalizado: normalizarNombre(nombre),
    productoBaseId: null,
    categoria: "lacteos_huevos",
    ubicacionId: NEVERA_ID,
    cantidad: c,
    cantidadReferencia: c,
    caducaEl: null,
    abiertoEl: null,
    avisoAbierto: null,
    createdAt: AHORA,
    updatedAt: AHORA,
    deletedAt: null,
    ...cambios,
  });
}

export const contexto = (n = 1) => ({ id: idN(n), usuarioId: USUARIO_ID });
