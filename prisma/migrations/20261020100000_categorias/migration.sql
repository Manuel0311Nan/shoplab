-- Categorías en la lista y memoria de productos del hogar (vista 3, primera parte).
-- Escrita a mano a partir de schema.prisma: el job `migrations` de la CI
-- comprueba que no hay drift entre ambos.

-- AlterTable
ALTER TABLE "ProductoBase" ADD COLUMN     "sinonimos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ShoppingItem" ADD COLUMN     "categoria" "CategoriaProducto" NOT NULL DEFAULT 'otros';

-- CreateTable
CREATE TABLE "ProductoRecordado" (
    "hogarId" UUID NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaProducto" NOT NULL,
    "unidad" "Unidad" NOT NULL,
    "usos" INTEGER NOT NULL DEFAULT 1,
    "ultimoUso" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoRecordado_pkey" PRIMARY KEY ("hogarId","nombreNormalizado")
);

-- AddForeignKey
ALTER TABLE "ProductoRecordado" ADD CONSTRAINT "ProductoRecordado_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Datos: las líneas vinculadas a la lista base toman su categoría; el resto, otros.
UPDATE "ShoppingItem" AS si
SET "categoria" = pb."categoria"
FROM "ProductoBase" AS pb
WHERE si."productoBaseId" = pb."id";
