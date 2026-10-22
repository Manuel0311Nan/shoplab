import { InMemoryPackRecordadoRepository } from "./in-memory-pack-recordado-repository";
import { packRecordadoRepositoryContract } from "./pack-recordado-repository.contract";

packRecordadoRepositoryContract(
  "en memoria",
  async (iniciales) => new InMemoryPackRecordadoRepository(iniciales),
);
