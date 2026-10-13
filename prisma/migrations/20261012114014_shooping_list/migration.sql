-- CreateEnum
CREATE TYPE "Unidad" AS ENUM ('unidad', 'g', 'kg', 'ml', 'l');

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" UUID NOT NULL,
    "hogarId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "archivadaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" UUID NOT NULL,
    "hogarId" UUID NOT NULL,
    "listaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "ingredientId" UUID,
    "cantidadValor" DECIMAL(10,3) NOT NULL,
    "cantidadUnidad" "Unidad" NOT NULL,
    "nota" TEXT,
    "compradoAt" TIMESTAMP(3),
    "compradoPorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingList_hogarId_updatedAt_idx" ON "ShoppingList"("hogarId", "updatedAt");

-- CreateIndex
CREATE INDEX "ShoppingItem_listaId_deletedAt_idx" ON "ShoppingItem"("listaId", "deletedAt");

-- CreateIndex
CREATE INDEX "ShoppingItem_hogarId_updatedAt_idx" ON "ShoppingItem"("hogarId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_compradoPorId_fkey" FOREIGN KEY ("compradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
