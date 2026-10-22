import { esCategoria } from "@/shared/kernel/categoria";
import type { Clock } from "@/shared/kernel/clock";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import { esUnidad } from "@/shared/kernel/unidad";
import type { ProductoRecordadoRepository } from "../ports/producto-recordado-repository";

/** Como el nombre de un ítem de lista. */
export const MAX_NOMBRE_RECORDADO = 80;

export interface EstandarizarProductoInput {
  /** Nombre normalizado del producto del hogar que se edita. */
  readonly desde: string;
  readonly nombre: string;
  /** Si se une a un producto de la lista base: entonces deja de recordarse como texto libre. */
  readonly productoBaseId: string | null;
  readonly categoria: string;
  readonly unidad: string;
}

/**
 * «Mis productos»: renombrar, cambiar categoría o unidad, o unir con otro. Si el nombre
 * nuevo ya existía, se juntan (se suman los usos). Si se une a la lista base, el
 * recuerdo de texto libre se olvida: el autocompletado ya ofrece el de la lista base.
 */
export class EstandarizarProductoCommand {
  constructor(
    private readonly recordados: ProductoRecordadoRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: EstandarizarProductoInput): Promise<Result<void>> {
    const nombre = input.nombre.trim().replace(/\s+/g, " ");
    const hacia = normalizarNombre(nombre);
    if (hacia === "" || nombre.length > MAX_NOMBRE_RECORDADO) {
      return err(
        validationError(
          "NOMBRE_NO_VALIDO",
          `El nombre debe tener entre 1 y ${MAX_NOMBRE_RECORDADO} caracteres`,
        ),
      );
    }
    if (!esCategoria(input.categoria)) {
      return err(validationError("CATEGORIA_NO_VALIDA", "Esa categoría no existe"));
    }
    if (!esUnidad(input.unidad)) {
      return err(validationError("UNIDAD_NO_VALIDA", `Unidad desconocida: ${input.unidad}`));
    }

    const actual = await this.recordados.buscar(input.desde);
    if (input.productoBaseId !== null) {
      if (actual !== null && input.desde !== hacia) await this.recordados.borrar(input.desde);
      return ok(undefined);
    }

    const otro = input.desde === hacia ? null : await this.recordados.buscar(hacia);
    await this.recordados.guardar({
      nombreNormalizado: hacia,
      nombre,
      categoria: input.categoria,
      unidad: input.unidad,
      usos: Math.max(1, (actual?.usos ?? 0) + (otro?.usos ?? 0)),
      ultimoUso: this.clock.now(),
    });
    if (actual !== null && input.desde !== hacia) await this.recordados.borrar(input.desde);
    return ok(undefined);
  }
}

/** «Olvidar»: deja de sugerirse en el autocompletado. No toca listas ni despensa. */
export class OlvidarProductoCommand {
  constructor(private readonly recordados: ProductoRecordadoRepository) {}

  async execute(nombreNormalizado: string): Promise<Result<void>> {
    await this.recordados.borrar(nombreNormalizado);
    return ok(undefined);
  }
}
