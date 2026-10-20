import type { RecetaRepository } from "@/domains/recipes/application/ports/receta-repository";
import type { Receta } from "@/domains/recipes/domain/receta";

export class InMemoryRecetaRepository implements RecetaRepository {
  constructor(private readonly recetas: readonly Receta[] = []) {}

  async listar(): Promise<Receta[]> {
    return [...this.recetas];
  }

  async findById(id: string): Promise<Receta | null> {
    return this.recetas.find((r) => r.id === id) ?? null;
  }
}
