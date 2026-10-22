import "server-only";
import type { CreateHouseholdRequest, HouseholdResponse } from "@/contracts/households";
import { householdsModule } from "@/domains/households/infrastructure/households-module";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import type { Identity } from "@/shared/kernel/auth-context";
import { ok, type Result } from "@/shared/kernel/result";

/** La primera lista es la general: reúne las que el hogar cree después. */
const NOMBRE_PRIMERA_LISTA = "Lista general";

/**
 * Alta del hogar + su primera lista. La comparten la Server Action de /bienvenida y
 * `POST /api/v1/households`, para que web y app hagan exactamente lo mismo.
 *
 * Excepción temporal a "un use case por operación": la primera lista es de otro contexto
 * (Shopping) y aún no hay eventos de dominio (llegan en la vista 4, y entonces Shopping
 * reaccionará a `HogarCreado`). Lo mismo con las ubicaciones de la despensa (Pantry).
 * Si algo de eso falla, el hogar queda creado igualmente.
 */
export async function darDeAltaHogar(
  identity: Identity,
  input: CreateHouseholdRequest,
): Promise<Result<HouseholdResponse>> {
  const hogar = await householdsModule().createHousehold.execute({
    usuarioId: identity.userId,
    hogarId: input.id,
    nombre: input.nombre,
  });
  if (!hogar.ok) return hogar;

  let primeraListaId: string | null = null;
  try {
    const lista = await shoppingModule({
      userId: identity.userId,
      hogarId: hogar.value.id,
    }).createList.execute({ nombre: NOMBRE_PRIMERA_LISTA, general: true });
    if (lista.ok) primeraListaId = lista.value.id;
  } catch (error) {
    console.error("[alta-hogar] No se pudo crear la primera lista", error);
  }

  try {
    await pantryModule({ hogarId: hogar.value.id }).crearUbicacionesPorDefecto.execute();
  } catch (error) {
    console.error("[alta-hogar] No se pudieron crear las ubicaciones de la despensa", error);
  }

  return ok({
    id: hogar.value.id,
    nombre: hogar.value.nombre,
    primeraListaId,
    createdAt: hogar.value.createdAt.toISOString(),
  });
}
