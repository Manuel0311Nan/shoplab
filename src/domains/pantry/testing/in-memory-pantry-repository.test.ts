import { InMemoryPantryRepository } from "./in-memory-pantry-repository";
import { pantryRepositoryContract } from "./pantry-repository.contract";

pantryRepositoryContract("en memoria", async (inicial) => new InMemoryPantryRepository(inicial));
