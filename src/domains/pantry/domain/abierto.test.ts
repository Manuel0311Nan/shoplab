import { describe, expect, it } from "vitest";
import { AHORA, DESPUES, LINEA_ID, cantidad, contexto, dia, idN, linea } from "../testing/builders";

const aviso = { amarillo: 3, rojo: 5 };
const abrirCon = (l = linea()) =>
  l.abrir({
    abiertoEl: dia("2026-10-20"),
    aviso,
    nuevaLinea: { id: idN(90), movimientoId: idN(91) },
    contexto: contexto(1),
    ahora: DESPUES,
  });

describe("InventoryItem: abrir", () => {
  it("una sola unidad o una cantidad en g, kg, ml o l: se abre la línea entera", () => {
    const leche = linea({ cantidad: cantidad(1.5, "l"), cantidadReferencia: cantidad(1.5, "l") });

    const r = abrirCon(leche);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.abierta).toBe(leche);
    expect(r.value.movimientos).toEqual([]);
    expect(leche.toSnapshot()).toMatchObject({
      abiertoEl: "2026-10-20",
      avisoAbierto: aviso,
      updatedAt: DESPUES,
    });
  });

  it("con varias unidades se abre una: línea nueva abierta y el resto cerrado, con ajustes", () => {
    const yogures = linea({
      cantidad: cantidad(4, "unidad"),
      cantidadReferencia: cantidad(4, "unidad"),
    });

    const r = abrirCon(yogures);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const abierta = r.value.abierta.toSnapshot();
    expect(abierta).toMatchObject({
      id: idN(90),
      cantidad: { valor: 1, unidad: "unidad" },
      abiertoEl: "2026-10-20",
      createdAt: DESPUES,
    });
    expect(yogures.toSnapshot()).toMatchObject({
      id: LINEA_ID,
      cantidad: { valor: 3, unidad: "unidad" },
      abiertoEl: null,
    });
    expect(
      r.value.movimientos.map((m) => [m.id, m.inventoryItemId, m.tipo, m.cantidad.valor]),
    ).toEqual([
      [idN(1), LINEA_ID, "ajuste", 3],
      [idN(91), idN(90), "ajuste", 1],
    ]);
  });

  it("no se abre dos veces", () => {
    const l = linea();
    abrirCon(l);

    const r = abrirCon(l);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("LINEA_YA_ABIERTA");
  });

  it("una línea abierta no es la misma que una cerrada del mismo producto", () => {
    const abierta = linea();
    abrirCon(abierta);
    const cerrada = linea({ id: idN(5) });

    expect(abierta.esMismaLinea(cerrada.clave())).toBe(false);
    expect(cerrada.esMismaLinea(cerrada.clave())).toBe(true);
  });
});

describe("InventoryItem: cambiarApertura", () => {
  it("corrige el día de una línea abierta y null la cierra", () => {
    const l = linea();
    abrirCon(l);

    expect(l.cambiarApertura(dia("2026-10-18"), DESPUES).ok).toBe(true);
    expect(l.toSnapshot().abiertoEl).toBe("2026-10-18");

    expect(l.cambiarApertura(null, DESPUES).ok).toBe(true);
    expect(l.toSnapshot()).toMatchObject({ abiertoEl: null, avisoAbierto: null });
  });

  it("poner fecha a una línea cerrada no vale: se abre con abrir()", () => {
    const r = linea().cambiarApertura(dia("2026-10-18"), AHORA);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("LINEA_NO_ABIERTA");
  });
});
