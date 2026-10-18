export interface Membresia {
  readonly hogarId: string;
  readonly createdAt: Date;
}

/**
 * Hogar con el que trabaja el usuario. Hasta decidir cómo se elige entre varios
 * (PENDING del CLAUDE.md), el más antiguo; `null` si aún no tiene ninguno.
 */
export function elegirHogarActivo(membresias: readonly Membresia[]): string | null {
  const ordenadas = [...membresias].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return ordenadas.at(0)?.hogarId ?? null;
}
