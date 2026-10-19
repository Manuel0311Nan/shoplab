import {
  type ContextoMovimiento,
  InventoryItem,
  MAX_LINEAS_DESPENSA,
  type MovimientoSnapshot,
} from "@/domains/pantry/domain/inventory-item";
import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import { type UbicacionSnapshot, ubicacionPropuesta } from "@/domains/pantry/domain/ubicacion";
import { Cantidad } from "@/shared/kernel/cantidad";
import { type Categoria, esCategoria, tipoDeUbicacion } from "@/shared/kernel/categoria";
import { Dia } from "@/shared/kernel/dia";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";

/** Un producto que entra en la despensa, tal como llega de la API o de la compra. */
export interface ProductoEntrante {
  readonly nombre: string;
  readonly productoBaseId?: string | null;
  readonly categoria: string;
  /** Sin ella, se propone por la categoría (D3). */
  readonly ubicacionId?: string;
  readonly cantidad: { readonly valor: number; readonly unidad: string };
  /** AAAA-MM-DD, opcional (D2). */
  readonly caducaEl?: string | null;
}

interface EntradaValidada {
  readonly nombre: string;
  readonly productoBaseId: string | null;
  readonly categoria: Categoria;
  readonly ubicacionId: string;
  readonly cantidad: Cantidad;
  readonly caducaEl: Dia | null;
}

/**
 * La despensa cargada en memoria para dar altas: como mucho 500 líneas (D9), así que
 * se lee una vez y se decide aquí si cada entrada suma en una línea o abre otra.
 */
export class Despensa {
  private readonly cambiadas = new Map<string, InventoryItem>();
  readonly movimientos: MovimientoSnapshot[] = [];

  constructor(
    private readonly lineas: InventoryItem[],
    private readonly ubicaciones: readonly UbicacionSnapshot[],
  ) {}

  validar(producto: ProductoEntrante): Result<EntradaValidada> {
    if (!esCategoria(producto.categoria)) return err(PantryErrors.categoriaNoValida());
    const cantidad = Cantidad.create(producto.cantidad.valor, producto.cantidad.unidad);
    if (!cantidad.ok) return cantidad;

    let caducaEl: Dia | null = null;
    if (producto.caducaEl != null) {
      const dia = Dia.create(producto.caducaEl);
      if (!dia.ok) return dia;
      caducaEl = dia.value;
    }

    const ubicacion = producto.ubicacionId
      ? this.ubicaciones.find((u) => u.id === producto.ubicacionId)
      : ubicacionPropuesta(this.ubicaciones, tipoDeUbicacion(producto.categoria));
    if (ubicacion === undefined) return err(PantryErrors.ubicacionNoEncontrada());

    return ok({
      nombre: producto.nombre,
      productoBaseId: producto.productoBaseId ?? null,
      categoria: producto.categoria,
      ubicacionId: ubicacion.id,
      cantidad: cantidad.value,
      caducaEl,
    });
  }

  /** Suma en la línea igual (D2: mismo producto, ubicación y fecha) o abre una nueva. */
  dar(
    producto: ProductoEntrante,
    contexto: ContextoMovimiento,
    ahora: Date,
  ): Result<InventoryItem> {
    const entrada = this.validar(producto);
    if (!entrada.ok) return entrada;
    const e = entrada.value;

    const igual = this.lineas.find((l) =>
      l.esMismaLinea({
        productoBaseId: e.productoBaseId,
        nombreNormalizado: normalizarNombre(e.nombre),
        ubicacionId: e.ubicacionId,
        caducaEl: e.caducaEl,
        unidad: e.cantidad.unidad,
      }),
    );
    if (igual !== undefined) {
      const movimiento = igual.sumar(e.cantidad, contexto, ahora);
      if (!movimiento.ok) return movimiento;
      this.registrar(igual, movimiento.value);
      return ok(igual);
    }

    if (this.lineas.filter((l) => !l.estaDeBaja).length >= MAX_LINEAS_DESPENSA) {
      return err(PantryErrors.despensaLlena(MAX_LINEAS_DESPENSA));
    }
    const creada = InventoryItem.create({ id: newId(), ...e }, contexto, ahora);
    if (!creada.ok) return creada;
    this.lineas.push(creada.value.item);
    this.registrar(creada.value.item, creada.value.movimiento);
    return ok(creada.value.item);
  }

  /**
   * Tras mover una línea o cambiarle la fecha puede coincidir con otra: entonces se
   * juntan (la otra suma y esta se da de baja). Devuelve la línea que queda.
   */
  juntarSiCoincide(linea: InventoryItem, usuarioId: string, ahora: Date): Result<InventoryItem> {
    const otra = this.lineas.find((l) => l.id !== linea.id && l.esMismaLinea(linea.clave()));
    if (otra === undefined) return ok(linea);

    const entrada = otra.sumar(linea.cantidad, { id: newId(), usuarioId }, ahora);
    if (!entrada.ok) return entrada;
    this.registrar(otra, entrada.value);
    this.registrar(linea, linea.darDeBaja({ id: newId(), usuarioId }, ahora));
    return ok(otra);
  }

  lineasCambiadas(): InventoryItem[] {
    return [...this.cambiadas.values()];
  }

  registrar(linea: InventoryItem, movimiento?: MovimientoSnapshot): void {
    this.cambiadas.set(linea.id, linea);
    if (movimiento !== undefined) this.movimientos.push(movimiento);
  }

  todas(): readonly InventoryItem[] {
    return this.lineas;
  }
}
