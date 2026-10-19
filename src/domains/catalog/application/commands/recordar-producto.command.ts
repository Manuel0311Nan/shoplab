import { esCategoria } from "@/shared/kernel/categoria";
import type { Clock } from "@/shared/kernel/clock";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import { esUnidad } from "@/shared/kernel/unidad";
import type { ProductoRecordadoRepository } from "../ports/producto-recordado-repository";

export interface RecordarProductoInput {
  readonly nombre: string;
  readonly categoria: string;
  readonly unidad: string;
  /**
   * "uso": se acaba de añadir texto libre (suma un uso; la categoría solo cuenta si es
   * nuevo). "categoria": el usuario corrigió la categoría (manda la nueva).
   */
  readonly motivo: "uso" | "categoria";
}

/** Actualiza la memoria del hogar. Nunca duplica: la clave es el nombre normalizado. */
export class RecordarProductoCommand {
  constructor(
    private readonly recordados: ProductoRecordadoRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RecordarProductoInput): Promise<Result<void>> {
    const nombre = input.nombre.trim();
    const nombreNormalizado = normalizarNombre(nombre);
    if (nombreNormalizado === "") {
      return err(validationError("NOMBRE_NO_VALIDO", "El nombre no puede estar vacío"));
    }
    if (!esCategoria(input.categoria)) {
      return err(validationError("CATEGORIA_NO_VALIDA", "Esa categoría no existe"));
    }
    if (!esUnidad(input.unidad)) {
      return err(validationError("UNIDAD_NO_VALIDA", `Unidad desconocida: ${input.unidad}`));
    }

    const ahora = this.clock.now();
    const actual = await this.recordados.buscar(nombreNormalizado);

    if (actual === null) {
      await this.recordados.guardar({
        nombreNormalizado,
        nombre,
        categoria: input.categoria,
        unidad: input.unidad,
        usos: 1,
        ultimoUso: ahora,
      });
    } else if (input.motivo === "uso") {
      await this.recordados.guardar({
        ...actual,
        nombre,
        unidad: input.unidad,
        usos: actual.usos + 1,
        ultimoUso: ahora,
      });
    } else {
      await this.recordados.guardar({ ...actual, categoria: input.categoria, ultimoUso: ahora });
    }
    return ok(undefined);
  }
}
