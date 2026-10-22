import type { Categoria } from "@/shared/kernel/categoria";
import { type Cantidad, sonConvertibles, sumarCantidades } from "@/shared/kernel/cantidad";
import { err, ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import type { Unidad } from "@/shared/kernel/unidad";
import { type DetalleDuplicado, ShoppingErrors } from "./shopping-errors";
import { type NewShoppingItem, ShoppingItem, type ShoppingItemSnapshot } from "./shopping-item";

export interface ShoppingListSnapshot {
  readonly id: string;
  readonly nombre: string;
  readonly archivadaAt: Date | null;
  /** La lista general del hogar: reúne sus productos y los de todas las activas. */
  readonly general: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

/** Cambios parciales de un ítem. Los campos ausentes no se tocan. */
export interface CambiosItem {
  readonly cantidad?: Cantidad;
  readonly comprado?: boolean;
  readonly categoria?: Categoria;
}

/**
 * Qué hacer con los ítems pendientes al terminar la compra: `vaciar` los quita
 * también; `conservarPendientes` los deja en la lista para la próxima vez.
 */
export type ModoTerminarCompra = "vaciar" | "conservarPendientes";

/** Qué hacer si el producto que se añade parece uno que ya está en la lista. */
export interface OpcionesDuplicado {
  /** Sin decisión, un producto parecido devuelve POSIBLE_DUPLICADO para que el usuario elija. */
  readonly duplicado?: "unir" | "separar";
  /** Al unir con unidades distintas: en qué unidad se cuenta. */
  readonly unidadFinal?: Unidad;
  /** Al unir: cantidad final escrita por el usuario (obligatoria si las unidades no se pueden convertir). */
  readonly cantidadFinal?: Cantidad;
}

export const MAX_ITEMS_POR_LISTA = 200;
export const MAX_NOMBRE_LISTA = 80;
/** Listas activas por hogar. Las archivadas no cuentan. */
export const MAX_LISTAS_ACTIVAS = 15;
/** Días que una lista archivada se conserva antes de borrarse. */
export const DIAS_EN_ARCHIVADAS = 15;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Fecha de archivado a partir de la cual una lista archivada ya está caducada. */
export function limiteDeCaducidad(ahora: Date): Date {
  return new Date(ahora.getTime() - DIAS_EN_ARCHIVADAS * MS_POR_DIA);
}

export interface NewShoppingList {
  readonly id: string;
  readonly nombre: string;
  readonly general?: boolean;
}

function validarNombre(nombre: string): Result<string> {
  const limpio = nombre.trim();
  if (limpio.length === 0 || limpio.length > MAX_NOMBRE_LISTA) {
    return err(ShoppingErrors.nombreNoValido(MAX_NOMBRE_LISTA));
  }
  return ok(limpio);
}

export class ShoppingList {
  private readonly modificados = new Set<string>();

  private constructor(
    private state: ShoppingListSnapshot,
    private readonly items: Map<string, ShoppingItem>,
  ) {}

  /** Lista nueva y vacía. El nombre se recorta y debe tener entre 1 y 80 caracteres. */
  static create(input: NewShoppingList, ahora: Date): Result<ShoppingList> {
    const nombre = validarNombre(input.nombre);
    if (!nombre.ok) return nombre;
    return ok(
      new ShoppingList(
        {
          id: input.id,
          nombre: nombre.value,
          archivadaAt: null,
          general: input.general ?? false,
          createdAt: ahora,
          updatedAt: ahora,
          deletedAt: null,
        },
        new Map(),
      ),
    );
  }

  static rehydrate(snapshot: ShoppingListSnapshot, items: readonly ShoppingItem[]): ShoppingList {
    return new ShoppingList(snapshot, new Map(items.map((item) => [item.id, item])));
  }

  get id(): string {
    return this.state.id;
  }

  get nombre(): string {
    return this.state.nombre;
  }

  get esGeneral(): boolean {
    return this.state.general;
  }

  get estaArchivada(): boolean {
    return this.state.archivadaAt !== null;
  }

  /** Cuándo se borrará si está archivada: 15 días después de archivarla. */
  caducaEl(): Date | null {
    const archivadaAt = this.state.archivadaAt;
    return archivadaAt === null
      ? null
      : new Date(archivadaAt.getTime() + DIAS_EN_ARCHIVADAS * MS_POR_DIA);
  }

  estaCaducada(ahora: Date): boolean {
    const caduca = this.caducaEl();
    return caduca !== null && caduca.getTime() <= ahora.getTime();
  }

  itemsActivos(): ShoppingItem[] {
    return [...this.items.values()].filter((item) => !item.estaQuitado);
  }

  /** Se puede renombrar también estando archivada. */
  renombrar(nombre: string, ahora: Date): Result<void> {
    const limpio = validarNombre(nombre);
    if (!limpio.ok) return limpio;
    this.state = { ...this.state, nombre: limpio.value, updatedAt: ahora };
    return ok(undefined);
  }

  /** Archivar empieza la cuenta de 15 días (desarchivar y volver a archivar la reinicia). */
  archivar(ahora: Date): void {
    if (this.estaArchivada) return;
    this.state = { ...this.state, archivadaAt: ahora, updatedAt: ahora };
  }

  desarchivar(ahora: Date): void {
    if (!this.estaArchivada) return;
    this.state = { ...this.state, archivadaAt: null, updatedAt: ahora };
  }

  /** Borrado lógico (deletedAt): viaja como tombstone en la sincronización. */
  eliminar(ahora: Date): void {
    this.state = { ...this.state, deletedAt: ahora, updatedAt: ahora };
  }

  /**
   * Añade un producto. Si ya hay uno parecido (mismo producto base o mismo nombre
   * normalizado), no decide por el usuario: devuelve POSIBLE_DUPLICADO hasta que
   * llegue `duplicado: "unir" | "separar"`.
   */
  agregarItem(
    input: NewShoppingItem,
    ahora: Date,
    opciones: OpcionesDuplicado = {},
  ): Result<ShoppingItem> {
    if (this.estaArchivada) return err(ShoppingErrors.listaArchivada());
    // Antes que los duplicados: reintentar el mismo alta (mismo id) no es un parecido.
    if (this.items.has(input.id)) return err(ShoppingErrors.itemYaExiste());

    const parecido = this.buscarParecido(input);
    if (parecido !== undefined && opciones.duplicado === undefined) {
      return err(ShoppingErrors.posibleDuplicado(detalleDe(parecido)));
    }
    if (parecido !== undefined && opciones.duplicado === "unir") {
      return this.unir(parecido, input.cantidad, opciones, ahora);
    }

    if (this.itemsActivos().length >= MAX_ITEMS_POR_LISTA) {
      return err(ShoppingErrors.listaLlena(MAX_ITEMS_POR_LISTA));
    }
    const item = ShoppingItem.create(input, ahora);

    if (!item.ok) return item;
    this.items.set(item.value.id, item.value);
    this.registrarCambio(item.value.id, ahora);
    return item;
  }

  /**
   * Aplica varios cambios a un ítem como una sola operación: se valida una vez
   * (lista no archivada, ítem existente) y se aplican todos o ninguno.
   */
  actualizarItem(
    itemId: string,
    cambios: CambiosItem,
    usuarioId: string,
    ahora: Date,
  ): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => {
      if (cambios.cantidad !== undefined) item.cambiarCantidad(cambios.cantidad, ahora);
      if (cambios.comprado === true) item.marcarComprado(usuarioId, ahora);
      if (cambios.comprado === false) item.desmarcarComprado(ahora);
      if (cambios.categoria !== undefined) item.cambiarCategoria(cambios.categoria, ahora);
    });
  }

  quitarItem(itemId: string, ahora: Date): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => item.quitar(ahora));
  }

  /** Cierra la compra: quita los ítems comprados y, según el modo, también los pendientes. */
  terminarCompra(modo: ModoTerminarCompra, ahora: Date): Result<void> {
    if (this.estaArchivada) return err(ShoppingErrors.listaArchivada());

    for (const item of this.itemsActivos()) {
      if (modo === "vaciar" || item.estaComprado) {
        item.quitar(ahora);
        this.registrarCambio(item.id, ahora);
      }
    }
    return ok(undefined);
  }

  toSnapshot(): ShoppingListSnapshot {
    return this.state;
  }

  /** Ítems creados o cambiados desde que se cargó la lista: los que hay que guardar. */
  itemsModificados(): ShoppingItemSnapshot[] {
    return [...this.modificados]
      .map((id) => this.items.get(id))
      .filter((item): item is ShoppingItem => item !== undefined)
      .map((item) => item.toSnapshot());
  }

  /** Pendiente antes que comprado: si hay los dos, se une con lo que aún falta por comprar. */
  private buscarParecido(input: NewShoppingItem): ShoppingItem | undefined {
    const nombre = normalizarNombre(input.nombre);
    const parecidos = this.itemsActivos().filter(
      (item) =>
        (input.productoBaseId != null && item.productoBaseId === input.productoBaseId) ||
        normalizarNombre(item.nombre) === nombre,
    );
    return parecidos.find((item) => !item.estaComprado) ?? parecidos.at(0);
  }

  /**
   * Une la cantidad nueva con un producto existente. Si estaba en el carro, lo comprado
   * no se vuelve a comprar: la línea vuelve a "por comprar" solo con la cantidad nueva.
   */
  private unir(
    existente: ShoppingItem,
    nueva: Cantidad,
    opciones: OpcionesDuplicado,
    ahora: Date,
  ): Result<ShoppingItem> {
    const sumandos = existente.estaComprado ? [nueva] : [existente.cantidad, nueva];
    const unidades = new Set(sumandos.map((c) => c.unidad));
    const unidadFinal =
      opciones.unidadFinal ??
      opciones.cantidadFinal?.unidad ??
      (unidades.size === 1 ? nueva.unidad : undefined);
    if (unidadFinal === undefined) {
      return err(ShoppingErrors.unidadesDistintas(detalleDe(existente)));
    }

    let total: Cantidad | null = null;
    if (opciones.cantidadFinal !== undefined) {
      total = opciones.cantidadFinal;
    } else if (sumandos.every((c) => sonConvertibles(c.unidad, unidadFinal))) {
      total = sumarCantidades(sumandos, unidadFinal);
      if (total === null) return err(ShoppingErrors.cantidadNoValida());
    }
    if (total === null || total.unidad !== unidadFinal) {
      return err(ShoppingErrors.unidadesDistintas(detalleDe(existente)));
    }

    const cantidadFinal = total;
    return this.modificarItem(existente.id, ahora, (item) => {
      item.cambiarCantidad(cantidadFinal, ahora);
      item.desmarcarComprado(ahora);
    });
  }

  private modificarItem(
    itemId: string,
    ahora: Date,
    cambio: (item: ShoppingItem) => void,
  ): Result<ShoppingItem> {
    if (this.estaArchivada) return err(ShoppingErrors.listaArchivada());

    const item = this.items.get(itemId);

    if (item === undefined || item.estaQuitado) return err(ShoppingErrors.itemNoEncontrado());

    cambio(item);

    this.registrarCambio(itemId, ahora);

    return ok(item);
  }

  private registrarCambio(itemId: string, ahora: Date): void {
    this.modificados.add(itemId);
    this.state = { ...this.state, updatedAt: ahora };
  }
}

function detalleDe(item: ShoppingItem): DetalleDuplicado {
  return {
    itemId: item.id,
    nombre: item.nombre,
    cantidad: { valor: item.cantidad.valor, unidad: item.cantidad.unidad },
    comprado: item.estaComprado,
  };
}
