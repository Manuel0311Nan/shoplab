-- Mis listas (vista 2): lista base para autocompletar e índice de archivadas.
-- Escrita a mano a partir de schema.prisma: el job `migrations` de la CI
-- comprueba que no hay drift entre ambos.

-- CreateEnum
CREATE TYPE "CategoriaProducto" AS ENUM ('frutas', 'verduras', 'vacuno', 'pollo_pavo', 'cerdo_cordero', 'charcuteria', 'pescado', 'lacteos_huevos', 'panaderia', 'despensa', 'especias', 'bebidas', 'congelados', 'limpieza', 'higiene');

-- AlterTable
ALTER TABLE "ShoppingItem" ADD COLUMN     "productoBaseId" UUID;

-- CreateTable
CREATE TABLE "ProductoBase" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "categoria" "CategoriaProducto" NOT NULL,
    "unidadPorDefecto" "Unidad" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductoBase_nombreNormalizado_key" ON "ProductoBase"("nombreNormalizado");

-- CreateIndex
CREATE INDEX "ShoppingList_hogarId_archivadaAt_updatedAt_idx" ON "ShoppingList"("hogarId", "archivadaAt", "updatedAt");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_productoBaseId_fkey" FOREIGN KEY ("productoBaseId") REFERENCES "ProductoBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
