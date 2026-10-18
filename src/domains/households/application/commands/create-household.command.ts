import { Hogar, type HogarSnapshot } from "@/domains/households/domain/hogar";
import { HouseholdsErrors } from "@/domains/households/domain/households-errors";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { HouseholdRepository } from "../ports/household-repository";

export interface CreateHouseholdInput {
  readonly usuarioId: string;
  /** Generado en el cliente: un segundo envío con el mismo id no crea otro hogar. */
  readonly hogarId?: string;
  readonly nombre: string;
}

/**
 * Alta de un hogar tras el registro (pantalla /bienvenida). El registro crea solo
 * el usuario; así un fallo aquí no deja nada a medias y la vista 6 podrá unir a un
 * invitado a un hogar existente sin pasar por este use case.
 */
export class CreateHouseholdCommand {
  constructor(
    private readonly households: HouseholdRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateHouseholdInput): Promise<Result<HogarSnapshot>> {
    const hogar = Hogar.create(
      { id: input.hogarId ?? newId(), nombre: input.nombre, fundadorId: input.usuarioId },
      this.clock.now(),
    );
    if (!hogar.ok) return hogar;

    // Hasta decidir si un usuario puede tener varios hogares (PENDING), solo uno.
    if (await this.households.esMiembroDeAlguno(input.usuarioId)) {
      return err(HouseholdsErrors.yaTieneHogar());
    }

    const creado = await this.households.crear(hogar.value);
    if (!creado) return err(HouseholdsErrors.yaTieneHogar());

    return ok(hogar.value.toSnapshot());
  }
}
