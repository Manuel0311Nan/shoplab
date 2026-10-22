import { esEmoji } from "@/shared/kernel/emoji";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import type { EmojiProductoRepository } from "../ports/emoji-producto-repository";

export interface CambiarEmojiInput {
  readonly nombre: string;
  /** null: vuelve al de por defecto (o al icono de la categoría). */
  readonly emoji: string | null;
}

/** Personalizar con qué emoji ve el hogar un producto (de la lista base o escrito a mano). */
export class CambiarEmojiCommand {
  constructor(private readonly emojis: EmojiProductoRepository) {}

  async execute(input: CambiarEmojiInput): Promise<Result<void>> {
    const nombreNormalizado = normalizarNombre(input.nombre);
    if (nombreNormalizado === "") {
      return err(validationError("NOMBRE_NO_VALIDO", "El nombre no puede estar vacío"));
    }
    if (input.emoji === null) {
      await this.emojis.borrar(nombreNormalizado);
      return ok(undefined);
    }
    if (!esEmoji(input.emoji)) {
      return err(validationError("EMOJI_NO_VALIDO", "Elige un solo emoji"));
    }
    await this.emojis.guardar(nombreNormalizado, input.emoji.trim());
    return ok(undefined);
  }
}

/** Los emojis que ha elegido el hogar: la pantalla los usa antes que los de por defecto. */
export class ListEmojisQuery {
  constructor(private readonly emojis: EmojiProductoRepository) {}

  async execute(): Promise<Result<ReadonlyMap<string, string>>> {
    return ok(await this.emojis.listar());
  }
}
