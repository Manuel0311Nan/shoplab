import { loadEnvConfig } from "@next/env";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEV_HOGAR_ID, DEV_USER_ID } from "../src/shared/kernel/dev-identity";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  await prisma.hogar.upsert({
    where: { id: DEV_HOGAR_ID },
    update: {},
    create: { id: DEV_HOGAR_ID, nombre: "Hogar de desarrollo" },
  });

  await prisma.usuario.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: { id: DEV_USER_ID, email: "dev@shoplab.local", nombre: "Usuario de desarrollo" },
  });

  await prisma.miembroHogar.upsert({
    where: { hogarId_usuarioId: { hogarId: DEV_HOGAR_ID, usuarioId: DEV_USER_ID } },
    update: {},
    create: { hogarId: DEV_HOGAR_ID, usuarioId: DEV_USER_ID },
  });

  console.log("Seed completado: hogar y usuario de desarrollo listos");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}