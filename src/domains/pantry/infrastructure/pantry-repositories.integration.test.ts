import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pantryRepositoryContract } from "@/domains/pantry/testing/pantry-repository.contract";
import {
  linea,
  LINEA_ID,
  ubicacionesPorDefecto,
  USUARIO_ID,
} from "@/domains/pantry/testing/builders";
import { prisma } from "@/shared/kernel/prisma";
import { PrismaPantryRepository } from "./prisma-pantry-repository";

const HOGAR_ID = "0199c000-0000-7000-8000-0000000000b1";
const OTRO_HOGAR_ID = "0199c000-0000-7000-8000-0000000000b2";
const PRODUCTO_BASE_ID = "0199c000-0000-7000-8000-0000000000f9";

beforeAll(async () => {
  await prisma.hogar.createMany({
    data: [
      { id: HOGAR_ID, nombre: "Hogar de test (despensa)" },
      { id: OTRO_HOGAR_ID, nombre: "Otro hogar de test (despensa)" },
    ],
    skipDuplicates: true,
  });
  await prisma.usuario.upsert({
    where: { id: USUARIO_ID },
    create: { id: USUARIO_ID, email: "contrato-pantry@migas.test", nombre: "Usuario de test" },
    update: {},
  });
  await prisma.productoBase.upsert({
    where: { id: PRODUCTO_BASE_ID },
    create: {
      id: PRODUCTO_BASE_ID,
      nombre: "Leche (test despensa)",
      nombreNormalizado: "leche (test despensa)",
      categoria: "lacteos_huevos",
      unidadPorDefecto: "l",
    },
    update: {},
  });
});

afterAll(async () => {
  await prisma.hogar.deleteMany({ where: { id: { in: [HOGAR_ID, OTRO_HOGAR_ID] } } });
  await prisma.productoBase.deleteMany({ where: { id: PRODUCTO_BASE_ID } });
  await prisma.usuario.deleteMany({ where: { id: USUARIO_ID } });
  await prisma.$disconnect();
});

async function limpiar(hogarId: string) {
  await prisma.movimientoDespensa.deleteMany({ where: { hogarId } });
  await prisma.inventoryItem.deleteMany({ where: { hogarId } });
  await prisma.ubicacion.deleteMany({ where: { hogarId } });
}

pantryRepositoryContract("Prisma", async ({ ubicaciones, lineas }) => {
  await limpiar(HOGAR_ID);
  const repo = new PrismaPantryRepository({ hogarId: HOGAR_ID });
  await repo.guardar({ ubicaciones, lineas });
  return repo;
});

describe("PrismaPantryRepository: aislamiento entre hogares", () => {
  it("findLinea_LineaDeOtroHogar_DevuelveNull", async () => {
    await limpiar(HOGAR_ID);
    await new PrismaPantryRepository({ hogarId: HOGAR_ID }).guardar({
      ubicaciones: ubicacionesPorDefecto(),
      lineas: [linea()],
    });

    const otro = new PrismaPantryRepository({ hogarId: OTRO_HOGAR_ID });
    expect(await otro.findLinea(LINEA_ID)).toBeNull();
    expect(await otro.listarUbicaciones()).toEqual([]);
  });
});
