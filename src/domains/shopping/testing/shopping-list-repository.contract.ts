import { describe, expect, it } from "vitest";
import type { ShoppingListRepository } from "@/domains/shopping/application/ports/shopping-list-repository";
import { ShoppingList } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
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
  listaCon,
  listaId,
  minutos,
} from "./builders";

/** Crea un repositorio que ya contiene las listas indicadas (y nada más), con ese reloj. */
export type CrearRepositorio = (
  listas: readonly ShoppingList[],
  clock: Clock,
) => Promise<ShoppingListRepository>;

const DIA = 24 * 60 * 60_000;
const relojEn = (fecha: Date): Clock => ({ now: () => fecha });

/**
 * Comportamiento que debe cumplir TODA implementación de `ShoppingListRepository`.
 * Se ejecuta contra el fake en memoria (tests unitarios) y contra Prisma (integración):
 * así el fake no puede desviarse del repositorio real sin que falle un test.
 */
export function shoppingListRepositoryContract(
  nombre: string,
  crearConReloj: CrearRepositorio,
): void {
  const crear = (listas: readonly ShoppingList[], ahora: Date = AHORA) =>
    crearConReloj(listas, relojEn(ahora));

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

    it("listarActivas_VariasListas_SinArchivadasNiBorradasYUltimaModificadaPrimero", async () => {
      const repo = await crear([
        listaCon({ id: listaId(1), nombre: "Antigua", updatedAt: AHORA }),
        listaCon({ id: listaId(2), nombre: "Reciente", updatedAt: minutos(10) }),
        listaCon({ id: listaId(3), nombre: "Archivada", archivadaAt: AHORA }),
        listaCon({ id: listaId(4), nombre: "Borrada", deletedAt: AHORA }),
      ]);

      const activas = await repo.listarActivas();

      expect(activas.map((l) => l.nombre)).toEqual(["Reciente", "Antigua"]);
      expect(await repo.contarActivas()).toBe(2);
    });

    it("listaGeneral_VaPrimero_NoCuentaParaElLimite_YReuneLasActivasConItems", async () => {
      const repo = await crear([
        listaCon({ id: listaId(1), nombre: "Mercadona", updatedAt: minutos(10) }, [item()]),
        listaCon({ id: listaId(2), nombre: "General", general: true, updatedAt: AHORA }),
        listaCon({ id: listaId(3), nombre: "Archivada", archivadaAt: AHORA }),
      ]);

      expect((await repo.listarActivas()).map((l) => [l.nombre, l.general])).toEqual([
        ["General", true],
        ["Mercadona", false],
      ]);
      expect(await repo.contarActivas()).toBe(1);
      const conItems = await repo.listarActivasConItems();
      expect(conItems.map((l) => [l.nombre, l.itemsActivos().length])).toEqual([
        ["General", 0],
        ["Mercadona", 1],
      ]);
    });

    it("save_ItemPorPacks_SeRecuperaConUnidadesPorPack", async () => {
      const repo = await crear([lista()]);
      const l = await repo.findById(LISTA_ID);
      if (l === null) throw new Error("sin lista");
      const r = l.agregarItem(
        { id: ITEM_ID, nombre: "Yogur", cantidad: cantidad(8, "unidad"), unidadesPorPack: 4 },
        DESPUES,
      );
      expect(r.ok).toBe(true);

      await repo.save(l);

      expect((await repo.findById(LISTA_ID))?.itemsActivos()[0]?.unidadesPorPack).toBe(4);
    });

    it("listarActivas_MismaFecha_DesempataPorIdDescendente", async () => {
      const repo = await crear([listaCon({ id: listaId(1) }), listaCon({ id: listaId(2) })]);

      const activas = await repo.listarActivas();

      expect(activas.map((l) => l.id)).toEqual([listaId(2), listaId(1)]);
    });

    it("listarActivas_ConItems_CuentaPendientesYTotalSinQuitados", async () => {
      const repo = await crear([
        listaCon({}, [
          item({ id: listaId(11), nombre: "Pan" }),
          item({ id: listaId(12), nombre: "Leche", compradoAt: AHORA, compradoPorId: USUARIO_ID }),
          item({ id: listaId(13), nombre: "Huevos" }),
        ]),
        listaCon({ id: OTRO_ID }),
      ]);
      const conQuitado = await repo.findById(LISTA_ID);
      conQuitado?.quitarItem(listaId(13), DESPUES);
      if (conQuitado) await repo.save(conQuitado);

      const activas = await repo.listarActivas();

      expect(activas.find((l) => l.id === LISTA_ID)).toMatchObject({ pendientes: 1, total: 2 });
      expect(activas.find((l) => l.id === OTRO_ID)).toMatchObject({ pendientes: 0, total: 0 });
    });

    it("listarArchivadas_VariasPaginas_UltimaArchivadaPrimeroConCursor", async () => {
      const repo = await crear(
        [
          listaCon({ id: listaId(1), nombre: "A", archivadaAt: minutos(1) }),
          listaCon({ id: listaId(2), nombre: "B", archivadaAt: minutos(3) }),
          listaCon({ id: listaId(3), nombre: "C", archivadaAt: minutos(3) }),
          listaCon({ id: listaId(4), nombre: "Activa" }),
        ],
        minutos(60),
      );

      const primera = await repo.listarArchivadas({ limite: 2 });
      const ultima = primera.at(-1);
      const segunda = await repo.listarArchivadas({
        limite: 2,
        ...(ultima?.archivadaAt ? { despuesDe: { fecha: ultima.archivadaAt, id: ultima.id } } : {}),
      });

      expect(primera.map((l) => l.nombre)).toEqual(["C", "B"]);
      expect(segunda.map((l) => l.nombre)).toEqual(["A"]);
    });

    it("listarArchivadas_ArchivadaHaceMasDe15Dias_NoAparece", async () => {
      const ahora = new Date(AHORA.getTime() + 15 * DIA);
      const repo = await crear(
        [
          listaCon({ id: listaId(1), nombre: "Caducada", archivadaAt: AHORA }),
          listaCon({ id: listaId(2), nombre: "Vigente", archivadaAt: minutos(1) }),
        ],
        ahora,
      );

      expect((await repo.listarArchivadas({ limite: 10 })).map((l) => l.nombre)).toEqual([
        "Vigente",
      ]);
      expect(await repo.findById(listaId(1))).toBeNull();
      expect(await repo.findById(listaId(2))).not.toBeNull();
    });

    it("findById_ListaBorrada_DevuelveNull", async () => {
      const repo = await crear([lista()]);
      const original = await repo.findById(LISTA_ID);
      original?.eliminar(DESPUES);

      if (original) await repo.save(original);

      expect(await repo.findById(LISTA_ID)).toBeNull();
      expect(await repo.listarActivas()).toEqual([]);
    });

    it("guardarVarias_IntercambioArchivarYDesarchivar_GuardaAmbas", async () => {
      const repo = await crear([
        listaCon({ id: listaId(1) }),
        listaCon({ id: listaId(2), archivadaAt: AHORA }),
      ]);
      const activa = await repo.findById(listaId(1));
      const archivada = await repo.findById(listaId(2));
      activa?.archivar(DESPUES);
      archivada?.desarchivar(DESPUES);

      if (activa && archivada) await repo.guardarVarias([activa, archivada]);

      expect((await repo.listarActivas()).map((l) => l.id)).toEqual([listaId(2)]);
      expect((await repo.listarArchivadas({ limite: 10 })).map((l) => l.id)).toEqual([listaId(1)]);
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
        general: false,
        createdAt: AHORA,
        updatedAt: AHORA,
        deletedAt: null,
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
        productoBaseId: null,
        categoria: "otros",
        cantidad: { valor: 1.5, unidad: "l" },
        unidadesPorPack: null,
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
