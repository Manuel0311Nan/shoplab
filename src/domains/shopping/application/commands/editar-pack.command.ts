import {
  MAX_UNIDADES_POR_PACK,
  MIN_UNIDADES_POR_PACK,
} from "@/domains/shopping/domain/shopping-item";
import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { PackRecordadoRepository } from "../ports/pack-recordado-repository";

export interface EditarPackInput {
  /** Nombre normalizado de antes y de después (iguales si no se renombra). */
  readonly desde: string;
  readonly hacia: string;
  /** undefined: no se toca; null: deja de recordarse; número: ese tamaño. */
  readonly unidadesPorPack?: number | null;
}

/**
 * Desde «Mis productos»: al renombrar o unir, el pack recordado pasa al nombre nuevo
 * (si allí no había ya uno); también se puede fijar o quitar a mano.
 */
export class EditarPackCommand {
  constructor(private readonly packs: PackRecordadoRepository) {}

  async execute(input: EditarPackInput): Promise<Result<void>> {
    const n = input.unidadesPorPack;
    if (
      typeof n === "number" &&
      (!Number.isInteger(n) || n < MIN_UNIDADES_POR_PACK || n > MAX_UNIDADES_POR_PACK)
    ) {
      return err(ShoppingErrors.packNoValido(MIN_UNIDADES_POR_PACK, MAX_UNIDADES_POR_PACK));
    }

    if (input.desde !== input.hacia) {
      const [antes, despues] = await Promise.all([
        this.packs.buscar(input.desde),
        this.packs.buscar(input.hacia),
      ]);
      if (antes !== null) {
        if (despues === null)
          await this.packs.guardar({ ...antes, nombreNormalizado: input.hacia });
        await this.packs.borrar(input.desde);
      }
    }

    if (n === null) await this.packs.borrar(input.hacia);
    if (typeof n === "number") {
      const actual = await this.packs.buscar(input.hacia);
      await this.packs.guardar({
        nombreNormalizado: input.hacia,
        unidadesPorPack: n,
        enPack: actual?.enPack ?? true,
      });
    }
    return ok(undefined);
  }
}
