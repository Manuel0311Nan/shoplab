import { describe, expect, it } from "vitest";
import { AHORA } from "../../testing/builders";
import type { ListasCaducadasRepository } from "../ports/listas-caducadas-repository";
import { PurgeExpiredListsCommand } from "./purge-expired-lists.command";

describe("PurgeExpiredListsCommand", () => {
  it("execute_MarcaLasArchivadasHace15DiasODesde", async () => {
    const llamadas: [Date, Date][] = [];
    const repo: ListasCaducadasRepository = {
      marcarBorradas: async (limite, ahora) => {
        llamadas.push([limite, ahora]);
        return 3;
      },
    };

    const result = await new PurgeExpiredListsCommand(repo, { now: () => AHORA }).execute();

    expect(result).toEqual({ ok: true, value: { borradas: 3 } });
    expect(llamadas).toEqual([[new Date(AHORA.getTime() - 15 * 24 * 60 * 60_000), AHORA]]);
  });
});
