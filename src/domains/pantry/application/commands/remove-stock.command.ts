import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { PantryRepository } from "../ports/pantry-repository";

/** Quitar una línea añadida por error: movimiento de baja con lo que había. */
export class RemoveStockCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    readonly itemId: string;
    readonly usuarioId: string;
  }): Promise<Result<void>> {
    const linea = await this.despensa.findLinea(input.itemId);
    if (linea === null) return err(PantryErrors.lineaNoEncontrada());

    const movimiento = linea.darDeBaja(
      { id: newId(), usuarioId: input.usuarioId },
      this.clock.now(),
    );
    await this.despensa.guardar({ lineas: [linea], movimientos: [movimiento] });
    return ok(undefined);
  }
}
