import type { AvisoAbierto } from "@/shared/kernel/abierto";
import type { Categoria } from "@/shared/kernel/categoria";

/**
 * Cuántos días puede estar abierto un producto antes de avisar. Lo sabe el catálogo
 * (excepciones por producto); Pantry no lo importa: se lo pasa el orquestador.
 */
export interface AvisosAbierto {
  /** null: el producto no se «abre» (fruta, verdura, limpieza…). */
  para(productoBaseId: string | null, categoria: Categoria): Promise<AvisoAbierto | null>;
}
