import { normalizarNombre } from "@/shared/kernel/texto";
import type { Sugerencia } from "./sugerencia";

export const MAX_SUGERENCIAS = 8;

interface Indexada {
  readonly sugerencia: Sugerencia;
  readonly normalizado: string;
}

/** Normaliza una vez cada nombre: se filtra en cada tecla sobre unos cientos de opciones. */
export function indexarSugerencias(sugerencias: readonly Sugerencia[]): Indexada[] {
  return sugerencias.map((sugerencia) => ({
    sugerencia,
    normalizado: normalizarNombre(sugerencia.nombre),
  }));
}

/**
 * Sugerencias para lo escrito, sin tildes ni mayúsculas. Primero las que empiezan por el
 * texto, luego las que tienen una palabra que empieza por él y por último las que lo
 * contienen. Dentro de cada grupo: lo del hogar más usado, y después los nombres más
 * cortos (suelen ser los genéricos).
 */
export function filtrarSugerencias(
  indice: readonly Indexada[],
  texto: string,
  max = MAX_SUGERENCIAS,
): Sugerencia[] {
  const buscado = normalizarNombre(texto);
  if (buscado === "") return [];

  const puntuadas: { sugerencia: Sugerencia; puntos: number; largo: number }[] = [];
  for (const { sugerencia, normalizado } of indice) {
    const puntos = normalizado.startsWith(buscado)
      ? 0
      : normalizado.includes(` ${buscado}`)
        ? 1
        : normalizado.includes(buscado)
          ? 2
          : -1;
    if (puntos >= 0) puntuadas.push({ sugerencia, puntos, largo: normalizado.length });
  }

  return puntuadas
    .sort(
      (a, b) => a.puntos - b.puntos || b.sugerencia.usos - a.sugerencia.usos || a.largo - b.largo,
    )
    .slice(0, max)
    .map((p) => p.sugerencia);
}
