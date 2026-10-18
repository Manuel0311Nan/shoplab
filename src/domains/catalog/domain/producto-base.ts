import type { Unidad } from "@/shared/kernel/unidad";

/** Secciones de la lista base, en el orden en que se recorre un súper. */
export const CATEGORIAS = [
  "frutas",
  "verduras",
  "vacuno",
  "pollo_pavo",
  "cerdo_cordero",
  "charcuteria",
  "pescado",
  "lacteos_huevos",
  "panaderia",
  "despensa",
  "especias",
  "bebidas",
  "congelados",
  "limpieza",
  "higiene",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const NOMBRE_CATEGORIA: Readonly<Record<Categoria, string>> = {
  frutas: "Frutas",
  verduras: "Verduras y hortalizas",
  vacuno: "Carne de vacuno",
  pollo_pavo: "Carne de pollo y pavo",
  cerdo_cordero: "Carne de cerdo y cordero",
  charcuteria: "Charcutería",
  pescado: "Pescado y marisco",
  lacteos_huevos: "Lácteos y huevos",
  panaderia: "Panadería y cereales",
  despensa: "Despensa",
  especias: "Especias y condimentos",
  bebidas: "Bebidas",
  congelados: "Congelados",
  limpieza: "Limpieza",
  higiene: "Higiene",
};

/**
 * Producto de la lista base (global, igual para todos los hogares). Solo sirve para
 * autocompletar: al elegirlo, el ítem copia el nombre y la unidad y guarda el id.
 */
export interface ProductoBase {
  readonly id: string;
  readonly nombre: string;
  readonly categoria: Categoria;
  readonly unidadPorDefecto: Unidad;
}

/** Orden de la lista base: por sección del súper y, dentro, alfabético en español. */
export function compararProductos(a: ProductoBase, b: ProductoBase): number {
  return (
    CATEGORIAS.indexOf(a.categoria) - CATEGORIAS.indexOf(b.categoria) ||
    a.nombre.localeCompare(b.nombre, "es")
  );
}
