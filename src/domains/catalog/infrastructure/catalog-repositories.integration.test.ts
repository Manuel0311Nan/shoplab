import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LECHE, PLATANO, PLATANO_ID } from "@/domains/catalog/testing/builders";
import { productoRecordadoRepositoryContract } from "@/domains/catalog/testing/producto-recordado-repository.contract";
import { prisma } from "@/shared/kernel/prisma";
import { normalizarNombre } from "@/shared/kernel/texto";
import { PrismaProductoBaseRepository } from "./prisma-producto-base-repository";
import { PrismaProductoRecordadoRepository } from "./prisma-producto-recordado-repository";

const HOGAR_ID = "0199c000-0000-7000-8000-0000000000d1";
const OTRO_HOGAR_ID = "0199c000-0000-7000-8000-0000000000d2";
const PRODUCTOS = [PLATANO, LECHE];

beforeAll(async () => {
  await prisma.hogar.createMany({
    data: [
      { id: HOGAR_ID, nombre: "Hogar de test (catálogo)" },
      { id: OTRO_HOGAR_ID, nombre: "Otro hogar de test (catálogo)" },
    ],
    skipDuplicates: true,
  });
  await prisma.productoBase.deleteMany({ where: { id: { in: PRODUCTOS.map((p) => p.id) } } });
  await prisma.productoBase.createMany({
    data: PRODUCTOS.map(({ sinonimos, ...p }) => ({
      ...p,
      // Nombres de test que no chocan con la lista base sembrada en la rama de test.
      nombre: `${p.nombre} (test)`,
      nombreNormalizado: normalizarNombre(`${p.nombre} (test)`),
      sinonimos: (sinonimos ?? []).map((s) => normalizarNombre(`${s} (test)`)),
    })),
  });
});

afterAll(async () => {
  await prisma.productoBase.deleteMany({ where: { id: { in: PRODUCTOS.map((p) => p.id) } } });
  await prisma.hogar.deleteMany({ where: { id: { in: [HOGAR_ID, OTRO_HOGAR_ID] } } });
  await prisma.$disconnect();
});

productoRecordadoRepositoryContract("Prisma", async (iniciales) => {
  await prisma.productoRecordado.deleteMany({ where: { hogarId: HOGAR_ID } });
  const repo = new PrismaProductoRecordadoRepository({ hogarId: HOGAR_ID });
  for (const p of iniciales) await repo.guardar(p);
  return repo;
});

describe("PrismaProductoRecordadoRepository: aislamiento entre hogares", () => {
  it("buscar_RecuerdoDeOtroHogar_DevuelveNull", async () => {
    await new PrismaProductoRecordadoRepository({ hogarId: OTRO_HOGAR_ID }).guardar({
      nombreNormalizado: "solo del otro",
      nombre: "Solo del otro",
      categoria: "otros",
      unidad: "unidad",
      usos: 1,
      ultimoUso: new Date(),
    });

    const repo = new PrismaProductoRecordadoRepository({ hogarId: HOGAR_ID });
    expect(await repo.buscar("solo del otro")).toBeNull();
  });
});

describe("PrismaProductoBaseRepository", () => {
  const repo = new PrismaProductoBaseRepository();

  it("buscarPorNombre_NombreYSinonimo_EncuentranElProducto", async () => {
    expect((await repo.buscarPorNombre("platano de canarias (test)"))?.id).toBe(PLATANO_ID);
    expect((await repo.buscarPorNombre("banana (test)"))?.id).toBe(PLATANO_ID);
    expect(await repo.buscarPorNombre("no existe (test)")).toBeNull();
  });

  it("findById_DevuelveElProductoSinSinonimos", async () => {
    expect(await repo.findById(PLATANO_ID)).toEqual({
      id: PLATANO_ID,
      nombre: "Plátano de Canarias (test)",
      categoria: "frutas",
      unidadPorDefecto: "kg",
    });
  });
});
