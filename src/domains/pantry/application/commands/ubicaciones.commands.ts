import { PantryErrors } from "@/domains/pantry/domain/pantry-errors";
import {
  MAX_UBICACIONES,
  mismoNombre,
  Ubicacion,
  UBICACIONES_POR_DEFECTO,
  type UbicacionSnapshot,
} from "@/domains/pantry/domain/ubicacion";
import { esTipoUbicacion } from "@/shared/kernel/categoria";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import { Despensa } from "../despensa";
import type { PantryRepository } from "../ports/pantry-repository";

/** Numera 1, 2, 3… en el orden dado; devuelve las que cambiaron. */
function renumerar(ubicaciones: readonly Ubicacion[], ahora: Date): Ubicacion[] {
  const cambiadas: Ubicacion[] = [];
  ubicaciones.forEach((u, i) => {
    if (u.orden !== i + 1) {
      u.colocarEn(i + 1, ahora);
      cambiadas.push(u);
    }
  });
  return cambiadas;
}

/** Nueva ubicación al final (D3). Máximo 12, sin nombres repetidos. */
export class CreateUbicacionCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    readonly id?: string;
    readonly nombre: string;
    readonly tipo: string;
  }): Promise<Result<UbicacionSnapshot>> {
    if (!esTipoUbicacion(input.tipo)) return err(PantryErrors.tipoNoValido());
    const actuales = await this.despensa.listarUbicaciones();
    // Reintento con el mismo id: ya está creada.
    const existente = actuales.find((u) => u.id === input.id);
    if (existente !== undefined) return ok(existente.toSnapshot());
    if (actuales.length >= MAX_UBICACIONES) {
      return err(PantryErrors.demasiadasUbicaciones(MAX_UBICACIONES));
    }
    if (actuales.some((u) => mismoNombre(u.nombre, input.nombre))) {
      return err(PantryErrors.ubicacionRepetida());
    }

    const ubicacion = Ubicacion.create(
      {
        id: input.id ?? newId(),
        nombre: input.nombre,
        tipo: input.tipo,
        orden: Math.max(0, ...actuales.map((u) => u.orden)) + 1,
      },
      this.clock.now(),
    );
    if (!ubicacion.ok) return ubicacion;
    await this.despensa.guardar({ ubicaciones: [ubicacion.value] });
    return ok(ubicacion.value.toSnapshot());
  }
}

/** Renombrar, cambiar el tipo o mover a otra posición (1 = la primera). */
export class UpdateUbicacionCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    readonly id: string;
    readonly nombre?: string;
    readonly tipo?: string;
    readonly posicion?: number;
  }): Promise<Result<UbicacionSnapshot>> {
    if (input.nombre === undefined && input.tipo === undefined && input.posicion === undefined) {
      return err(PantryErrors.sinCambios());
    }
    if (input.tipo !== undefined && !esTipoUbicacion(input.tipo)) {
      return err(PantryErrors.tipoNoValido());
    }
    const ubicaciones = await this.despensa.listarUbicaciones();
    const ubicacion = ubicaciones.find((u) => u.id === input.id);
    if (ubicacion === undefined) return err(PantryErrors.ubicacionNoEncontrada());

    const ahora = this.clock.now();
    const cambiadas = new Set<Ubicacion>();
    if (input.nombre !== undefined) {
      if (ubicaciones.some((u) => u.id !== input.id && mismoNombre(u.nombre, input.nombre ?? ""))) {
        return err(PantryErrors.ubicacionRepetida());
      }
      const r = ubicacion.renombrar(input.nombre, ahora);
      if (!r.ok) return r;
      cambiadas.add(ubicacion);
    }
    if (input.tipo !== undefined && esTipoUbicacion(input.tipo)) {
      ubicacion.cambiarTipo(input.tipo, ahora);
      cambiadas.add(ubicacion);
    }
    if (input.posicion !== undefined) {
      const resto = ubicaciones.filter((u) => u.id !== input.id);
      const destino = Math.min(Math.max(1, Math.trunc(input.posicion)), ubicaciones.length);
      resto.splice(destino - 1, 0, ubicacion);
      for (const u of renumerar(resto, ahora)) cambiadas.add(u);
    }

    await this.despensa.guardar({ ubicaciones: [...cambiadas] });
    return ok(ubicacion.toSnapshot());
  }
}

/**
 * Borra una ubicación. Si tiene productos, hace falta `destinoId` y se mueven allí
 * (juntándose con las líneas iguales) en la misma transacción. La última no se borra.
 */
export class DeleteUbicacionCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    readonly id: string;
    readonly destinoId?: string;
    readonly usuarioId: string;
  }): Promise<Result<void>> {
    const [ubicaciones, lineas] = await Promise.all([
      this.despensa.listarUbicaciones(),
      this.despensa.listarLineas(),
    ]);
    const ubicacion = ubicaciones.find((u) => u.id === input.id);
    if (ubicacion === undefined) return err(PantryErrors.ubicacionNoEncontrada());
    if (ubicaciones.length === 1) return err(PantryErrors.ultimaUbicacion());

    const ahora = this.clock.now();
    const despensa = new Despensa(
      lineas,
      ubicaciones.map((u) => u.toSnapshot()),
    );
    const dentro = lineas.filter((l) => l.ubicacionId === input.id);
    if (dentro.length > 0) {
      if (input.destinoId === undefined)
        return err(PantryErrors.ubicacionConProductos(dentro.length));
      if (input.destinoId === input.id || !ubicaciones.some((u) => u.id === input.destinoId)) {
        return err(PantryErrors.destinoNoValido());
      }
      for (const linea of dentro) {
        linea.mover(input.destinoId, ahora);
        despensa.registrar(linea);
        const queda = despensa.juntarSiCoincide(linea, input.usuarioId, ahora);
        if (!queda.ok) return queda;
      }
    }

    ubicacion.eliminar(ahora);
    const resto = renumerar(
      ubicaciones.filter((u) => u.id !== input.id),
      ahora,
    );
    await this.despensa.guardar({
      ubicaciones: [ubicacion, ...resto],
      lineas: despensa.lineasCambiadas(),
      movimientos: despensa.movimientos,
    });
    return ok(undefined);
  }
}

/** Nevera, Congelador y Armario para un hogar que aún no tiene ninguna (alta del hogar). */
export class CrearUbicacionesPorDefectoCommand {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<Result<UbicacionSnapshot[]>> {
    const actuales = await this.despensa.listarUbicaciones();
    if (actuales.length > 0) return ok(actuales.map((u) => u.toSnapshot()));

    const ahora = this.clock.now();
    const nuevas = UBICACIONES_POR_DEFECTO.flatMap(({ nombre, tipo }, i) => {
      const u = Ubicacion.create({ id: newId(), nombre, tipo, orden: i + 1 }, ahora);
      return u.ok ? [u.value] : [];
    });
    await this.despensa.guardar({ ubicaciones: nuevas });
    return ok(nuevas.map((u) => u.toSnapshot()));
  }
}
