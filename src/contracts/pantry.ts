import { z } from "zod";
import { categoriaSchema } from "./categoria";
import { cantidadSchema, productoEditadoSchema } from "./shopping";

/** Un día sin hora: AAAA-MM-DD. El dominio comprueba que existe (no 30 de febrero). */
export const diaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD");

export const tipoUbicacionSchema = z.enum(["frio", "congelado", "ambiente"]);
export const estadoCaducidadSchema = z.enum(["caducado", "pronto", "ok", "sin_fecha"]);
export const motivoConsumoSchema = z.enum(["gastado", "tirado"]);
export const colorAbiertoSchema = z.enum(["verde", "amarillo", "rojo"]);

const nombreProducto = z
  .string()
  .trim()
  .min(1, "Escribe un nombre")
  .max(80, "Máximo 80 caracteres");
const nombreUbicacion = z.string().trim().min(1, "Ponle un nombre").max(30, "Máximo 30 caracteres");

export const ubicacionSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  tipo: tipoUbicacionSchema,
  orden: z.number().int(),
});

export const lineaDespensaSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  productoBaseId: z.uuid().nullable(),
  categoria: categoriaSchema,
  ubicacionId: z.uuid(),
  cantidad: cantidadSchema,
  caducaEl: diaSchema.nullable(),
  /** Calculado en el servidor, en hora del hogar: el cliente no recalcula "hoy". */
  caducidad: z.object({ estado: estadoCaducidadSchema, dias: z.number().int().nullable() }),
  quedaPoco: z.boolean(),
  /**
   * Paquete abierto (null: cerrado). No es caducidad: avisa para revisar si sigue bueno.
   * Verde hasta aviso.amarillo días abierto, amarillo hasta aviso.rojo, rojo después.
   */
  abierto: z
    .object({
      el: diaSchema,
      dias: z.number().int(),
      color: colorAbiertoSchema,
      aviso: z.object({ amarillo: z.number().int(), rojo: z.number().int() }),
    })
    .nullable(),
  updatedAt: z.iso.datetime(),
});

/** GET /pantry: todo (como mucho 500 líneas), sin paginar. */
export const pantryResponseSchema = z.object({
  hoy: diaSchema,
  ubicaciones: z.array(ubicacionSchema),
  lineas: z.array(lineaDespensaSchema),
});

const productoEntrante = {
  nombre: nombreProducto,
  productoBaseId: z.uuid().nullish(),
  /** Sin ella, la decide el servidor (lista base, memoria del hogar u «otros»). */
  categoria: categoriaSchema.optional(),
  /** Sin ella, se propone por la categoría. */
  ubicacionId: z.uuid().optional(),
  cantidad: cantidadSchema,
  caducaEl: diaSchema.nullish(),
};

/** POST /pantry/items. `id` es el del movimiento de entrada: repetir el envío no suma dos veces. */
export const addStockRequestSchema = z.object({ id: z.uuid().optional(), ...productoEntrante });

/** POST /pantry/items/batch: "Guardar en la despensa" al terminar la compra. */
export const storeShoppingRequestSchema = z.object({
  listaId: z.uuid(),
  productos: z
    .array(z.object({ id: z.uuid(), ...productoEntrante }))
    .min(1, "Elige al menos un producto")
    .max(200),
});

export const storeShoppingResponseSchema = z.object({
  guardados: z.number().int(),
  repetidos: z.number().int(),
});

export const updateStockRequestSchema = z
  .object({
    ubicacionId: z.uuid().optional(),
    /** null quita la fecha. */
    caducaEl: diaSchema.nullable().optional(),
    categoria: categoriaSchema.optional(),
    /** Corrige el total. */
    cantidad: cantidadSchema.optional(),
    /** Solo en una línea abierta: corrige el día en que se abrió, o null para cerrarla. */
    abiertoEl: diaSchema.nullable().optional(),
    /** Renombrar: el nombre nuevo y, si se eligió en el autocompletado, su producto base. */
    producto: productoEditadoSchema.optional(),
  })
  .refine(
    (b) =>
      b.ubicacionId !== undefined ||
      b.caducaEl !== undefined ||
      b.categoria !== undefined ||
      b.cantidad !== undefined ||
      b.producto !== undefined ||
      b.abiertoEl !== undefined,
    { message: "Indica al menos un cambio" },
  );

