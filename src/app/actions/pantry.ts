"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  abrirEnDespensa,
  actualizarEnDespensa,
  anadirADespensa,
  guardarCompra,
} from "@/app/_lib/pantry/despensa-con-catalogo";
import { ubicacionesRecordadas } from "@/app/_lib/memoria-hogar";
import { anadirProducto } from "@/app/_lib/shopping/productos-con-catalogo";
import { toLineaDesdeSnapshot, toUbicacionResponse } from "@/app/_lib/pantry/to-response";
import { categoriaSchema } from "@/contracts/categoria";
import type { UbicacionesRecordadas } from "@/contracts/memoria";
import {
  type AddStockRequest,
  addStockRequestSchema,
  type ConsumeStockRequest,
  type ConsumeStockResponse,
  consumeStockRequestSchema,
  type DeshacerConsumoRequest,
  deshacerConsumoRequestSchema,
  type LineaDespensaResponse,
  type MoveStockRequest,
  type MoveStockResponse,
  moveStockRequestSchema,
  type OpenStockRequest,
  type OpenStockResponse,
  openStockRequestSchema,
  type StoreShoppingRequest,
  type StoreShoppingResponse,
  storeShoppingRequestSchema,
  type UbicacionResponse,
  type UpdateStockRequest,
  updateStockRequestSchema,
} from "@/contracts/pantry";
import { unidadSchema } from "@/contracts/shopping";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { notFoundError, validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

const idSchema = z.uuid();

function datosNoValidos() {
  return err(validationError("PETICION_NO_VALIDA", "Los datos enviados no son válidos"));
}

function revalidar() {
  revalidatePath("/despensa");
}

/** Alta manual. `null` si ese envío ya se había guardado. */
export async function anadirADespensaAction(
  input: AddStockRequest,
): Promise<Result<LineaDespensaResponse | null>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const body = addStockRequestSchema.safeParse(input);
  if (!body.success) return datosNoValidos();

  const { id, ...producto } = body.data;
  const result = await anadirADespensa(auth.value, {
    ...producto,
    productoBaseId: producto.productoBaseId ?? null,
    caducaEl: producto.caducaEl ?? null,
    ...(id === undefined ? {} : { movimientoId: id }),
    usuarioId: auth.value.userId,
  });
  if (!result.ok) return result;
  revalidar();
  return ok(result.value === null ? null : toLineaDesdeSnapshot(result.value));
}

export async function consumirAction(
  itemId: string,
  input: ConsumeStockRequest,
): Promise<Result<ConsumeStockResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(itemId);
  const body = consumeStockRequestSchema.safeParse(input);
  if (!id.success || !body.success) return datosNoValidos();

  const result = await pantryModule(auth.value).consumeStock.execute({
    itemId: id.data,
    motivo: body.data.motivo,
    usuarioId: auth.value.userId,
    ...(body.data.cantidad === undefined ? {} : { cantidad: body.data.cantidad }),
    ...(body.data.id === undefined ? {} : { movimientoId: body.data.id }),
  });
  if (!result.ok) return result;
  revalidar();
  return ok({
    linea: {
      id: result.value.linea.id,
      cantidad: {
        valor: result.value.linea.cantidad.valor,
        unidad: result.value.linea.cantidad.unidad,
      },
      agotada: result.value.agotada,
    },
    avisarLista: result.value.avisarLista,
  });
}

export async function actualizarLineaAction(
  itemId: string,
  input: UpdateStockRequest,
): Promise<Result<LineaDespensaResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(itemId);
  const body = updateStockRequestSchema.safeParse(input);
  if (!id.success || !body.success) return datosNoValidos();

  const result = await actualizarEnDespensa(auth.value, {
    itemId: id.data,
    usuarioId: auth.value.userId,
    ...(body.data.ubicacionId === undefined ? {} : { ubicacionId: body.data.ubicacionId }),
    ...(body.data.caducaEl === undefined ? {} : { caducaEl: body.data.caducaEl }),
    ...(body.data.categoria === undefined ? {} : { categoria: body.data.categoria }),
    ...(body.data.cantidad === undefined ? {} : { cantidad: body.data.cantidad }),
    ...(body.data.abiertoEl === undefined ? {} : { abiertoEl: body.data.abiertoEl }),
    ...(body.data.producto === undefined ? {} : { producto: body.data.producto }),
  });
  if (!result.ok) return result;
  revalidar();
  return ok(toLineaDesdeSnapshot(result.value));
}

