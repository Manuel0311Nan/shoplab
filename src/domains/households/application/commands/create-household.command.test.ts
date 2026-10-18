import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { AHORA, HOGAR_ID, OTRO_HOGAR_ID, USUARIO_ID, hogar } from "../../testing/builders";
import { InMemoryHouseholdRepository } from "../../testing/in-memory-household-repository";
import { CreateHouseholdCommand } from "./create-household.command";

const relojFijo: Clock = { now: () => AHORA };

describe("CreateHouseholdCommand", () => {
  it("execute_UsuarioSinHogar_CreaElHogarConElUsuarioComoMiembro", async () => {
    const repo = new InMemoryHouseholdRepository({ usuarios: [USUARIO_ID] });
    const command = new CreateHouseholdCommand(repo, relojFijo);

    const result = await command.execute({
      usuarioId: USUARIO_ID,
      hogarId: HOGAR_ID,
      nombre: "Casa",
    });

    expect(result).toMatchObject({ ok: true, value: { id: HOGAR_ID, nombre: "Casa" } });
    expect(await repo.esMiembroDeAlguno(USUARIO_ID)).toBe(true);
  });

  it("execute_SinId_GeneraUnUuid", async () => {
    const repo = new InMemoryHouseholdRepository({ usuarios: [USUARIO_ID] });
    const command = new CreateHouseholdCommand(repo, relojFijo);

    const result = await command.execute({ usuarioId: USUARIO_ID, nombre: "Casa" });

    expect(result.ok && result.value.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("execute_UsuarioQueYaTieneHogar_DevuelveYaTieneHogarYNoCreaOtro", async () => {
    const repo = new InMemoryHouseholdRepository({ usuarios: [USUARIO_ID], hogares: [hogar()] });
    const command = new CreateHouseholdCommand(repo, relojFijo);

    const result = await command.execute({
      usuarioId: USUARIO_ID,
      hogarId: OTRO_HOGAR_ID,
      nombre: "Otra casa",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "YA_TIENE_HOGAR" } });
    expect(await repo.findById(OTRO_HOGAR_ID)).toBeNull();
  });

  it("execute_IdDeHogarYaUsado_DevuelveYaTieneHogar", async () => {
    const OTRO_USUARIO = "0199d000-0000-7000-8000-0000000000f2";
    const repo = new InMemoryHouseholdRepository({
      usuarios: [USUARIO_ID, OTRO_USUARIO],
      hogares: [hogar({ fundadorId: OTRO_USUARIO })],
    });
    const command = new CreateHouseholdCommand(repo, relojFijo);

    const result = await command.execute({
      usuarioId: USUARIO_ID,
      hogarId: HOGAR_ID,
      nombre: "Casa",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "YA_TIENE_HOGAR" } });
  });

  it("execute_ConNombreVacio_NoCreaNada", async () => {
    const repo = new InMemoryHouseholdRepository({ usuarios: [USUARIO_ID] });
    const command = new CreateHouseholdCommand(repo, relojFijo);

    const result = await command.execute({ usuarioId: USUARIO_ID, hogarId: HOGAR_ID, nombre: " " });

    expect(result).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
    expect(await repo.findById(HOGAR_ID)).toBeNull();
  });
});
