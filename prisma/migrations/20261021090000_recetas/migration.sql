-- Recetas (vista 4): biblioteca global de recetas y sus ingredientes.
-- Escrita a mano a partir de schema.prisma: el job `migrations` de la CI
-- comprueba que no hay drift entre ambos. Los datos los carga el seed.

-- CreateTable
CREATE TABLE "Receta" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "raciones" INTEGER NOT NULL,
    "minutos" INTEGER NOT NULL,
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pasos" TEXT[],
    "huella" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaIngrediente" (
    "id" UUID NOT NULL,
    "recetaId" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "productosBaseIds" UUID[],
    "cantidadValor" DECIMAL(10,3),
    "cantidadUnidad" "Unidad",
    "nota" TEXT,
    "basico" BOOLEAN NOT NULL DEFAULT false,
    "opcional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RecetaIngrediente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Receta_slug_key" ON "Receta"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RecetaIngrediente_recetaId_orden_key" ON "RecetaIngrediente"("recetaId", "orden");

-- AddForeignKey
ALTER TABLE "RecetaIngrediente" ADD CONSTRAINT "RecetaIngrediente_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
