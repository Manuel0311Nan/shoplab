import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ShoppingList } from "@/domains/shopping/domain/shopping-list";
import { item, lista, LISTA_ID, USUARIO_ID } from "@/domains/shopping/testing/builders";
import { shoppingListRepositoryContract } from "@/domains/shopping/testing/shopping-list-repository.contract";
import { prisma } from "@/shared/kernel/prisma";
import { PrismaShoppingListRepository } from "./prisma-shopping-list-repository";

// Hogares propios de esta suite (ids fijos: la rama de test es solo para tests).
const HOGAR_ID = "0199c000-0000-7000-8000-0000000000a1";
const OTRO_HOGAR_ID = "0199c000-0000-7000-8000-0000000000a2";

/** Deja en la BD exactamente estas listas del hogar de test. */
async function sembrar(listas: readonly ShoppingList[]): Promise<void> {
  await prisma.shoppingList.deleteMany({ where: { hogarId: { in: [HOGAR_ID, OTRO_HOGAR_ID] } } });

  for (const list of listas) {
    const snapshot = list.toSnapshot();
    await prisma.shoppingList.create({
      data: {
        ...snapshot,
        hogarId: HOGAR_ID,
        items: {
          create: list.itemsActivos().map((i) => {
            const { cantidad, ...resto } = i.toSnapshot();
            return {
              ...resto,
              hogarId: HOGAR_ID,
              cantidadValor: cantidad.valor,
              cantidadUnidad: cantidad.unidad,
            };
          }),
        },
      },
    });
  }
}

beforeAll(async () => {
  await prisma.hogar.createMany({
    data: [
      { id: HOGAR_ID, nombre: "Hogar de test" },
      { id: OTRO_HOGAR_ID, nombre: "Otro hogar de test" },
    ],
    skipDuplicates: true,
  });
  // Quien marca productos como comprados en la suite (compradoPorId tiene FK a Usuario).
  await prisma.usuario.upsert({
    where: { id: USUARIO_ID },
    create: { id: USUARIO_ID, email: "contrato-shopping@migas.test", nombre: "Usuario de test" },
    update: {},
  });
});

afterAll(async () => {
  // onDelete: Cascade borra también sus listas e ítems.
  await prisma.hogar.deleteMany({ where: { id: { in: [HOGAR_ID, OTRO_HOGAR_ID] } } });
  await prisma.usuario.deleteMany({ where: { id: USUARIO_ID } });
  await prisma.$disconnect();
});

shoppingListRepositoryContract("Prisma", async (listas, clock) => {
  await sembrar(listas);
  return new PrismaShoppingListRepository({ hogarId: HOGAR_ID }, clock);
});

describe("PrismaShoppingListRepository: aislamiento entre hogares", () => {
  it("findById_ListaDeOtroHogar_DevuelveNull", async () => {
    await sembrar([lista([item()])]);
    const repoDeOtroHogar = new PrismaShoppingListRepository({ hogarId: OTRO_HOGAR_ID });

    expect(await repoDeOtroHogar.findById(LISTA_ID)).toBeNull();
  });
});
