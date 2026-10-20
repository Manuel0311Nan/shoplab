-- Paquetes abiertos en la despensa: día de apertura y aviso (verde, amarillo, rojo)
-- según los días que lleva abierto. Escrita a mano a partir de schema.prisma.

-- AlterTable
ALTER TABLE "ProductoBase" ADD COLUMN     "diasAvisoAmarillo" INTEGER,
ADD COLUMN     "diasAvisoRojo" INTEGER;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "abiertoEl" DATE,
ADD COLUMN     "avisoAbiertoAmarillo" INTEGER,
ADD COLUMN     "avisoAbiertoRojo" INTEGER;
