import nextEnv from "@next/env";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEV_ACCOUNT_ID,
  DEV_EMAIL,
  DEV_HOGAR_ID,
  DEV_LISTA_ID,
  DEV_PASSWORD,
  DEV_USER_ID,
} from "../src/shared/kernel/dev-identity";
import { sembrarListaBase } from "./seed-lista-base";

const { loadEnvConfig } = nextEnv;
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
    // Si ya existía con el email antiguo (dev@shoplab.local), se actualiza.
    update: { email: DEV_EMAIL },
    create: { id: DEV_USER_ID, email: DEV_EMAIL, nombre: "Usuario de desarrollo" },
  });

  // Cuenta de email y contraseña, como la crearía Better Auth al registrarse
  // (providerId "credential", accountId = id del usuario, hash scrypt).
  await prisma.account.upsert({
    where: { id: DEV_ACCOUNT_ID },
    update: { password: await hashPassword(DEV_PASSWORD) },
    create: {
      id: DEV_ACCOUNT_ID,
      usuarioId: DEV_USER_ID,
      accountId: DEV_USER_ID,
      providerId: "credential",
      password: await hashPassword(DEV_PASSWORD),
    },
  });

  await prisma.miembroHogar.upsert({
    where: { hogarId_usuarioId: { hogarId: DEV_HOGAR_ID, usuarioId: DEV_USER_ID } },
    update: {},
    create: { hogarId: DEV_HOGAR_ID, usuarioId: DEV_USER_ID },
  });

  await prisma.shoppingList.upsert({
    where: { id: DEV_LISTA_ID },
    update: {},
    create: { id: DEV_LISTA_ID, hogarId: DEV_HOGAR_ID, nombre: "Lista de la compra" },
  });

  await sembrarListaBase(prisma);

  console.log(`Seed completado. Entra con ${DEV_EMAIL} / ${DEV_PASSWORD}`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
