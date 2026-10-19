-- Nuevo valor del enum en su propia migración: Postgres no deja usar un valor
-- añadido en la misma transacción (aquí, como DEFAULT de ShoppingItem.categoria).

-- AlterEnum
ALTER TYPE "CategoriaProducto" ADD VALUE 'otros';
