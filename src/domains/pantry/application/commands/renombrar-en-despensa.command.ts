import { nombreDeProducto } from "@/domains/pantry/domain/inventory-item";
import type { Categoria } from "@/shared/kernel/categoria";
import type { Clock } from "@/shared/kernel/clock";
import { ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import { Despensa } from "../despensa";
import type { PantryRepository } from "../ports/pantry-repository";

export interface RenombrarEnDespensaInput {
  /** Nombre normalizado de lo que se renombra. */
  readonly desde: string;
  readonly nombre: string;
  readonly productoBaseId: string | null;
  readonly categoria: Categoria;
  readonly usuarioId: string;
}

/**
 * Estandarizar un producto del hogar en la despensa: las líneas que se llaman `desde`
 * se renombran (y se juntan con las iguales) y la ubicación recordada pasa al nombre
 * nuevo si allí no había otra. Todo en una transacción. Devuelve cuántas líneas.
 */
export class RenombrarEnDespensaCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RenombrarEnDespensaInput): Promise<Result<number>> {
    const nombre = nombreDeProducto(input.nombre);
    if (!nombre.ok) return nombre;
    const hacia = normalizarNombre(nombre.value);

    const [lineas, ubicaciones, recordadas] = await Promise.all([
      this.despensa.listarLineas(),
      this.despensa.listarUbicaciones(),
      this.despensa.ubicacionesRecordadas(),
    ]);
    const ahora = this.clock.now();
    const despensa = new Despensa(
      lineas,
      ubicaciones.map((u) => u.toSnapshot()),
      recordadas,
    );

    const afectadas = lineas.filter((l) => l.clave().nombreNormalizado === input.desde);
    for (const linea of afectadas) {
      linea.renombrar(nombre.value, input.productoBaseId, ahora);
      linea.cambiarCategoria(input.categoria, ahora);
      despensa.registrar(linea);
      const queda = despensa.juntarSiCoincide(linea, input.usuarioId, ahora);
      if (!queda.ok) return queda;
    }

    const recordada = recordadas.get(input.desde);
    const moverMemoria = input.desde !== hacia && recordada !== undefined;
    if (moverMemoria && !recordadas.has(hacia)) despensa.recordarUbicacion(nombre.value, recordada);

    if (afectadas.length > 0 || moverMemoria) {
      await this.despensa.guardar({
        lineas: despensa.lineasCambiadas(),
        movimientos: despensa.movimientos,
        recordar: despensa.ubicacionesARecordar(),
        ...(moverMemoria ? { olvidar: [input.desde] } : {}),
      });
    }
    return ok(afectadas.length);
  }
}
