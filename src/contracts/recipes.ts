import { z } from "zod";
import { unidadSchema } from "./shopping";

/** Cantidad sin validar (puede ser 0,5 ud.): la de los ingredientes y lo que falta. */
export const medidaSchema = z.object({ valor: z.number(), unidad: unidadSchema });

export const estadoIngredienteSchema = z.enum(["tienes", "poco", "falta", "opcional", "basico"]);

export const ingredienteRecetaSchema = z.object({
  nombre: z.string(),
  nota: z.string().nullable(),
  basico: z.boolean(),
  opcional: z.boolean(),
  /** El producto de la lista base que se añade a la compra si falta. */
  producto: z.object({ id: z.uuid(), nombre: z.string() }).nullable(),
  /** Para las raciones de la receta: base para escalar al editar. */
  cantidadBase: medidaSchema.nullable(),
  /** Para las raciones que se miran. */
  cantidad: medidaSchema.nullable(),
  /** Lo que hay, en la unidad del ingrediente; null si no hay o no se puede medir. */
  disponible: medidaSchema.nullable(),
  hay: z.boolean(),
  falta: medidaSchema.nullable(),
  estado: estadoIngredienteSchema,
});

export const recetaResumenSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  minutos: z.number().int(),
  etiquetas: z.array(z.string()),
  /** Las de la receta. */
  raciones: z.number().int(),
  /** Las que salen con lo que hay (como mucho, las de la receta). */
  racionesSugeridas: z.number().int(),
  sePuedeHacer: z.boolean(),
  faltan: z.number().int(),
  /** Nombres de lo que falta (o no llega) para las raciones sugeridas. */
  queFalta: z.array(z.string()),
  /** Lo de la despensa que usa y caduca antes. */
  caduca: z.object({ nombre: z.string(), dias: z.number().int() }).nullable(),
});

/** GET /api/v1/recipes */
export const sugerenciasResponseSchema = z.object({
  puedes: z.array(recetaResumenSchema),
  casi: z.array(recetaResumenSchema),
  /** Recetas que necesitan más compra: no se listan. */
  masCompra: z.number().int(),
  despensaVacia: z.boolean(),
});

/** GET /api/v1/recipes/{recipeId}?raciones= */
export const recetaDetalleResponseSchema = recetaResumenSchema.extend({
  /** Las que se están mirando (las sugeridas, o las de ?raciones=). */
  racionesElegidas: z.number().int(),
  /** Enteras que salen con lo que hay; null si nada limita. */
  racionesPosibles: z.number().int().nullable(),
  ingredientes: z.array(ingredienteRecetaSchema),
  pasos: z.array(z.string()),
});

export const recetaQuerySchema = z.object({
  raciones: z.coerce.number().int().min(1).max(12).optional(),
});

/** POST /api/v1/recipes/{recipeId}/missing-to-list: lo que falta para esas raciones, a una lista. */
export const faltantesALaListaRequestSchema = z.object({
  raciones: z.number().int().min(1).max(12),
  /** Sin ella, la lista activa usada más recientemente. */
  listaId: z.uuid().optional(),
});

export const faltantesALaListaResponseSchema = z.object({
  listaId: z.uuid(),
  listaNombre: z.string(),
  anadidos: z.number().int(),
  /** Ya estaban en la lista: no se tocan. */
  yaEstaban: z.number().int(),
});

export type MedidaResponse = z.infer<typeof medidaSchema>;
export type IngredienteRecetaResponse = z.infer<typeof ingredienteRecetaSchema>;
export type RecetaResumenResponse = z.infer<typeof recetaResumenSchema>;
export type SugerenciasResponse = z.infer<typeof sugerenciasResponseSchema>;
export type RecetaDetalleResponse = z.infer<typeof recetaDetalleResponseSchema>;
export type FaltantesALaListaRequest = z.infer<typeof faltantesALaListaRequestSchema>;
export type FaltantesALaListaResponse = z.infer<typeof faltantesALaListaResponseSchema>;
