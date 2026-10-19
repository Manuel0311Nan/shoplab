import { describe, expect, it } from "vitest";
import { AHORA, DESPUES, ubicacion, ubicacionesPorDefecto } from "../testing/builders";
import { mismoNombre, Ubicacion, ubicacionPropuesta } from "./ubicacion";

describe("Ubicacion", () => {
  it("create_NombreConEspacios_LoLimpia", () => {
    const r = Ubicacion.create(
      { id: "u", nombre: "  Nevera   pequeña ", tipo: "frio", orden: 4 },
      AHORA,
    );
    expect(r.ok && r.value.toSnapshot()).toMatchObject({ nombre: "Nevera pequeña", orden: 4 });
  });

  it.each(["", "x".repeat(31)])("create_NombreNoValido_%#", (nombre) => {
    expect(Ubicacion.create({ id: "u", nombre, tipo: "frio", orden: 1 }, AHORA)).toMatchObject({
      ok: false,
      error: { code: "NOMBRE_NO_VALIDO" },
    });
  });

  it("renombrarCambiarTipoColocarEliminar", () => {
    const u = ubicacion();

    expect(u.renombrar("Frigo", DESPUES).ok).toBe(true);
    expect(u.renombrar(" ", DESPUES).ok).toBe(false);
    u.cambiarTipo("ambiente", DESPUES);
    u.colocarEn(3, DESPUES);
    u.eliminar(DESPUES);

    expect(u.toSnapshot()).toMatchObject({
      nombre: "Frigo",
      tipo: "ambiente",
      orden: 3,
      deletedAt: DESPUES,
    });
  });

  it("mismoNombre_SinDistinguirMayusculasNiEspacios", () => {
    expect(mismoNombre(" nevera ", "Nevera")).toBe(true);
    expect(mismoNombre("Nevera", "Nevera 2")).toBe(false);
  });

  it("ubicacionPropuesta_PrimeraDelTipoOLaPrimera", () => {
    const todas = ubicacionesPorDefecto().map((u) => u.toSnapshot());

    expect(ubicacionPropuesta(todas, "congelado")?.nombre).toBe("Congelador");
    expect(
      ubicacionPropuesta(
        todas.filter((u) => u.tipo !== "congelado"),
        "congelado",
      )?.nombre,
    ).toBe("Nevera");
    expect(ubicacionPropuesta([], "frio")).toBeUndefined();
  });
});
