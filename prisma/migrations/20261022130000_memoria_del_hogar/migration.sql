-- CreateTable
CREATE TABLE "PackRecordado" (
    "hogarId" UUID NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "unidadesPorPack" INTEGER NOT NULL,
    "enPack" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackRecordado_pkey" PRIMARY KEY ("hogarId","nombreNormalizado")
);

-- CreateTable
CREATE TABLE "UbicacionRecordada" (
    "hogarId" UUID NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "ubicacionId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UbicacionRecordada_pkey" PRIMARY KEY ("hogarId","nombreNormalizado")
);

-- CreateIndex
CREATE INDEX "UbicacionRecordada_ubicacionId_idx" ON "UbicacionRecordada"("ubicacionId");

-- AddForeignKey
ALTER TABLE "PackRecordado" ADD CONSTRAINT "PackRecordado_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionRecordada" ADD CONSTRAINT "UbicacionRecordada_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionRecordada" ADD CONSTRAINT "UbicacionRecordada_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