/** «Deshacer» tras gastar con un toque: devuelve lo gastado. */
export async function deshacerConsumoAction(
  movimientoId: string,
  input: DeshacerConsumoRequest,
): Promise<Result<LineaDespensaResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(movimientoId);
  const body = deshacerConsumoRequestSchema.safeParse(input);
  if (!id.success || !body.success) return datosNoValidos();

  const result = await pantryModule(auth.value).deshacerConsumo.execute({
    movimientoId: id.data,
    id: body.data.id,
    usuarioId: auth.value.userId,
  });
  if (!result.ok) return result;
  revalidar();
  return ok(toLineaDesdeSnapshot(result.value));
}

/** «Lo he abierto» (sin día, hoy). Devuelve la línea abierta y, si se separó, el resto. */
export async function abrirLineaAction(
  itemId: string,
  input: OpenStockRequest,
): Promise<Result<OpenStockResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(itemId);
  const body = openStockRequestSchema.safeParse(input);
  if (!id.success || !body.success) return datosNoValidos();

  const result = await abrirEnDespensa(auth.value, {
    itemId: id.data,
    usuarioId: auth.value.userId,
    ...(body.data.abiertoEl === undefined ? {} : { abiertoEl: body.data.abiertoEl }),
    ...(body.data.lineaNuevaId === undefined ? {} : { lineaNuevaId: body.data.lineaNuevaId }),
  });
  if (!result.ok) return result;
  revalidar();
  return ok({
    abierta: toLineaDesdeSnapshot(result.value.abierta),
    resto: result.value.resto === null ? null : toLineaDesdeSnapshot(result.value.resto),
  });
}

/** Mover toda la línea o, con cantidad, una parte a otra ubicación. */
export async function moverLineaAction(
  itemId: string,
  input: MoveStockRequest,
): Promise<Result<MoveStockResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(itemId);
  const body = moveStockRequestSchema.safeParse(input);
  if (!id.success || !body.success) return datosNoValidos();

  const result = await pantryModule(auth.value).moveStock.execute({
    itemId: id.data,
    ubicacionId: body.data.ubicacionId,
    usuarioId: auth.value.userId,
    ...(body.data.cantidad === undefined ? {} : { cantidad: body.data.cantidad }),
    ...(body.data.lineaNuevaId === undefined ? {} : { lineaNuevaId: body.data.lineaNuevaId }),
  });
  if (!result.ok) return result;
  revalidar();
  return ok({
    movida: toLineaDesdeSnapshot(result.value.movida),
    resto: result.value.resto === null ? null : toLineaDesdeSnapshot(result.value.resto),
  });
}

export async function quitarLineaAction(itemId: string): Promise<Result<void>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(itemId);
  if (!id.success) return datosNoValidos();

  const result = await pantryModule(auth.value).removeStock.execute({
    itemId: id.data,
    usuarioId: auth.value.userId,
  });
  if (!result.ok) return result;
  revalidar();
  return ok(undefined);
}

/** "Guardar en la despensa" al terminar la compra (D6). */
export async function guardarCompraAction(
  input: StoreShoppingRequest,
): Promise<Result<StoreShoppingResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const body = storeShoppingRequestSchema.safeParse(input);
  if (!body.success) return datosNoValidos();

  const result = await guardarCompra(auth.value, {
    listaId: body.data.listaId,
    usuarioId: auth.value.userId,
    productos: body.data.productos.map((p) => ({
      ...p,
      productoBaseId: p.productoBaseId ?? null,
      caducaEl: p.caducaEl ?? null,
    })),
  });
  if (!result.ok) return result;
  revalidar();
  return ok({ guardados: result.value.guardados, repetidos: result.value.repetidos });
}

/** Lo que necesita la hoja "Guardar en la despensa": ubicaciones y el día de hoy. */
export async function ubicacionesAction(): Promise<
  Result<{ hoy: string; ubicaciones: UbicacionResponse[]; recordadas: UbicacionesRecordadas }>
> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const [result, recordadas] = await Promise.all([
    pantryModule(auth.value).getPantry.execute(),
    ubicacionesRecordadas(auth.value),
  ]);
  if (!result.ok) return result;
  return ok({
    hoy: result.value.hoy,
    ubicaciones: result.value.ubicaciones.map(toUbicacionResponse),
    recordadas,
  });
}

