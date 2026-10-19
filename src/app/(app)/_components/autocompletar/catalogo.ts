"use client";
import {
  catalogProductsResponseSchema,
  householdProductsResponseSchema,
} from "@/contracts/catalog";
import { normalizarNombre } from "@/shared/kernel/texto";
import type { Sugerencia } from "./sugerencia";

let base: Promise<Sugerencia[]> | null = null;
let hogar: { cargado: number; promesa: Promise<Sugerencia[]> } | null = null;

/** La memoria del hogar cambia con cada producto nuevo: se vuelve a pedir pasado este tiempo. */
const REFRESCO_HOGAR_MS = 30_000;

async function pedir<T>(url: string, parse: (json: unknown) => T): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return parse(await res.json());
}

/**
 * La lista base, descargada una sola vez por pestaña (el navegador la guarda un día).
 * Si falla, se reintenta en el siguiente foco.
 */
function cargarBase(): Promise<Sugerencia[]> {
  base ??= pedir("/api/v1/catalog/products", (json) =>
    catalogProductsResponseSchema.parse(json).items.map((p): Sugerencia => ({
      clave: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      unidad: p.unidadPorDefecto,
      productoBaseId: p.id,
      origen: "base",
      usos: 0,
    })),
  ).catch((error: unknown) => {
    base = null;
    throw error;
  });
  return base;
}

function cargarHogar(): Promise<Sugerencia[]> {
  if (hogar === null || Date.now() - hogar.cargado > REFRESCO_HOGAR_MS) {
    const promesa = pedir("/api/v1/catalog/household-products", (json) =>
      householdProductsResponseSchema.parse(json).items.map((p): Sugerencia => ({
        clave: `hogar:${normalizarNombre(p.nombre)}`,
        nombre: p.nombre,
        categoria: p.categoria,
        unidad: p.unidad,
        productoBaseId: null,
        origen: "hogar",
        usos: p.usos,
      })),
    ).catch((error: unknown) => {
      hogar = null;
      throw error;
    });
    hogar = { cargado: Date.now(), promesa };
  }
  return hogar.promesa;
}

/**
 * Sugerencias de la lista base y del hogar. Si el hogar recuerda un producto de la lista
 * base (porque le cambió la categoría), sale una sola vez, con la categoría del hogar.
 * Sin red, devuelve lo que pueda: el campo sigue funcionando como texto libre.
 */
export async function cargarSugerencias(): Promise<Sugerencia[]> {
  const [delCatalogo, delHogar] = await Promise.all([
    cargarBase().catch(() => []),
    cargarHogar().catch(() => []),
  ]);
  const propias = new Map(delHogar.map((s) => [normalizarNombre(s.nombre), s]));
  const fusionadas = delCatalogo.map((s) => {
    const propia = propias.get(normalizarNombre(s.nombre));
    if (propia === undefined) return s;
    propias.delete(normalizarNombre(s.nombre));
    return { ...s, categoria: propia.categoria, usos: propia.usos };
  });
  return [...propias.values(), ...fusionadas];
}
