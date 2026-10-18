import { describe, expect, it } from "vitest";
import { elegirHogarActivo } from "./hogar-activo";

const A = "0199e000-0000-7000-8000-00000000000a";
const B = "0199e000-0000-7000-8000-00000000000b";

describe("elegirHogarActivo", () => {
  it("elegirHogarActivo_SinMembresias_DevuelveNull", () => {
    expect(elegirHogarActivo([])).toBeNull();
  });

  it("elegirHogarActivo_VariosHogares_DevuelveElMasAntiguo", () => {
    const membresias = [
      { hogarId: B, createdAt: new Date("2026-10-02T00:00:00Z") },
      { hogarId: A, createdAt: new Date("2026-10-01T00:00:00Z") },
    ];

    expect(elegirHogarActivo(membresias)).toBe(A);
  });
});
