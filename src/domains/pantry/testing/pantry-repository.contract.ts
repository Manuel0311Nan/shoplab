import { describe, expect, it } from "vitest";
import type { PantryRepository } from "@/domains/pantry/application/ports/pantry-repository";
import type { InventoryItem } from "@/domains/pantry/domain/inventory-item";
import type { Ubicacion } from "@/domains/pantry/domain/ubicacion";
import {
  AHORA,
  ARMARIO_ID,
  DESPUES,
  LECHE_BASE_ID,
  LINEA_ID,
  NEVERA_ID,
  OTRA_LINEA_ID,
  USUARIO_ID,
  cantidad,
  contexto,
  dia,
  idN,
  linea,
  ubicacion,
  ubicacionesPorDefecto,
} from "./builders";

export type CrearRepositorio = (inicial: {
  ubicaciones: readonly Ubicacion[];
  lineas: readonly InventoryItem[];
}) => Promise<PantryRepository>;

/** Lo cumplen el fake en memoria y Prisma. */
export function pantryRepositoryContract(nombre: string, crear: CrearRepositorio): void {
  describe(`PantryRepository: ${nombre}`, () => {
    it("listarUbicaciones_VivasPorOrden", async () => {
      const [nevera, congelador, armario] = ubicacionesPorDefecto();
      const borrada = ubicacion({ id: idN(70), nombre: "Bodega", orden: 0, deletedAt: AHORA });
      const repo = await crear({
        ubicaciones: [armario, borrada, nevera, congelador].flatMap((u) => (u ? [u] : [])),
        lineas: [],
      });

      expect((await repo.listarUbicaciones()).map((u) => u.nombre)).toEqual([
        "Nevera",
        "Congelador",
        "Armario",
      ]);
    });

    it("guardar_LineaNuevaConMovimiento_SeRecuperaIgual", async () => {
      const repo = await crear({ ubicaciones: ubicacionesPorDefecto(), lineas: [] });
      const l = linea({
        productoBaseId: LECHE_BASE_ID,
        caducaEl: dia("2026-11-03"),
        cantidad: cantidad(1.5, "l"),
        cantidadReferencia: cantidad(2, "l"),
      });

      await repo.guardar({
        lineas: [l],
        movimientos: [
          {
            id: idN(1),
            inventoryItemId: LINEA_ID,
            tipo: "entrada",
            cantidad: cantidad(1.5, "l"),
            origen: "compra",
            listaId: idN(50),
            usuarioId: USUARIO_ID,
            createdAt: AHORA,
          },
        ],
      });

      expect((await repo.findLinea(LINEA_ID))?.toSnapshot()).toEqual(l.toSnapshot());
      expect(await repo.existeMovimiento(idN(1))).toBe(true);
      expect(await repo.existeMovimiento(idN(2))).toBe(false);
    });

    it("guardar_LineaAbierta_SeRecuperaConDiaYAviso", async () => {
      const repo = await crear({ ubicaciones: ubicacionesPorDefecto(), lineas: [] });
      const l = linea({ abiertoEl: dia("2026-10-18"), avisoAbierto: { amarillo: 3, rojo: 5 } });

      await repo.guardar({ lineas: [l] });

      expect((await repo.findLinea(LINEA_ID))?.toSnapshot()).toEqual(l.toSnapshot());
    });

    it("listarLineas_SinLasDadasDeBaja", async () => {
      const repo = await crear({
        ubicaciones: ubicacionesPorDefecto(),
        lineas: [linea(), linea({ id: OTRA_LINEA_ID, nombre: "Arroz", ubicacionId: ARMARIO_ID })],
      });
      const l = await repo.findLinea(LINEA_ID);
      const baja = l?.darDeBaja(contexto(), DESPUES);

      if (l && baja) await repo.guardar({ lineas: [l], movimientos: [baja] });

      expect((await repo.listarLineas()).map((x) => x.id)).toEqual([OTRA_LINEA_ID]);
      expect(await repo.findLinea(LINEA_ID)).toBeNull();
    });

    it("guardar_UbicacionYLineasALaVez", async () => {
      const repo = await crear({ ubicaciones: ubicacionesPorDefecto(), lineas: [linea()] });
      const [nevera] = await repo.listarUbicaciones();
      const l = await repo.findLinea(LINEA_ID);
      nevera?.eliminar(DESPUES);
      l?.mover(ARMARIO_ID, DESPUES);

      if (nevera && l) await repo.guardar({ ubicaciones: [nevera], lineas: [l] });

      expect((await repo.listarUbicaciones()).map((u) => u.id)).not.toContain(NEVERA_ID);
      expect((await repo.findLinea(LINEA_ID))?.ubicacionId).toBe(ARMARIO_ID);
    });
  });
}
