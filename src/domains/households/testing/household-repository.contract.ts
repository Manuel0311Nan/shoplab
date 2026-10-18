import { describe, expect, it } from "vitest";
import type { HouseholdRepository } from "@/domains/households/application/ports/household-repository";
import type { Hogar } from "@/domains/households/domain/hogar";
import { AHORA, HOGAR_ID, USUARIO_ID, hogar } from "./builders";

/** Crea un repositorio con estos usuarios y hogares (y nada más). */
export type CrearRepositorio = (inicial: {
  usuarios: readonly string[];
  hogares: readonly Hogar[];
}) => Promise<HouseholdRepository>;

/**
 * Comportamiento que debe cumplir TODA implementación de `HouseholdRepository`:
 * el fake en memoria (tests unitarios) y Prisma (integración).
 */
export function householdRepositoryContract(nombre: string, crear: CrearRepositorio): void {
  describe(`HouseholdRepository: ${nombre}`, () => {
    it("esMiembroDeAlguno_UsuarioSinHogar_DevuelveFalse", async () => {
      const repo = await crear({ usuarios: [USUARIO_ID], hogares: [] });

      expect(await repo.esMiembroDeAlguno(USUARIO_ID)).toBe(false);
    });

    it("crear_HogarNuevo_LoGuardaConElFundadorComoMiembro", async () => {
      const repo = await crear({ usuarios: [USUARIO_ID], hogares: [] });

      const creado = await repo.crear(hogar());

      expect(creado).toBe(true);
      expect(await repo.esMiembroDeAlguno(USUARIO_ID)).toBe(true);
      expect(await repo.findById(HOGAR_ID)).toEqual({
        id: HOGAR_ID,
        nombre: "Casa",
        fundadorId: USUARIO_ID,
        createdAt: AHORA,
        updatedAt: AHORA,
      });
    });

    it("crear_IdYaExistente_DevuelveFalseYNoCambiaNada", async () => {
      const repo = await crear({ usuarios: [USUARIO_ID], hogares: [hogar()] });

      const creado = await repo.crear(hogar({ nombre: "Otro nombre" }));

      expect(creado).toBe(false);
      expect((await repo.findById(HOGAR_ID))?.nombre).toBe("Casa");
    });

    it("findById_HogarInexistente_DevuelveNull", async () => {
      const repo = await crear({ usuarios: [], hogares: [] });

      expect(await repo.findById(HOGAR_ID)).toBeNull();
    });
  });
}
