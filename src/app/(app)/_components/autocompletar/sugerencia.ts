import type { CategoriaDto } from "@/contracts/categoria";
import type { UnidadDto } from "@/contracts/shopping";

/** Una opción del autocompletado: de la lista base o de la memoria del hogar (D1). */
export interface Sugerencia {
  /** Única en la lista: el id del producto base o "hogar:<nombre normalizado>". */
  readonly clave: string;
  readonly nombre: string;
  readonly categoria: CategoriaDto;
  readonly unidad: UnidadDto;
  readonly productoBaseId: string | null;
  readonly origen: "base" | "hogar";
  /** Veces que el hogar lo ha usado (0 en la lista base). */
  readonly usos: number;
}
