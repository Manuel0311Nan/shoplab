/**
 * Paso que se ve en un carrusel con scroll-snap de diapositivas a ancho completo:
 * el más cercano a la posición del scroll.
 */
export function pasoVisible(scrollLeft: number, ancho: number, total: number): number {
  if (ancho <= 0 || total <= 0) return 0;
  return limitar(Math.round(scrollLeft / ancho), total);
}

/** Paso anterior (-1) o siguiente (1), sin salirse de los extremos. */
export function pasoVecino(actual: number, direccion: -1 | 1, total: number): number {
  if (total <= 0) return 0;
  return limitar(actual + direccion, total);
}

function limitar(paso: number, total: number): number {
  return Math.min(total - 1, Math.max(0, paso));
}
