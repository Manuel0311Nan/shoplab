import { afterAll, beforeEach } from "vitest";
import { householdRepositoryContract } from "@/domains/households/testing/household-repository.contract";
import { HOGAR_ID, OTRO_HOGAR_ID, USUARIO_ID } from "@/domains/households/testing/builders";
import { prisma } from "@/shared/kernel/prisma";
import { PrismaHouseholdRepository } from "./prisma-household-repository";

const HOGARES = [HOGAR_ID, OTRO_HOGAR_ID];

async function limpiar(): Promise<void> {
  // onDelete: Cascade borra también sus miembros.
  await prisma.hogar.deleteMany({ where: { id: { in: HOGARES } } });
  await prisma.usuario.deleteMany({ where: { id: USUARIO_ID } });
}

beforeEach(limpiar);

afterAll(async () => {
  await limpiar();
  await prisma.$disconnect();
});

householdRepositoryContract("Prisma", async ({ usuarios, hogares }) => {
  for (const id of usuarios) {
    await prisma.usuario.create({ data: { id, email: `${id}@test.local`, nombre: "Test" } });
  }
  const repo = new PrismaHouseholdRepository();
  for (const h of hogares) await repo.crear(h);
  return repo;
});
