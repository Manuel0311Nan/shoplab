import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TENANT_EXCLUDED, TENANT_MODELS } from "./tenant-models";

const SCHEMA_PATH = fileURLToPath(new URL("../../../prisma/schema.prisma", import.meta.url));

/** Nombre de cada modelo del schema y si tiene un campo `hogarId`. */
function modelosDelSchema(): Map<string, boolean> {
  const schema = readFileSync(SCHEMA_PATH, "utf8");
  const modelos = new Map<string, boolean>();

  for (const [, nombre, cuerpo] of schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    if (nombre === undefined || cuerpo === undefined) continue;
    modelos.set(nombre, /^\s*hogarId\s/m.test(cuerpo));
  }

  return modelos;
}

describe("TENANT_MODELS", () => {
  const modelos = modelosDelSchema();
  const conHogarId = [...modelos].filter(([, tiene]) => tiene).map(([nombre]) => nombre);

  it("schema_SeLeeCorrectamente_ContieneModelos", () => {
    expect(modelos.size).toBeGreaterThan(0);
  });

  it.each(conHogarId)("modeloConHogarId_%s_EstaEnTenantModelsOExcluidoConMotivo", (nombre) => {
    const incluido = TENANT_MODELS.has(nombre as never);
    const excluido = nombre in TENANT_EXCLUDED;

    expect(
      incluido || excluido,
      `${nombre} tiene hogarId: añádelo a TENANT_MODELS o a TENANT_EXCLUDED con el motivo`,
    ).toBe(true);
  });

  it("tenantModels_CadaModelo_ExisteYTieneHogarId", () => {
    for (const nombre of TENANT_MODELS) {
      expect(modelos.get(nombre), `${nombre} no existe en el schema o no tiene hogarId`).toBe(true);
    }
  });

  it("tenantModelsYExcluidos_NoSeSolapan", () => {
    const solapados = [...TENANT_MODELS].filter((nombre) => nombre in TENANT_EXCLUDED);

    expect(solapados).toEqual([]);
  });
});
