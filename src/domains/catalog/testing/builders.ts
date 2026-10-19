import type { ProductoRecordado } from "@/domains/catalog/domain/producto-recordado";
import type { ProductoBaseConSinonimos } from "./in-memory-producto-base-repository";

export const AHORA = new Date("2026-10-20T10:00:00.000Z");
export const DESPUES = new Date("2026-10-20T10:05:00.000Z");
export const PLATANO_ID = "0199c000-0000-7000-8000-0000000000c1";
export const LECHE_ID = "0199c000-0000-7000-8000-0000000000c2";

export const PLATANO: ProductoBaseConSinonimos = {
  id: PLATANO_ID,
  nombre: "Plátano de Canarias",
  categoria: "frutas",
  unidadPorDefecto: "kg",
  sinonimos: ["plátano", "banana"],
};

export const LECHE: ProductoBaseConSinonimos = {
  id: LECHE_ID,
  nombre: "Leche entera",
  categoria: "lacteos_huevos",
  unidadPorDefecto: "l",
};

export function recordado(cambios: Partial<ProductoRecordado> = {}): ProductoRecordado {
  return {
    nombreNormalizado: "tarta de la abuela",
    nombre: "Tarta de la abuela",
    categoria: "panaderia",
    unidad: "unidad",
    usos: 1,
    ultimoUso: AHORA,
    ...cambios,
  };
}
