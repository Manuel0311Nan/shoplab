import { describe, expect, it } from "vitest";
import { hogar } from "./builders";
import { householdRepositoryContract } from "./household-repository.contract";
import { InMemoryHouseholdRepository } from "./in-memory-household-repository";

householdRepositoryContract(
  "en memoria",
  async (inicial) => new InMemoryHouseholdRepository(inicial),
);

describe("InMemoryHouseholdRepository", () => {
  it("crear_FundadorInexistente_LanzaComoLaClaveForanea", async () => {
    const repo = new InMemoryHouseholdRepository();

    await expect(repo.crear(hogar())).rejects.toThrow("clave foránea");
  });
});
