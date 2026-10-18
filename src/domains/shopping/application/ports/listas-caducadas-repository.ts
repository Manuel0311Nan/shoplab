/**
 * Limpieza diaria, para todos los hogares a la vez (no es un repositorio de tenant:
 * lo usa solo el cron, que no tiene sesión).
 */
export interface ListasCaducadasRepository {
  /** Marca como borradas las archivadas antes de `limite`. Devuelve cuántas. */
  marcarBorradas(limite: Date, ahora: Date): Promise<number>;
}
