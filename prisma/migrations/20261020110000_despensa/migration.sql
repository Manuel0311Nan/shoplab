-- Despensa (vista 3): ubicaciones del hogar, líneas y movimientos.
-- Escrita a mano a partir de schema.prisma: el job `migrations` de la CI
-- comprueba que no hay drift entre ambos.

-- CreateEnum
CREATE TYPE "TipoUbicacion" AS ENUM ('frio', 'congelado', 'ambiente');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('entrada', 'consumo', 'desecho', 'ajuste', 'baja');

-- CreateEnum
CREATE TYPE "OrigenMovimiento" AS ENUM ('manual', 'compra');

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" UUID NOT NULL,
    "hogarId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoUbicacion" NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL,
    "hogarId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "productoBaseId" UUID,
    "categoria" "CategoriaProducto" NOT NULL,
    "ubicacionId" UUID NOT NULL,
    "cantidadValor" DECIMAL(10,3) NOT NULL,
    "cantidadUnidad" "Unidad" NOT NULL,
    "cantidadReferencia" DECIMAL(10,3) NOT NULL,
    "caducaEl" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoDespensa" (
    "id" UUID NOT NULL,
    "hogarId" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidadValor" DECIMAL(10,3) NOT NULL,
    "cantidadUnidad" "Unidad" NOT NULL,
    "origen" "OrigenMovimiento" NOT NULL,
    "listaId" UUID,
    "usuarioId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoDespensa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ubicacion_hogarId_deletedAt_orden_idx" ON "Ubicacion"("hogarId", "deletedAt", "orden");

-- CreateIndex
CREATE INDEX "InventoryItem_hogarId_deletedAt_ubicacionId_idx" ON "InventoryItem"("hogarId", "deletedAt", "ubicacionId");

-- CreateIndex
CREATE INDEX "InventoryItem_hogarId_deletedAt_caducaEl_idx" ON "InventoryItem"("hogarId", "deletedAt", "caducaEl");

-- CreateIndex
CREATE INDEX "MovimientoDespensa_inventoryItemId_createdAt_idx" ON "MovimientoDespensa"("inventoryItemId", "createdAt");

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productoBaseId_fkey" FOREIGN KEY ("productoBaseId") REFERENCES "ProductoBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoDespensa" ADD CONSTRAINT "MovimientoDespensa_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoDespensa" ADD CONSTRAINT "MovimientoDespensa_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoDespensa" ADD CONSTRAINT "MovimientoDespensa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Datos: Nevera, Congelador y Armario para los hogares que ya existen (D3). Los
-- nuevos las reciben en el alta del hogar.
INSERT INTO "Ubicacion" ("id", "hogarId", "nombre", "tipo", "orden", "updatedAt")
SELECT gen_random_uuid(), h."id", v.nombre, v.tipo::"TipoUbicacion", v.orden, CURRENT_TIMESTAMP
FROM "Hogar" AS h
CROSS JOIN (VALUES ('Nevera', 'frio', 1), ('Congelador', 'congelado', 2), ('Armario', 'ambiente', 3))
  AS v (nombre, tipo, orden);
