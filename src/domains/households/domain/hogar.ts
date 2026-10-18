import { err, ok, type Result } from "@/shared/kernel/result";
import { HouseholdsErrors } from "./households-errors";

export interface HogarSnapshot {
  readonly id: string;
  readonly nombre: string;
  /** Usuario que lo crea: es su primer miembro. */
  readonly fundadorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface NewHogar {
  readonly id: string;
  readonly nombre: string;
  readonly fundadorId: string;
}

export const MAX_NOMBRE_HOGAR = 60;

/** Un hogar: comparte listas y despensa entre sus miembros. */
export class Hogar {
  private constructor(private readonly state: HogarSnapshot) {}

  static create(input: NewHogar, ahora: Date): Result<Hogar> {
    const nombre = input.nombre.trim();
    if (nombre.length === 0 || nombre.length > MAX_NOMBRE_HOGAR) {
      return err(HouseholdsErrors.nombreNoValido(MAX_NOMBRE_HOGAR));
    }
    return ok(
      new Hogar({
        id: input.id,
        nombre,
        fundadorId: input.fundadorId,
        createdAt: ahora,
        updatedAt: ahora,
      }),
    );
  }

  static rehydrate(snapshot: HogarSnapshot): Hogar {
    return new Hogar(snapshot);
  }

  get id(): string {
    return this.state.id;
  }

  toSnapshot(): HogarSnapshot {
    return this.state;
  }
}
