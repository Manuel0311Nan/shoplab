-- CreateTable
CREATE TABLE "EmojiProducto" (
    "hogarId" UUID NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmojiProducto_pkey" PRIMARY KEY ("hogarId","nombreNormalizado")
);

-- AddForeignKey
ALTER TABLE "EmojiProducto" ADD CONSTRAINT "EmojiProducto_hogarId_fkey" FOREIGN KEY ("hogarId") REFERENCES "Hogar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
