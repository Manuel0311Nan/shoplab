import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/shared/kernel/prisma";
import { PrismaRecetaRepository } from "./prisma-receta-repository";

const RECETA_ID = "0199d000-0000-7000-8000-0000000000b1";
const ARROZ_ID = "0199d000-0000-7000-8000-0000000000b2";
const POLLO_ID = "0199d000-0000-7000-8000-0000000000b3";
/** Un producto que ya no está en la lista base: el repositorio lo ignora. */
const BORRADO_ID = "0199d000-0000-7000-8000-0000000000b4";

beforeAll(async () => {
  await limpiar();
  // Nombres de test que no chocan con la lista base sembrada en la rama de test.
  await prisma.productoBase.createMany({
    data: [
      {
        id: ARROZ_ID,
        nombre: "Arroz (test recetas)",
        categoria: "despensa" as const,
        unidadPorDefecto: "kg" as const,
      },
      {
        id: POLLO_ID,
        nombre: "Pollo (test recetas)",
        categoria: "pollo_pavo" as const,
        unidadPorDefecto: "kg" as const,
      },
    ].map((p) => ({ ...p, nombreNormalizado: p.nombre.toLowerCase() })),
  });
  await prisma.receta.create({
    data: {
      id: RECETA_ID,
      slug: "test-arroz-con-pollo",
      nombre: "Arroz con pollo (test)",
      descripcion: "Receta de test del repositorio.",
      raciones: 4,
      minutos: 45,
      etiquetas: ["arroz"],
      pasos: ["Uno.", "Dos."],
      huella: "x",
      ingredientes: {
        create: [
          {
            id: "0199d000-0000-7000-8000-0000000000c1",
            orden: 1,
            nombre: "Pollo",
            productosBaseIds: [POLLO_ID, BORRADO_ID],
            cantidadValor: 0.5,
            cantidadUnidad: "kg",
          },
          {
            id: "0199d000-0000-7000-8000-0000000000c0",
            orden: 0,
            nombre: "Arroz",
            productosBaseIds: [ARROZ_ID],
            cantidadValor: 300,
            cantidadUnidad: "g",
          },
          {
            id: "0199d000-0000-7000-8000-0000000000c2",
            orden: 2,
            nombre: "Sal",
            productosBaseIds: [],
            basico: true,
            nota: "al gusto",
          },
        ],
      },
    },
  });
});

afterAll(async () => {
  await limpiar();
  await prisma.$disconnect();
});

async function limpiar() {
  await prisma.receta.deleteMany({ where: { id: RECETA_ID } });
  await prisma.productoBase.deleteMany({ where: { id: { in: [ARROZ_ID, POLLO_ID] } } });
}

describe("PrismaRecetaRepository", () => {
  const repo = new PrismaRecetaRepository();

  it("findById devuelve la receta con los ingredientes en orden y sus productos", async () => {
    const receta = await repo.findById(RECETA_ID);

    expect(receta).toMatchObject({
      slug: "test-arroz-con-pollo",
      raciones: 4,
      pasos: ["Uno.", "Dos."],
    });
    expect(receta?.ingredientes.map((i) => i.nombre)).toEqual(["Arroz", "Pollo", "Sal"]);
    expect(receta?.ingredientes[0]?.cantidad).toMatchObject({ valor: 300, unidad: "g" });
    // El producto borrado de la lista base se ignora.
    expect(receta?.ingredientes[1]?.productos).toEqual([
      { id: POLLO_ID, nombre: "Pollo (test recetas)", nombreNormalizado: "pollo (test recetas)" },
    ]);
    expect(receta?.ingredientes[2]).toMatchObject({
      basico: true,
      cantidad: null,
      nota: "al gusto",
    });
  });

  it("listar incluye la receta", async () => {
    const recetas = await repo.listar();

    expect(recetas.find((r) => r.id === RECETA_ID)?.ingredientes).toHaveLength(3);
  });

  it("findById de una receta que no existe devuelve null", async () => {
    expect(await repo.findById("0199d000-0000-7000-8000-0000000000ff")).toBeNull();
  });
});