/**
 * POST /pantry/items/{id}/open. Sin `abiertoEl`, hoy. Con varias unidades se abre una:
 * va a su propia línea (`lineaNuevaId`, generable en el cliente para que un reintento
 * no separe otra) y en la original queda el resto.
 */
export const openStockRequestSchema = z.object({
  abiertoEl: diaSchema.optional(),
  lineaNuevaId: z.uuid().optional(),
});

export const openStockResponseSchema = z.object({
  abierta: lineaDespensaSchema,
  /** La línea original con lo que queda cerrado; null si se abrió entera. */
  resto: lineaDespensaSchema.nullable(),
});

/** POST /pantry/items/{id}/consume. Sin cantidad, todo lo que queda. */
export const consumeStockRequestSchema = z.object({
  id: z.uuid().optional(),
  cantidad: cantidadSchema.optional(),
  motivo: motivoConsumoSchema,
});

export const consumeStockResponseSchema = z.object({
  linea: z.object({ id: z.uuid(), cantidad: cantidadSchema, agotada: z.boolean() }),
  /** Proponer "¿Añadir a la lista?" (D8). */
  avisarLista: z.boolean(),
});

/**
 * POST /pantry/movements/{id}/undo: «Deshacer» un gasto o desecho recién hecho (unos
 * minutos de margen). `id` es el del ajuste, generable en el cliente.
 */
export const deshacerConsumoRequestSchema = z.object({ id: z.uuid() });

export const createUbicacionRequestSchema = z.object({
  id: z.uuid().optional(),
  nombre: nombreUbicacion,
  tipo: tipoUbicacionSchema,
});

export const updateUbicacionRequestSchema = z
  .object({
    nombre: nombreUbicacion.optional(),
    tipo: tipoUbicacionSchema.optional(),
    /** Nueva posición, 1 = la primera. */
    posicion: z.number().int().min(1).optional(),
  })
  .refine((b) => b.nombre !== undefined || b.tipo !== undefined || b.posicion !== undefined, {
    message: "Indica nombre, tipo o posición",
  });

/** DELETE /pantry/locations/{id}?destinoId=…: a dónde mover lo que tenga. */
export const deleteUbicacionQuerySchema = z.object({ destinoId: z.uuid().optional() });

export type TipoUbicacionDto = z.infer<typeof tipoUbicacionSchema>;
export type EstadoCaducidadDto = z.infer<typeof estadoCaducidadSchema>;
export type MotivoConsumoDto = z.infer<typeof motivoConsumoSchema>;
export type UbicacionResponse = z.infer<typeof ubicacionSchema>;
export type LineaDespensaResponse = z.infer<typeof lineaDespensaSchema>;
export type PantryResponse = z.infer<typeof pantryResponseSchema>;
export type AddStockRequest = z.input<typeof addStockRequestSchema>;
export type StoreShoppingRequest = z.input<typeof storeShoppingRequestSchema>;
export type StoreShoppingResponse = z.infer<typeof storeShoppingResponseSchema>;
export type UpdateStockRequest = z.input<typeof updateStockRequestSchema>;
export type ConsumeStockRequest = z.input<typeof consumeStockRequestSchema>;
export type DeshacerConsumoRequest = z.input<typeof deshacerConsumoRequestSchema>;
export type OpenStockRequest = z.input<typeof openStockRequestSchema>;
export type OpenStockResponse = z.infer<typeof openStockResponseSchema>;
export type ColorAbiertoDto = z.infer<typeof colorAbiertoSchema>;
export type ConsumeStockResponse = z.infer<typeof consumeStockResponseSchema>;
export type CreateUbicacionRequest = z.input<typeof createUbicacionRequestSchema>;
export type UpdateUbicacionRequest = z.input<typeof updateUbicacionRequestSchema>;
