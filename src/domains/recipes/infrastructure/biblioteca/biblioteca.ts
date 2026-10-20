import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { normalizarNombre } from "@/shared/kernel/texto";
import { UNIDADES } from "@/shared/kernel/unidad";

/**
 * Biblioteca de recetas (vista 4). Vive en el repo como lotes JSON (`lote-NNN.json`)
 * que se revisan en un PR; `prisma db seed` los carga en la BD. La app solo lee la BD.
 *
 * Cada ingrediente nombra productos de la lista base (catálogo) por su nombre exacto:
 * así la receta se cruza con la despensa por vínculo. Los lotes nuevos los propone
 * `scripts/generar-recetas.ts` y pasan por la misma validación.
 */

export const ETIQUETAS = [
  "arroz",
  "pasta",
  "legumbres",
  "verduras",
  "carne",
  "pollo",
  "pescado",
  "huevos",
  "sopas",
  "ensaladas",
  "rápida",
  "horno",
  "vegetariana",
  "postre",
  "desayuno",
] as const;

const cantidadSchema = z.object({
  valor: z.number().positive().max(100_000),
  unidad: z.enum(UNIDADES),
});

export const ingredienteBibliotecaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(60),
    /** Nombres exactos de la lista base que lo cubren; el primero es el que se compra. */
    productos: z.array(z.string().trim().min(1)).max(12).default([]),
    cantidad: cantidadSchema.optional(),
    /** «2 dientes», «un chorrito», «1 mediana»: se enseña tal cual. */
    nota: z.string().trim().min(1).max(40).optional(),
    /** De fondo de armario (sal, aceite, ajo, especias): no se comprueba. */
    basico: z.boolean().default(false),
    opcional: z.boolean().default(false),
  })
  .refine((i) => i.basico || i.productos.length > 0, {
    message: "Un ingrediente que no es básico necesita al menos un producto del catálogo",
    path: ["productos"],
  });

export const recetaBibliotecaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug en minúsculas y con guiones"),
  nombre: z.string().trim().min(2).max(80),
  descripcion: z.string().trim().min(10).max(200),
  raciones: z.number().int().min(1).max(12),
  minutos: z.number().int().min(1).max(600),
  etiquetas: z.array(z.enum(ETIQUETAS)).max(5).default([]),
  ingredientes: z.array(ingredienteBibliotecaSchema).min(2).max(25),
  pasos: z.array(z.string().trim().min(5).max(400)).min(1).max(20),
});

export const loteRecetasSchema = z.object({
  version: z.literal(1),
  recetas: z.array(recetaBibliotecaSchema).min(1),
});

export type RecetaBiblioteca = z.infer<typeof recetaBibliotecaSchema>;
export type IngredienteBiblioteca = z.infer<typeof ingredienteBibliotecaSchema>;

const CARPETA = fileURLToPath(new URL(".", import.meta.url));

/** Los lotes de la carpeta, en orden. Lanza si alguno no cumple el esquema. */
export function cargarBiblioteca(carpeta = CARPETA): RecetaBiblioteca[] {
  return readdirSync(carpeta)
    .filter((f) => /^lote-\d{3}\.json$/.test(f))
    .sort()
    .flatMap((fichero) => {
      const datos: unknown = JSON.parse(readFileSync(`${carpeta}/${fichero}`, "utf8"));
      const lote = loteRecetasSchema.safeParse(datos);
      if (!lote.success) {
        throw new Error(`${fichero} no es un lote válido:\n${z.prettifyError(lote.error)}`);
      }
      return lote.data.recetas;
    });
}

/**
 * Comprueba la biblioteca contra el catálogo: cada producto nombrado existe y no hay
 * slugs repetidos. Devuelve los problemas (vacío si está bien). El catálogo lo pasa
 * quien llama (seed, test, generador): Recetas no importa Catalog.
 */
export function problemasDeBiblioteca(
  recetas: readonly RecetaBiblioteca[],
  nombresCatalogo: Iterable<string>,
): string[] {
  const catalogo = new Set([...nombresCatalogo].map(normalizarNombre));
  const problemas: string[] = [];
  const slugs = new Set<string>();

  for (const receta of recetas) {
    if (slugs.has(receta.slug)) problemas.push(`${receta.slug}: slug repetido`);
    slugs.add(receta.slug);
    for (const ingrediente of receta.ingredientes) {
      for (const producto of ingrediente.productos) {
        if (!catalogo.has(normalizarNombre(producto))) {
          problemas.push(`${receta.slug}: «${producto}» no está en la lista base`);
        }
      }
    }
  }
  return problemas;
}
