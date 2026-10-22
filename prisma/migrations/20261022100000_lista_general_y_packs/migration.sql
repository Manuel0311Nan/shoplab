-- Lista general por hogar (agrupa todas las listas activas) y packs en la lista.
-- Escrita a mano a partir de schema.prisma.

-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN     "general" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ShoppingItem" ADD COLUMN     "unidadesPorPack" INTEGER;

-- Una lista general para cada hogar que ya existía.
INSERT INTO "ShoppingList" ("id", "hogarId", "nombre", "general", "createdAt", "updatedAt")
SELECT gen_random_uuid(), h."id", 'Lista general', true, NOW(), NOW()
FROM "Hogar" h
WHERE NOT EXISTS (
    SELECT 1 FROM "ShoppingList" l
    WHERE l."hogarId" = h."id" AND l."general" = true AND l."deletedAt" IS NULL
);
