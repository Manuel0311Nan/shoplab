import { emojiProductoRepositoryContract } from "./emoji-producto-repository.contract";
import { InMemoryEmojiProductoRepository } from "./in-memory-emoji-producto-repository";

emojiProductoRepositoryContract(
  "en memoria",
  async (iniciales) => new InMemoryEmojiProductoRepository(iniciales),
);
