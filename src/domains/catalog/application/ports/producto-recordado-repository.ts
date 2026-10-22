import type { ProductoRecordado } from "@/domains/catalog/domain/producto-recordado";

/** Memoria del hogar del AuthContext. */
export interface ProductoRecordadoRepository {
  buscar(nombreNormalizado: string): Promise<ProductoRecordado | null>;
  /** Lo más usado primero (y, a igualdad, lo último usado). */
  listar(limite: number): Promise<ProductoRecordado[]>;
  /** Crea o reemplaza la entrada de ese nombre. */
  guardar(producto: ProductoRecordado): Promise<void>;
  /** Deja de recordarlo (si no estaba, no hace nada). */
  borrar(nombreNormalizado: string): Promise<void>;
}
