import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  DESPUES,
  ITEM_ID,
  OTRO_ID,
  cantidad,
  item,
  listaCon,
  listaId,
  minutos,
} from "../testing/builders";
import { InMemoryShoppingListRepository } from "../testing/in-memory-shopping-list-repository";
import { MAX_LISTAS_ACTIVAS } from "../domain/shopping-list";
import { CreateShoppingListCommand } from "./commands/create-shopping-list.command";
import { DeleteShoppingListCommand } from "./commands/delete-shopping-list.command";
import { FinishShoppingCommand } from "./commands/finish-shopping.command";
import { UpdateShoppingListCommand } from "./commands/update-shopping-list.command";
import { GetShoppingListQuery } from "./queries/get-shopping-list.query";

const reloj: Clock = { now: () => DESPUES };
const GENERAL = listaId(90);
const MERCADONA = listaId(1);
const LIDL = listaId(2);

const repoConTres = () =>
  new InMemoryShoppingListRepository(
    [
      listaCon({ id: GENERAL, nombre: "Lista general", general: true }, [
        item({ id: listaId(50), nombre: "Pilas", createdAt: minutos(3) }),
      ]),
      listaCon({ id: MERCADONA, nombre: "Mercadona" }, [
        item({ id: ITEM_ID, nombre: "Leche", createdAt: minutos(1), compradoAt: DESPUES }),
      ]),
      listaCon({ id: LIDL, nombre: "Lidl" }, [
        item({ id: OTRO_ID, nombre: "Pan", createdAt: minutos(2) }),
      ]),
      listaCon({ id: listaId(3), nombre: "Vieja", archivadaAt: DESPUES }, [
        item({ id: listaId(60), nombre: "Archivado" }),
      ]),
    ],
    reloj,
  );

describe("Lista general", () => {
  it("enseña sus productos y los de todas las activas, cada uno con su lista", async () => {
    const r = await new GetShoppingListQuery(repoConTres()).execute({ listId: GENERAL });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.items.map((i) => [i.nombre, i.listaNombre])).toEqual([
      ["Leche", "Mercadona"],
      ["Pan", "Lidl"],
      ["Pilas", "Lista general"],
    ]);
  });

  it("una lista normal solo enseña lo suyo", async () => {
    const r = await new GetShoppingListQuery(repoConTres()).execute({ listId: LIDL });

    expect(r.ok && r.value.items.map((i) => i.nombre)).toEqual(["Pan"]);
  });

  it("terminar la compra en la general quita lo comprado de todas y deja lo pendiente", async () => {
    const repo = repoConTres();

    const r = await new FinishShoppingCommand(repo, reloj).execute({
      listId: GENERAL,
      modo: "vaciar",
    });

    expect(r.ok && r.value.items.map((i) => i.nombre)).toEqual(["Pan", "Pilas"]);
    expect((await repo.findById(MERCADONA))?.itemsActivos()).toEqual([]);
    expect((await repo.findById(LIDL))?.itemsActivos().map((i) => i.nombre)).toEqual(["Pan"]);
  });

  it("no se archiva ni se borra", async () => {
    const repo = repoConTres();

    const archivar = await new UpdateShoppingListCommand(repo, reloj).execute({
      listId: GENERAL,
      archivada: true,
    });
    const borrar = await new DeleteShoppingListCommand(repo, reloj).execute({ listId: GENERAL });

    expect(!archivar.ok && archivar.error.code).toBe("LISTA_GENERAL");
    expect(!borrar.ok && borrar.error.code).toBe("LISTA_GENERAL");
    expect(
      (
        await new UpdateShoppingListCommand(repo, reloj).execute({
          listId: GENERAL,
          nombre: "Todo",
        })
      ).ok,
    ).toBe(true);
  });

  it("no cuenta para el límite de 15 ni se puede archivar para hacer sitio", async () => {
    const normales = Array.from({ length: MAX_LISTAS_ACTIVAS - 1 }, (_, i) =>
      listaCon({ id: listaId(10 + i), nombre: `Lista ${i}` }),
    );
    const repo = new InMemoryShoppingListRepository(
      [listaCon({ id: GENERAL, nombre: "General", general: true }), ...normales],
      reloj,
    );
    const crear = new CreateShoppingListCommand(repo, reloj);

    expect((await crear.execute({ nombre: "La 15" })).ok).toBe(true);
    const llena = await crear.execute({ nombre: "La 16", archivarListaId: GENERAL });
    expect(!llena.ok && llena.error.code).toBe("LISTA_PARA_ARCHIVAR_NO_VALIDA");
  });

  it("el alta crea la general sin mirar el límite", async () => {
    const repo = new InMemoryShoppingListRepository([], reloj);

    const r = await new CreateShoppingListCommand(repo, reloj).execute({
      nombre: "Lista general",
      general: true,
    });

    expect(r.ok && r.value.general).toBe(true);
  });
});

describe("Packs", () => {
  it("se guardan en unidades con las unidades por pack; fuera de rango, error", async () => {
    const l = listaCon();
    const ok = l.agregarItem(
      { id: ITEM_ID, nombre: "Yogur", cantidad: cantidad(8, "unidad"), unidadesPorPack: 4 },
      DESPUES,
    );
    const enKg = l.agregarItem(
      { id: OTRO_ID, nombre: "Arroz", cantidad: cantidad(2, "kg"), unidadesPorPack: 4 },
      DESPUES,
    );
    const deUno = l.agregarItem(
      { id: listaId(70), nombre: "Agua", cantidad: cantidad(1, "unidad"), unidadesPorPack: 1 },
      DESPUES,
    );

    expect(ok.ok && ok.value.unidadesPorPack).toBe(4);
    expect(!enKg.ok && enKg.error.code).toBe("PACK_NO_VALIDO");
    expect(!deUno.ok && deUno.error.code).toBe("PACK_NO_VALIDO");
  });

  it("cambiar la cantidad a un número de packs entero lo mantiene; si no, deja de ser pack", () => {
    const yogur = item({ cantidad: cantidad(8, "unidad"), unidadesPorPack: 4 });

    yogur.cambiarCantidad(cantidad(12, "unidad"), DESPUES);
    expect(yogur.unidadesPorPack).toBe(4);
    yogur.cambiarCantidad(cantidad(5, "unidad"), DESPUES);
    expect(yogur.unidadesPorPack).toBeNull();
  });
});
