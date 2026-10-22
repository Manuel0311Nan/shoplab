import type { PackRecordado } from "@/domains/shopping/domain/pack-recordado";

/** Memoria de packs del hogar del AuthContext. */
export interface PackRecordadoRepository {
  buscar(nombreNormalizado: string): Promise<PackRecordado | null>;
  /** Todos los del hogar (uno por producto). */
  listar(): Promise<PackRecordado[]>;
  /** Crea o reemplaza el de ese nombre. */
  guardar(pack: PackRecordado): Promise<void>;
  borrar(nombreNormalizado: string): Promise<void>;
}
