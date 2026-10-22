import { describe, expect, it } from "vitest";
import type { ProductoRecordadoRepository } from "@/domains/catalog/application/ports/producto-recordado-repository";
import type { ProductoRecordado } from "@/domains/catalog/domain/producto-recordado";
import { AHORA, DESPUES, recordado } from "./builders";

export type CrearRepositorio = (
  iniciales: readonly ProductoRecordado[],
) => Promise<ProductoRecordadoRepository>;

/** Lo cumplen el fake en memoria y Prisma. */
export function productoRecordadoRepositoryContract(nombre: string, crear: CrearRepositorio): void {
  describe(`ProductoRecordadoRepository: ${nombre}`, () => {
    it("buscar_Inexistente_DevuelveNull", async () => {
      expect(await (await crear([])).buscar("nada")).toBeNull();
    });

    it("guardar_Nuevo_SeRecuperaIgual", async () => {
      const repo = await crear([]);

      await repo.guardar(recordado());

      expect(await repo.buscar("tarta de la abuela")).toEqual(recordado());
    });

    it("guardar_Existente_LoReemplaza", async () => {
      const repo = await crear([recordado()]);

      await repo.guardar(recordado({ categoria: "otros", usos: 2, ultimoUso: DESPUES }));

      expect(await repo.buscar("tarta de la abuela")).toMatchObject({
        categoria: "otros",
        usos: 2,
      });
    });

    it("borrar_LoOlvidaYSiNoEstaNoFalla", async () => {
      const repo = await crear([recordado()]);

      await repo.borrar("tarta de la abuela");
      await repo.borrar("nada");

      expect(await repo.buscar("tarta de la abuela")).toBeNull();
    });

    it("listar_LoMasUsadoPrimeroYRespetaElLimite", async () => {
      const repo = await crear([
        recordado({ nombreNormalizado: "a", nombre: "A", usos: 1, ultimoUso: AHORA }),
        recordado({ nombreNormalizado: "b", nombre: "B", usos: 5, ultimoUso: AHORA }),
        recordado({ nombreNormalizado: "c", nombre: "C", usos: 1, ultimoUso: DESPUES }),
      ]);

      expect((await repo.listar(10)).map((p) => p.nombre)).toEqual(["B", "C", "A"]);
      expect(await repo.listar(1)).toHaveLength(1);
    });
  });
}
