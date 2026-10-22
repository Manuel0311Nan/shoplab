/** Emojis elegidos por el hogar del AuthContext, por nombre normalizado. */
export interface EmojiProductoRepository {
  buscar(nombreNormalizado: string): Promise<string | null>;
  /** Todos los del hogar: nombre normalizado → emoji. */
  listar(): Promise<ReadonlyMap<string, string>>;
  guardar(nombreNormalizado: string, emoji: string): Promise<void>;
  borrar(nombreNormalizado: string): Promise<void>;
}
