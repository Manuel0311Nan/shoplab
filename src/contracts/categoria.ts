import { z } from "zod";

/** Las del kernel, en el orden del súper; el test de paridad lo comprueba. */
export const categoriaSchema = z.enum([
  "frutas",
  "verduras",
  "vacuno",
  "pollo_pavo",
  "cerdo_cordero",
  "charcuteria",
  "pescado",
  "lacteos_huevos",
  "panaderia",
  "despensa",
  "especias",
  "bebidas",
  "congelados",
  "limpieza",
  "higiene",
  "otros",
]);

export type CategoriaDto = z.infer<typeof categoriaSchema>;
