import {
  type InventoryItemSnapshot,
  nombreDeProducto,
} from "@/domains/pantry/domain/inventory-item";
import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import { Cantidad } from "@/shared/kernel/cantidad";
import { esCategoria } from "@/shared/kernel/categoria";
import type { Clock } from "@/shared/kernel/clock";
import { Dia } from "@/shared/kernel/dia";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import { Despensa } from "../despensa";
import type { PantryRepository } from "../ports/pantry-repository";

export interface UpdateStockInput {
  readonly itemId: string;
  readonly ubicacionId?: string;
  /** null quita la fecha. */
  readonly caducaEl?: string | null;
  readonly categoria?: string;
  /** Corrección del total (ajuste). */
  readonly cantidad?: { readonly valor: number; readonly unidad: string };
  /** Solo en una línea abierta: otro día de apertura, o null para cerrarla. */
  readonly abiertoEl?: string | null;
  /** Renombrar (corregir el nombre o vincularlo a otro producto de la lista base). */
  readonly producto?: { readonly nombre: string; readonly productoBaseId: string | null };
  readonly usuarioId: string;
}

/**
 * PATCH de una línea: mover, poner o quitar la caducidad, cambiar la categoría o
 * corregir la cantidad. Todo o nada. Si al moverla o cambiar la fecha coincide con otra
 * línea, se juntan y se devuelve la que queda.
 */
export class UpdateStockCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateStockInput): Promise<Result<InventoryItemSnapshot>> {
    if (
      input.ubicacionId === undefined &&
      input.caducaEl === undefined &&
      input.categoria === undefined &&
      input.cantidad === undefined &&
      input.abiertoEl === undefined &&
      input.producto === undefined
    ) {
      return err(PantryErrors.sinCambios());
    }
    if (input.categoria !== undefined && !esCategoria(input.categoria)) {
      return err(PantryErrors.categoriaNoValida());
    }
    if (input.producto !== undefined) {
      const nombre = nombreDeProducto(input.producto.nombre);
      if (!nombre.ok) return nombre;
    }
    let caducaEl: Dia | null | undefined;
    if (input.caducaEl !== undefined) {
      if (input.caducaEl === null) caducaEl = null;
      else {
        const d = Dia.create(input.caducaEl);
        if (!d.ok) return d;
        caducaEl = d.value;
      }
    }
    let abiertoEl: Dia | null | undefined;
    if (input.abiertoEl !== undefined) {
      if (input.abiertoEl === null) abiertoEl = null;
      else {
        const d = Dia.create(input.abiertoEl);
        if (!d.ok) return d;
        abiertoEl = d.value;
      }
    }
    let cantidad: Cantidad | undefined;
    if (input.cantidad !== undefined) {
      const c = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);
      if (!c.ok) return c;
      cantidad = c.value;
    }

    const [lineas, ubicaciones] = await Promise.all([
      this.despensa.listarLineas(),
      this.despensa.listarUbicaciones(),
    ]);
    const linea = lineas.find((l) => l.id === input.itemId);
    if (linea === undefined) return err(PantryErrors.lineaNoEncontrada());
    if (input.ubicacionId !== undefined && !ubicaciones.some((u) => u.id === input.ubicacionId)) {
      return err(PantryErrors.ubicacionNoEncontrada());
    }

    const ahora = this.clock.now();
    const despensa = new Despensa(
      lineas,
      ubicaciones.map((u) => u.toSnapshot()),
    );
    if (input.categoria !== undefined && esCategoria(input.categoria)) {
      linea.cambiarCategoria(input.categoria, ahora);
    }
    if (input.producto !== undefined) {
      // Ya validado arriba: no falla.
      linea.renombrar(input.producto.nombre, input.producto.productoBaseId, ahora);
    }
    if (caducaEl !== undefined) linea.cambiarCaducidad(caducaEl, ahora);
    if (abiertoEl !== undefined) {
      const apertura = linea.cambiarApertura(abiertoEl, ahora);
      if (!apertura.ok) return apertura;
    }
    if (input.ubicacionId !== undefined) {
      linea.mover(input.ubicacionId, ahora);
      despensa.recordarUbicacion(linea.nombre, input.ubicacionId);
    }
    despensa.registrar(
      linea,
      cantidad === undefined
        ? undefined
        : linea.ajustar(cantidad, { id: newId(), usuarioId: input.usuarioId }, ahora),
    );

    const queda = despensa.juntarSiCoincide(linea, input.usuarioId, ahora);
    if (!queda.ok) return queda;

    await this.despensa.guardar({
      lineas: despensa.lineasCambiadas(),
      movimientos: despensa.movimientos,
      recordar: despensa.ubicacionesARecordar(),
    });
    return ok(queda.value.toSnapshot());
  }
}
