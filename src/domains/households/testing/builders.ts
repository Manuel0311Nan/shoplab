import { Hogar, type HogarSnapshot } from "@/domains/households/domain/hogar";

export const AHORA = new Date("2026-10-18T10:00:00.000Z");
export const HOGAR_ID = "0199d000-0000-7000-8000-0000000000b1";
export const OTRO_HOGAR_ID = "0199d000-0000-7000-8000-0000000000b2";
export const USUARIO_ID = "0199d000-0000-7000-8000-0000000000f1";

export function hogar(cambios: Partial<HogarSnapshot> = {}): Hogar {
  return Hogar.rehydrate({
    id: HOGAR_ID,
    nombre: "Casa",
    fundadorId: USUARIO_ID,
    createdAt: AHORA,
    updatedAt: AHORA,
    ...cambios,
  });
}
