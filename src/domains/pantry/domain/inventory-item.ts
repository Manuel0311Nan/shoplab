import type { AvisoAbierto } from "@/shared/kernel/abierto";
import {
  Cantidad,
  convertirCantidad,
  sonConvertibles,
  sumarCantidades,
} from "@/shared/kernel/cantidad";
import type { Categoria } from "@/shared/kernel/categoria";
import type { Dia } from "@/shared/kernel/dia";
import { err, ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import { PantryErrors } from "./pantry-errors";

export const MAX_NOMBRE_PRODUCTO = 80;
/** D9: líneas vivas por hogar. Se devuelven todas, sin paginar. */
export const MAX_LINEAS_DESPENSA = 500;
/** D8: en g, kg, ml o l, "queda poco" es este porcentaje o menos de lo que entró. */
export const PORCENTAJE_QUEDA_POCO = 0.2;

/**
 * Cada cambio de cantidad de una línea (D7). Se guarda junto a la línea y no se edita
 * ni se borra: es el historial que permitirá sincronizar por operaciones y saber
 * cuánto se tira.
 * - entrada: se añade (a mano o desde la compra);
 * - consumo y desecho: se gasta o se tira esa cantidad;
 * - ajuste: corrección a mano, la cantidad es el nuevo total;
 * - baja: la línea se quita por error, la cantidad es lo que había.
 */
export type TipoMovimiento = "entrada" | "consumo" | "desecho" | "ajuste" | "baja";
export type OrigenMovimiento = "manual" | "compra";

export interface MovimientoSnapshot {
  readonly id: string;
  readonly inventoryItemId: string;
  readonly tipo: TipoMovimiento;
  readonly cantidad: Cantidad;
  readonly origen: OrigenMovimiento;
  readonly listaId: string | null;
  readonly usuarioId: string | null;
  readonly createdAt: Date;
}

/** Quién y desde dónde: lo que acompaña a cada movimiento. */
export interface ContextoMovimiento {
  /** Id del movimiento: generable en el cliente para que un reintento no se repita. */
  readonly id: string;
  readonly usuarioId: string;
  readonly origen?: OrigenMovimiento;
  readonly listaId?: string | null;
}

export interface InventoryItemSnapshot {
  readonly id: string;
  readonly nombre: string;
  readonly nombreNormalizado: string;
  readonly productoBaseId: string | null;
  readonly categoria: Categoria;
  readonly ubicacionId: string;
  readonly cantidad: Cantidad;
  /** La cantidad tras la última entrada o ajuste: la base de "queda poco" (D8). */
  readonly cantidadReferencia: Cantidad;
  readonly caducaEl: Dia | null;
  /** Día en que se abrió el paquete; null si está cerrado. Avisa, no caduca. */
  readonly abiertoEl: Dia | null;
  /** Días abierto hasta amarillo y hasta rojo: se fijan al abrirlo. */
  readonly avisoAbierto: AvisoAbierto | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface NewInventoryItem {
  readonly id: string;
  readonly nombre: string;
  readonly productoBaseId?: string | null;
  readonly categoria: Categoria;
  readonly ubicacionId: string;
  readonly cantidad: Cantidad;
  readonly caducaEl?: Dia | null;
}

/**
 * Lo que identifica una línea: el mismo producto, en la misma ubicación, con la misma
 * fecha y abierto el mismo día (o cerrado). Lo que entra de la compra está cerrado: nunca
 * se suma a un paquete abierto.
 */
export interface ClaveLinea {
  readonly productoBaseId: string | null;
  readonly nombreNormalizado: string;
  readonly ubicacionId: string;
  readonly caducaEl: Dia | null;
  readonly abiertoEl?: Dia | null;
  readonly unidad: Cantidad["unidad"];
}

/** Mismo producto: mismo vínculo con la lista base o, sin vínculo, mismo nombre normalizado. */
export function mismoProducto(
  a: Pick<ClaveLinea, "productoBaseId" | "nombreNormalizado">,
  b: Pick<ClaveLinea, "productoBaseId" | "nombreNormalizado">,
): boolean {
  if (a.productoBaseId !== null && b.productoBaseId !== null) {
    return a.productoBaseId === b.productoBaseId;
  }
  return a.nombreNormalizado === b.nombreNormalizado;
}

/**
 * Una línea de la despensa: un producto en una ubicación con (o sin) una caducidad.
 * Sin fechas, cada producto es una sola línea por ubicación que va sumando (D2).
 */
export class InventoryItem {
  private constructor(private state: InventoryItemSnapshot) {}

  static create(
    input: NewInventoryItem,
    contexto: ContextoMovimiento,
    ahora: Date,
  ): Result<{ item: InventoryItem; movimiento: MovimientoSnapshot }> {
    const nombre = input.nombre.trim().replace(/\s+/g, " ");
    if (nombre.length === 0 || nombre.length > MAX_NOMBRE_PRODUCTO) {
      return err(PantryErrors.nombreNoValido(MAX_NOMBRE_PRODUCTO));
    }
    const item = new InventoryItem({
      id: input.id,
      nombre,
      nombreNormalizado: normalizarNombre(nombre),
      productoBaseId: input.productoBaseId ?? null,
      categoria: input.categoria,
      ubicacionId: input.ubicacionId,
      cantidad: input.cantidad,
      cantidadReferencia: input.cantidad,
      caducaEl: input.caducaEl ?? null,
      abiertoEl: null,
      avisoAbierto: null,
      createdAt: ahora,
      updatedAt: ahora,
      deletedAt: null,
    });
    return ok({ item, movimiento: item.movimiento("entrada", input.cantidad, contexto, ahora) });
  }

  static rehydrate(snapshot: InventoryItemSnapshot): InventoryItem {
    return new InventoryItem(snapshot);
  }

  get id(): string {
    return this.state.id;
  }
  get cantidad(): Cantidad {
    return this.state.cantidad;
  }
  get ubicacionId(): string {
    return this.state.ubicacionId;
  }
  get estaAbierta(): boolean {
    return this.state.abiertoEl !== null;
  }
  get estaDeBaja(): boolean {
    return this.state.deletedAt !== null;
  }

  clave(): ClaveLinea {
    return {
      productoBaseId: this.state.productoBaseId,
      nombreNormalizado: this.state.nombreNormalizado,
      ubicacionId: this.state.ubicacionId,
      caducaEl: this.state.caducaEl,
      abiertoEl: this.state.abiertoEl,
      unidad: this.state.cantidad.unidad,
    };
  }

  /** Mismo producto, ubicación, caducidad y apertura (o ninguna), y unidades convertibles. */
  esMismaLinea(otra: ClaveLinea): boolean {
    const propia = this.clave();
    return (
      !this.estaDeBaja &&
      mismoProducto(propia, otra) &&
      propia.ubicacionId === otra.ubicacionId &&
      propia.caducaEl === otra.caducaEl &&
      propia.abiertoEl === (otra.abiertoEl ?? null) &&
      sonConvertibles(propia.unidad, otra.unidad)
    );
  }

  esMismoProducto(otra: Pick<ClaveLinea, "productoBaseId" | "nombreNormalizado">): boolean {
    return mismoProducto(this.clave(), otra);
  }

  /** Entrada en esta línea (g↔kg y ml↔l se convierten a la unidad de la línea). */
  sumar(cantidad: Cantidad, contexto: ContextoMovimiento, ahora: Date): Result<MovimientoSnapshot> {
    const total = sumarCantidades([this.state.cantidad, cantidad], this.state.cantidad.unidad);
    if (total === null) return err(PantryErrors.cantidadIncompatible());
    this.state = { ...this.state, cantidad: total, cantidadReferencia: total, updatedAt: ahora };
    const enSuUnidad = convertirCantidad(cantidad, this.state.cantidad.unidad) ?? cantidad;
    return ok(this.movimiento("entrada", enSuUnidad, contexto, ahora));
  }

  /**
   * Gastar o tirar una parte o, sin cantidad, todo. Si no queda nada, la línea se da
   * por terminada (deletedAt) y viaja como tombstone.
   */
  consumir(
    cantidad: Cantidad | undefined,
    motivo: "gastado" | "tirado",
    contexto: ContextoMovimiento,
    ahora: Date,
  ): Result<{ movimiento: MovimientoSnapshot; agotada: boolean }> {
    const actual = this.state.cantidad;
    const gastada = cantidad === undefined ? actual : convertirCantidad(cantidad, actual.unidad);
    if (gastada === null) return err(PantryErrors.cantidadIncompatible());
    // Redondeo a 3 decimales, como el VO, para que 0,1 + 0,2 no falle por un pelo.
    const resto = Math.round((actual.valor - gastada.valor) * 1000) / 1000;
    if (resto < 0) return err(PantryErrors.cantidadInsuficiente(actual));

    const tipo = motivo === "gastado" ? "consumo" : "desecho";
    if (resto === 0) {
      this.state = { ...this.state, deletedAt: ahora, updatedAt: ahora };
    } else {
      const nueva = Cantidad.create(resto, actual.unidad);
      if (!nueva.ok) return nueva;
      this.state = { ...this.state, cantidad: nueva.value, updatedAt: ahora };
    }
    return ok({
      movimiento: this.movimiento(tipo, gastada, contexto, ahora),
      agotada: resto === 0,
    });
  }

  /** Corrección a mano: "eran 3, no 4". Puede cambiar de unidad. */
  ajustar(cantidad: Cantidad, contexto: ContextoMovimiento, ahora: Date): MovimientoSnapshot {
    this.state = { ...this.state, cantidad, cantidadReferencia: cantidad, updatedAt: ahora };
    return this.movimiento("ajuste", cantidad, contexto, ahora);
  }

  /** Se quita una línea añadida por error (o que se une a otra al moverla). */
  darDeBaja(contexto: ContextoMovimiento, ahora: Date): MovimientoSnapshot {
    this.state = { ...this.state, deletedAt: ahora, updatedAt: ahora };
    return this.movimiento("baja", this.state.cantidad, contexto, ahora);
  }

  mover(ubicacionId: string, ahora: Date): void {
    if (ubicacionId === this.state.ubicacionId) return;
    this.state = { ...this.state, ubicacionId, updatedAt: ahora };
  }

  cambiarCaducidad(caducaEl: Dia | null, ahora: Date): void {
    if (caducaEl === this.state.caducaEl) return;
    this.state = { ...this.state, caducaEl, updatedAt: ahora };
  }

  /**
   * El paquete se abre ese día. Con varias unidades se abre solo una: se separa en una
   * línea nueva (abierta) y en esta queda el resto, cerrado; las dos cantidades cambian
   * con un movimiento de ajuste (no es ni compra ni consumo).
   */
  abrir(input: {
    readonly abiertoEl: Dia;
    readonly aviso: AvisoAbierto;
    readonly nuevaLinea: { readonly id: string; readonly movimientoId: string };
    readonly contexto: ContextoMovimiento;
    readonly ahora: Date;
  }): Result<{ abierta: InventoryItem; movimientos: MovimientoSnapshot[] }> {
    if (this.state.abiertoEl !== null) return err(PantryErrors.yaAbierta());
    const { abiertoEl, aviso, ahora } = input;
    const { cantidad } = this.state;

    if (cantidad.unidad !== "unidad" || cantidad.valor <= 1) {
      this.state = { ...this.state, abiertoEl, avisoAbierto: aviso, updatedAt: ahora };
      return ok({ abierta: this, movimientos: [] });
    }

    const resto = Cantidad.create(cantidad.valor - 1, "unidad");
    const una = Cantidad.create(1, "unidad");
    if (!resto.ok) return resto;
    if (!una.ok) return una;
    const movimientoResto = this.ajustar(resto.value, input.contexto, ahora);
    const abierta = new InventoryItem({
      ...this.state,
      id: input.nuevaLinea.id,
      cantidad: una.value,
      cantidadReferencia: una.value,
      abiertoEl,
      avisoAbierto: aviso,
      createdAt: ahora,
      updatedAt: ahora,
    });
    const movimientoAbierta = abierta.movimiento(
      "ajuste",
      una.value,
      { ...input.contexto, id: input.nuevaLinea.movimientoId },
      ahora,
    );
    return ok({ abierta, movimientos: [movimientoResto, movimientoAbierta] });
  }

  /** Corregir el día en que se abrió, o null para marcarla como cerrada (se abrió por error). */
  cambiarApertura(abiertoEl: Dia | null, ahora: Date): Result<void> {
    if (abiertoEl === this.state.abiertoEl) return ok(undefined);
    if (abiertoEl === null) {
      this.state = { ...this.state, abiertoEl: null, avisoAbierto: null, updatedAt: ahora };
      return ok(undefined);
    }
    // Poner una fecha a una línea cerrada es abrirla: va por `abrir`, que fija el aviso.
    if (this.state.abiertoEl === null) return err(PantryErrors.noEstaAbierta());
    this.state = { ...this.state, abiertoEl, updatedAt: ahora };
    return ok(undefined);
  }

  cambiarCategoria(categoria: Categoria, ahora: Date): void {
    if (categoria === this.state.categoria) return;
    this.state = { ...this.state, categoria, updatedAt: ahora };
  }

  /**
   * D8: queda poco cuando, tras gastar, queda 1 ud. o, en g, kg, ml o l, el 20 % o menos
   * de lo que entró por última vez. Algo recién comprado nunca "queda poco", aunque sea
   * 1 ud.: hay que haber gastado parte.
   */
  quedaPoco(): boolean {
    if (this.estaDeBaja) return false;
    const { cantidad, cantidadReferencia } = this.state;
    const referencia = convertirCantidad(cantidadReferencia, cantidad.unidad);
    if (referencia === null || cantidad.valor >= referencia.valor) return false;
    if (cantidad.unidad === "unidad") return cantidad.valor <= 1;
    return cantidad.valor <= referencia.valor * PORCENTAJE_QUEDA_POCO;
  }

  toSnapshot(): InventoryItemSnapshot {
    return this.state;
  }

  private movimiento(
    tipo: TipoMovimiento,
    cantidad: Cantidad,
    contexto: ContextoMovimiento,
    ahora: Date,
  ): MovimientoSnapshot {
    return {
      id: contexto.id,
      inventoryItemId: this.state.id,
      tipo,
      cantidad,
      origen: contexto.origen ?? "manual",
      listaId: contexto.listaId ?? null,
      usuarioId: contexto.usuarioId,
      createdAt: ahora,
    };
  }
}
