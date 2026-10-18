import type { ProductoBaseResponse } from "@/contracts/catalog";
import { normalizarNombre } from "@/shared/kernel/texto";

export const MAX_SUGERENCIAS = 8;

interface Indexado {
  readonly producto: ProductoBaseResponse;
  readonly normalizado: string;
}

/** Normaliza una vez cada nombre: se filtra en cada tecla sobre unos cientos de productos. */
export function indexarProductos(productos: readonly ProductoBaseResponse[]): Indexado[] {
  return productos.map((producto) => ({
    producto,
    normalizado: normalizarNombre(producto.nombre),
  }));
}

/**
 * Sugerencias para lo escrito, sin tildes ni mayúsculas. Primero los que empiezan por
 * el texto («pollo» → «Pollo entero»), luego los que tienen una palabra que empieza por
 * él («pechuga de pollo»), y por último los que lo contienen. Dentro de cada grupo,
 * los nombres más cortos primero: suelen ser los genéricos.
 */
export function filtrarProductos(
  indice: readonly Indexado[],
  texto: string,
  max = MAX_SUGERENCIAS,
): ProductoBaseResponse[] {
  const buscado = normalizarNombre(texto);
  if (buscado === "") return [];

  const puntuados: { producto: ProductoBaseResponse; puntos: number; largo: number }[] = [];
  for (const { producto, normalizado } of indice) {
    const puntos = normalizado.startsWith(buscado)
      ? 0
      : normalizado.includes(` ${buscado}`)
        ? 1
        : normalizado.includes(buscado)
          ? 2
          : -1;
    if (puntos >= 0) puntuados.push({ producto, puntos, largo: normalizado.length });
  }

  return puntuados
    .sort((a, b) => a.puntos - b.puntos || a.largo - b.largo)
    .slice(0, max)
    .map((p) => p.producto);
}
