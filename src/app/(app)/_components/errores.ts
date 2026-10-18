import {
  type DuplicadoDetails,
  duplicadoDetailsSchema,
  type LimiteDeListasDetails,
  limiteDeListasDetailsSchema,
} from "@/contracts/shopping";
import type { AppError } from "@/shared/kernel/errors";

/** Las listas entre las que elegir, si el error es LIMITE_DE_LISTAS. */
export function limiteDeListas(error: AppError): LimiteDeListasDetails | null {
  if (error.code !== "LIMITE_DE_LISTAS") return null;
  const details = limiteDeListasDetailsSchema.safeParse(error.details);
  return details.success ? details.data : null;
}

/** El producto que ya estaba, si el error es POSIBLE_DUPLICADO o UNIDADES_DISTINTAS. */
export function duplicado(error: AppError): DuplicadoDetails["existente"] | null {
  if (error.code !== "POSIBLE_DUPLICADO" && error.code !== "UNIDADES_DISTINTAS") return null;
  const details = duplicadoDetailsSchema.safeParse(error.details);
  return details.success ? details.data.existente : null;
}
