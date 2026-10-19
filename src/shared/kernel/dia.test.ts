import { describe, expect, it } from "vitest";
import { Dia, diasHasta, hoyEn, sumarDias } from "./dia";

const dia = (texto: string) => {
  const r = Dia.create(texto);
  if (!r.ok) throw new Error(texto);
  return r.value;
};

describe("Dia", () => {
  it.each(["2026-11-03", "2024-02-29"])("create_Valido_%s", (texto) => {
    expect(Dia.create(texto)).toEqual({ ok: true, value: texto });
  });

  it.each(["2026-02-30", "2025-02-29", "3/11/2026", "2026-1-3", ""])(
    "create_NoValido_%s",
    (texto) => {
      expect(Dia.create(texto)).toMatchObject({ ok: false, error: { code: "FECHA_NO_VALIDA" } });
    },
  );

  it("idaYVueltaConLaBd_ConservaElDia", () => {
    expect(Dia.desdeFechaBd(Dia.aFechaBd(dia("2026-11-03")))).toBe("2026-11-03");
  });

  it("hoyEn_A_LaUnaYMediaUtc_EnMadridYaEsElDiaSiguiente", () => {
    const reloj = { now: () => new Date("2026-10-19T22:30:00.000Z") };
    expect(hoyEn("Europe/Madrid", reloj)).toBe("2026-10-20");
    expect(hoyEn("UTC", reloj)).toBe("2026-10-19");
  });

  it("diasHasta_CuentaDiasDeCalendario", () => {
    expect(diasHasta(dia("2026-10-19"), dia("2026-10-26"))).toBe(7);
    expect(diasHasta(dia("2026-10-19"), dia("2026-10-19"))).toBe(0);
    expect(diasHasta(dia("2026-10-19"), dia("2026-10-18"))).toBe(-1);
    // Cambio de hora el 25 de octubre: sigue siendo 1 día.
    expect(diasHasta(dia("2026-10-25"), dia("2026-10-26"))).toBe(1);
  });

  it("sumarDias_CruzaMeses", () => {
    expect(sumarDias(dia("2026-10-30"), 3)).toBe("2026-11-02");
  });
});
