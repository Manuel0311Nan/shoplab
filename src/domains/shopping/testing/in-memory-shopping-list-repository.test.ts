import { InMemoryShoppingListRepository } from "./in-memory-shopping-list-repository";
import { shoppingListRepositoryContract } from "./shopping-list-repository.contract";

shoppingListRepositoryContract(
  "en memoria",
  async (listas, clock) => new InMemoryShoppingListRepository(listas, clock),
);
