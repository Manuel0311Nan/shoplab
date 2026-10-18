import { conflictError, validationError } from "@/shared/kernel/errors";

export const HouseholdsErrors = {
  yaTieneHogar: () => conflictError("YA_TIENE_HOGAR", "Ya perteneces a un hogar"),

  nombreNoValido: (max: number) =>
    validationError(
      "NOMBRE_NO_VALIDO",
      `El nombre del hogar debe tener entre 1 y ${max} caracteres`,
    ),
};
