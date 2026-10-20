import type { Existencia } from "@/domains/recipes/domain/disponibilidad";
import type {
  IngredienteReceta,
  ProductoAlternativo,
  Receta,
} from "@/domains/recipes/domain/receta";
import { Cantidad } from "@/shared/kernel/cantidad";
import { normalizarNombre } from "@/shared/kernel/texto";

export const RECETA_ID = "0199d000-0000-7000-8000-0000000000a1";
export const OTRA_RECETA_ID = "0199d000-0000-7000-8000-0000000000a2";

/** Ids distintos para recetas de prueba (n de 1 a 999). */
export const recetaIdN = (n: number) =>
  `0199d000-0000-7000-8000-000000002${String(n).padStart(3, "0")}`;

export function cantidad(valor: number, unidad: string): Cantidad {
  const r = Cantidad.create(valor, unidad);
  if (!r.ok) throw new Error(`Cantidad de prueba no válida: ${r.error.code}`);
  return r.value;
}

/** Producto del catálogo con un id estable derivado del nombre. */
export function producto(nombre: string): ProductoAlternativo {
  const nombreNormalizado = normalizarNombre(nombre);
  let hash = 0;
  for (const c of nombreNormalizado) hash = (hash * 31 + c.charCodeAt(0)) % 1_000_000;
  return {
    id: `0199d000-0000-7000-8000-${String(hash).padStart(12, "0")}`,
    nombre,
    nombreNormalizado,
  };
}

export function ingrediente(
  nombre: string,
  valor: number | null,
  unidad = "g",
  cambios: Partial<IngredienteReceta> = {},
): IngredienteReceta {
  return {
    nombre,
    productos: [producto(nombre)],
    cantidad: valor === null ? null : cantidad(valor, unidad),
    nota: null,
    basico: false,
    opcional: false,
    ...cambios,
  };
}

export function receta(cambios: Partial<Receta> = {}): Receta {
  return {
    id: RECETA_ID,
    slug: "arroz-con-pollo",
    nombre: "Arroz con pollo",
    descripcion: "Un clásico de domingo.",
    raciones: 4,
    minutos: 45,
    etiquetas: ["arroz"],
    ingredientes: [
      ingrediente("Arroz redondo", 300, "g"),
      ingrediente("Pechuga de pollo", 500, "g"),
      ingrediente("Ajos", null, "unidad", { nota: "2 dientes" }),
      ingrediente("Sal", null, "g", { basico: true, productos: [] }),
    ],
    pasos: ["Dorar el pollo.", "Añadir el arroz y el agua."],
    ...cambios,
  };
}

export function existencia(
  nombre: string,
  valor: number,
  unidad: string,
  cambios: Partial<Existencia> = {},
): Existencia {
  const p = producto(nombre);
  return {
    nombre,
    productoBaseId: p.id,
    nombreNormalizado: p.nombreNormalizado,
    cantidad: cantidad(valor, unidad),
    caducaEnDias: null,
    ...cambios,
  };
}
