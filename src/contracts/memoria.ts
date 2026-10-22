/**
 * Memoria del hogar que usan los formularios (no es API pública): se lee en el servidor
 * y viaja a la pantalla como mapas por nombre normalizado (normalizarNombre).
 */

/** Cómo se compra un producto por packs. */
export interface PackRecordadoDto {
  readonly unidadesPorPack: number;
  /** ¿La última vez fue por packs? Entonces se propone «pack» directamente. */
  readonly enPack: boolean;
}

export type PacksRecordados = Readonly<Record<string, PackRecordadoDto>>;

/** Nombre normalizado → emoji elegido por el hogar (manda sobre el de por defecto). */
export type EmojisProductos = Readonly<Record<string, string>>;

/** Nombre normalizado → id de la ubicación donde se guardó la última vez. */
export type UbicacionesRecordadas = Readonly<Record<string, string>>;
