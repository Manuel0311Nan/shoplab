import { describe, expect, it } from "vitest";
import type { ShoppingListRepository } from "@/domains/shopping/application/ports/shopping-list-repository";
import { ShoppingList } from "@/domains/shopping/domain/shopping-list";
import {
  AHORA,
  DESPUES,
  ITEM_ID,
  LISTA_ID,
  OTRO_ID,
  USUARIO_ID,
  cantidad,
  item,
  lista,
} from "./builders";

/** Crea un repositorio que ya contiene las listas indicadas (y nada más). */
export type CrearRepositorio = (listas: readonly ShoppingList[]) => Promise<ShoppingListRepository>;

/**
 * Comportamiento que debe cumplir TODA implementación de `ShoppingListRepository`.
 * Se ejecuta contra el fake en memoria (tests unitarios) y contra Prisma (integración):
 * así el fake no puede desviarse del repositorio real sin que falle un test.
 */
export function shoppingListRepositoryContract(nombre: string, crear: CrearRepositorio): void {
  describe(`ShoppingListRepository: ${nombre}`, () => {
    it("findById_ListaInexistente_DevuelveNull", async () => {
      const repo = await crear([]);

      expect(await repo.findById(LISTA_ID)).toBeNull();
    });

    it("findById_ListaExistente_DevuelveLaListaConSusItems", async () => {
      const repo = await crear([lista([item()])]);

      const encontrada = await repo.findById(LISTA_ID);

      expect(encontrada?.toSnapshot()).toMatchObject({ id: LISTA_ID, nombre: "Semana" });
      expect(encontrada?.itemsActivos().map((i) => i.id)).toEqual([ITEM_ID]);
    });

    it("listarActivas_VariasListas_SinArchivadasYPorFechaDeCreacion", async () => {
      const crearLista = (id: string, nombre: string, fecha: Date) =>
        ShoppingList.rehydrate(
          { id, nombre, archivadaAt: null, createdAt: fecha, updatedAt: fecha },
          [],
        );
      const archivada = lista([], { archivada: true });
      const repo = await crear([
        crearLista(OTRO_ID, "Fiesta", DESPUES),
        crearLista(ITEM_ID, "Semana", AHORA),
        archivada,
      ]);

      const activas = await repo.listarActivas(10);

      expect(activas.map((l) => l.id)).toEqual([ITEM_ID, OTRO_ID]);
      expect(await repo.listarActivas(1)).toHaveLength(1);
    });

    it("save_ListaNueva_SeRecuperaVacia", async () => {
      const repo = await crear([]);
      const nueva = ShoppingList.create({ id: LISTA_ID, nombre: "Semana" }, AHORA);

      if (nueva.ok) await repo.save(nueva.value);
      const recargada = await repo.findById(LISTA_ID);

      expect(recargada?.toSnapshot()).toEqual({
        id: LISTA_ID,
        nombre: "Semana",
        archivadaAt: null,
        createdAt: AHORA,
        updatedAt: AHORA,
      });
      expect(recargada?.itemsActivos()).toEqual([]);
    });

    it("save_ItemNuevo_SeRecuperaConTodosSusCampos", async () => {
      const repo = await crear([lista()]);
      const original = await repo.findById(LISTA_ID);
      original?.agregarItem(
        { id: ITEM_ID, nombre: "Leche", cantidad: cantidad(1.5, "l"), nota: "Sin lactosa" },
        AHORA,
      );

      if (original) await repo.save(original);
      const recargada = await repo.findById(LISTA_ID);

      expect(recargada?.itemsActivos()[0]?.toSnapshot()).toEqual({
        id: ITEM_ID,
        nombre: "Leche",
        ingredientId: null,
        cantidad: { valor: 1.5, unidad: "l" },
        nota: "Sin lactosa",
        compradoAt: null,
        compradoPorId: null,
        createdAt: AHORA,
        updatedAt: AHORA,
        deletedAt: null,
      });
    });

    it("save_ItemModificado_PersisteElCambio", async () => {
      const repo = await crear([lista([item()])]);
      const original = await repo.findById(LISTA_ID);
      original?.actualizarItem(ITEM_ID, { comprado: true }, USUARIO_ID, DESPUES);

      if (original) await repo.save(original);
      const recargada = await repo.findById(LISTA_ID);

      expect(recargada?.itemsActivos()[0]?.toSnapshot()).toMatchObject({
        compradoAt: DESPUES,
        compradoPorId: USUARIO_ID,
        updatedAt: DESPUES,
      });
    });

    it("findById_ConCambiosSinGuardar_NoLosDevuelve", async () => {
      const repo = await crear([lista([item()])]);
      const original = await repo.findById(LISTA_ID);
      original?.actualizarItem(ITEM_ID, { comprado: true }, USUARIO_ID, DESPUES);

      const recargada = await repo.findById(LISTA_ID);

      expect(recargada?.itemsActivos()[0]?.estaComprado).toBe(false);
    });

    it("findById_ItemQuitadoYGuardado_NoLoDevuelve", async () => {
      const repo = await crear([lista([item()])]);
      const original = await repo.findById(LISTA_ID);
      original?.quitarItem(ITEM_ID, DESPUES);

      if (original) await repo.save(original);
      const recargada = await repo.findById(LISTA_ID);

      expect(recargada?.itemsActivos()).toEqual([]);
    });

    it("findById_VariosItems_LosOrdenaPorFechaDeCreacion", async () => {
      const posterior = item({ id: OTRO_ID, nombre: "Huevos", createdAt: DESPUES });
      const anterior = item({ id: ITEM_ID, nombre: "Pan", createdAt: AHORA });
      const repo = await crear([lista([posterior, anterior])]);

      const encontrada = await repo.findById(LISTA_ID);

      expect(encontrada?.itemsActivos().map((i) => i.id)).toEqual([ITEM_ID, OTRO_ID]);
    });
  });
}
