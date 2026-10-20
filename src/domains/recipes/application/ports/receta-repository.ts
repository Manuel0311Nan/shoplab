import type { Receta } from "@/domains/recipes/domain/receta";

/** Biblioteca global de recetas (sin hogarId): solo lectura desde la app. */
export interface RecetaRepository {
  /** Todas, con sus ingredientes. La biblioteca es pequeña (cientos): se evalúa en memoria. */
  listar(): Promise<Receta[]>;
  findById(id: string): Promise<Receta | null>;
}