const anadirALaListaSchema = z.object({
  listaId: z.uuid().optional(),
  nombre: z.string().trim().min(1).max(80),
  productoBaseId: z.uuid().nullable(),
  categoria: categoriaSchema,
  unidad: unidadSchema,
  /** Lo elegido en el diálogo (en unidades si es por packs); sin ella, 1 en su unidad. */
  cantidad: z.object({ valor: z.number().positive(), unidad: unidadSchema }).optional(),
  unidadesPorPack: z.number().int().min(2).max(100).nullish(),
});

/**
 * D8: lo que se acaba vuelve a la lista. Sin lista, va a la activa modificada más
 * recientemente. Si ya estaba, no se duplica: se devuelve `yaEstaba` para avisar.
 */
export async function anadirALaListaAction(
  input: z.input<typeof anadirALaListaSchema>,
): Promise<Result<{ listaId: string; listaNombre: string; yaEstaba: boolean }>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const body = anadirALaListaSchema.safeParse(input);
  if (!body.success) return datosNoValidos();

  const activas = await shoppingModule(auth.value).listLists.execute({ estado: "activas" });
  if (!activas.ok) return activas;
  const lista = body.data.listaId
    ? activas.value.items.find((l) => l.id === body.data.listaId)
    : activas.value.items.at(0);
  if (lista === undefined) {
    return err(notFoundError("SIN_LISTA_ACTIVA", "No tienes ninguna lista activa"));
  }

  const result = await anadirProducto(auth.value, {
    listId: lista.id,
    nombre: body.data.nombre,
    productoBaseId: body.data.productoBaseId,
    categoria: body.data.categoria,
    cantidad: body.data.cantidad ?? { valor: 1, unidad: body.data.unidad },
    unidadesPorPack: body.data.unidadesPorPack ?? null,
  });
  if (!result.ok && result.error.code !== "POSIBLE_DUPLICADO") return result;

  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  revalidatePath("/listas");
  return ok({ listaId: lista.id, listaNombre: lista.nombre, yaEstaba: !result.ok });
}

// ─── Ubicaciones ────────────────────────────────────────────────────────────

const tipoSchema = z.enum(["frio", "congelado", "ambiente"]);

export async function crearUbicacionAction(input: {
  nombre: string;
  tipo: string;
}): Promise<Result<UbicacionResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const body = z.object({ nombre: z.string().max(60), tipo: tipoSchema }).safeParse(input);
  if (!body.success) return datosNoValidos();

  const result = await pantryModule(auth.value).createUbicacion.execute(body.data);
  if (!result.ok) return result;
  revalidar();
  revalidatePath("/despensa/ubicaciones");
  return ok(toUbicacionResponse(result.value));
}

export async function actualizarUbicacionAction(
  id: string,
  input: { nombre?: string; tipo?: string; posicion?: number },
): Promise<Result<UbicacionResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const ubicacionId = idSchema.safeParse(id);
  const body = z
    .object({
      nombre: z.string().max(60).optional(),
      tipo: tipoSchema.optional(),
      posicion: z.number().int().min(1).optional(),
    })
    .safeParse(input);
  if (!ubicacionId.success || !body.success) return datosNoValidos();

  const result = await pantryModule(auth.value).updateUbicacion.execute({
    id: ubicacionId.data,
    ...(body.data.nombre === undefined ? {} : { nombre: body.data.nombre }),
    ...(body.data.tipo === undefined ? {} : { tipo: body.data.tipo }),
    ...(body.data.posicion === undefined ? {} : { posicion: body.data.posicion }),
  });
  if (!result.ok) return result;
  revalidar();
  revalidatePath("/despensa/ubicaciones");
  return ok(toUbicacionResponse(result.value));
}

export async function borrarUbicacionAction(id: string, destinoId?: string): Promise<Result<void>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const ubicacionId = idSchema.safeParse(id);
  const destino = idSchema.optional().safeParse(destinoId);
  if (!ubicacionId.success || !destino.success) return datosNoValidos();

  const result = await pantryModule(auth.value).deleteUbicacion.execute({
    id: ubicacionId.data,
    usuarioId: auth.value.userId,
    ...(destino.data === undefined ? {} : { destinoId: destino.data }),
  });
  if (!result.ok) return result;
  revalidar();
  revalidatePath("/despensa/ubicaciones");
  return ok(undefined);
}
