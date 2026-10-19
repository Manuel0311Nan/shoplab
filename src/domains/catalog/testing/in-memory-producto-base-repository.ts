import type { ProductoBaseRepository } from "@/domains/catalog/application/ports/producto-base-repository";
import { compararProductos, type ProductoBase } from "@/domains/catalog/domain/producto-base";
import { normalizarNombre } from "@/shared/kernel/texto";

export type ProductoBaseConSinonimos = ProductoBase & { readonly sinonimos?: readonly string[] };

export class InMemoryProductoBaseRepository implements ProductoBaseRepository {
  constructor(private readonly productos: readonly ProductoBaseConSinonimos[] = []) {}

  async listar(): Promise<ProductoBase[]> {
    return this.productos.map(sinSinonimos).sort(compararProductos);
  }

  async findById(id: string): Promise<ProductoBase | null> {
    const p = this.productos.find((x) => x.id === id);
    return p ? sinSinonimos(p) : null;
  }

  async buscarPorNombre(nombreNormalizado: string): Promise<ProductoBase | null> {
    const p = this.productos.find(
      (x) =>
        normalizarNombre(x.nombre) === nombreNormalizado ||
        (x.sinonimos ?? []).some((s) => normalizarNombre(s) === nombreNormalizado),
    );
    return p ? sinSinonimos(p) : null;
  }
}

function sinSinonimos({
  id,
  nombre,
  categoria,
  unidadPorDefecto,
}: ProductoBaseConSinonimos): ProductoBase {
  return { id, nombre, categoria, unidadPorDefecto };
}
