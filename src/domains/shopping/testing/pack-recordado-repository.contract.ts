import { describe, expect, it } from "vitest";
import type { PackRecordadoRepository } from "@/domains/shopping/application/ports/pack-recordado-repository";
import type { PackRecordado } from "@/domains/shopping/domain/pack-recordado";

export type CrearRepositorioPacks = (
  iniciales: readonly PackRecordado[],
) => Promise<PackRecordadoRepository>;

const YOGUR: PackRecordado = {
  nombreNormalizado: "yogur natural",
  unidadesPorPack: 4,
  enPack: true,
};

/** Lo cumplen el fake en memoria y Prisma. */
export function packRecordadoRepositoryContract(
  nombre: string,
  crear: CrearRepositorioPacks,
): void {
  describe(`PackRecordadoRepository: ${nombre}`, () => {
    it("buscar_Inexistente_DevuelveNull", async () => {
      expect(await (await crear([])).buscar("nada")).toBeNull();
    });

    it("guardar_Nuevo_SeRecuperaIgual", async () => {
      const repo = await crear([]);

      await repo.guardar(YOGUR);

      expect(await repo.buscar("yogur natural")).toEqual(YOGUR);
    });

    it("guardar_Existente_LoReemplaza", async () => {
      const repo = await crear([YOGUR]);

      await repo.guardar({ ...YOGUR, unidadesPorPack: 8, enPack: false });

      expect(await repo.buscar("yogur natural")).toEqual({
        ...YOGUR,
        unidadesPorPack: 8,
        enPack: false,
      });
    });

    it("listar_TodosPorNombre", async () => {
      const repo = await crear([
        YOGUR,
        { nombreNormalizado: "agua", unidadesPorPack: 6, enPack: true },
      ]);

      expect((await repo.listar()).map((p) => p.nombreNormalizado)).toEqual([
        "agua",
        "yogur natural",
      ]);
    });
  });
}
