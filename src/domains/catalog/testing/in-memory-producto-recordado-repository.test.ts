import { InMemoryProductoRecordadoRepository } from "./in-memory-producto-recordado-repository";
import { productoRecordadoRepositoryContract } from "./producto-recordado-repository.contract";

productoRecordadoRepositoryContract(
  "en memoria",
  async (iniciales) => new InMemoryProductoRecordadoRepository(iniciales),
);
