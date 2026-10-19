/**
 * Categorías de producto, compartidas por Catalog, Shopping y Pantry. El orden es el
 * de un recorrido típico por el súper: así se agrupa la lista de la compra.
 */
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
  "otros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_POR_DEFECTO: Categoria = "otros";

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
  otros: "Otros",
};

export function esCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor);
}

/** Para ordenar: por la posición de la categoría en el recorrido del súper. */
export function compararCategorias(a: Categoria, b: Categoria): number {
  return CATEGORIAS.indexOf(a) - CATEGORIAS.indexOf(b);
}

/** Qué conserva una ubicación: sirve para proponer dónde guardar cada cosa. */
export const TIPOS_UBICACION = ["frio", "congelado", "ambiente"] as const;
export type TipoUbicacion = (typeof TIPOS_UBICACION)[number];

const FRIO: ReadonlySet<Categoria> = new Set([
  "vacuno",
  "pollo_pavo",
  "cerdo_cordero",
  "charcuteria",
  "pescado",
  "lacteos_huevos",
]);

/** Congelados al congelador; carnes, pescado, lácteos y charcutería al frío; el resto, ambiente. */
export function tipoDeUbicacion(categoria: Categoria): TipoUbicacion {
  if (categoria === "congelados") return "congelado";
  return FRIO.has(categoria) ? "frio" : "ambiente";
}
