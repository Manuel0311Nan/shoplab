export const UNIDADES = ["unidad", "g", "kg", "ml", "l"] as const;

export type Unidad = (typeof UNIDADES)[number];

export function esUnidad(valor: string): valor is Unidad {
  return (UNIDADES as readonly string[]).includes(valor);
}
