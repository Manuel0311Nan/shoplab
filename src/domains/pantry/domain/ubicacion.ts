import type { TipoUbicacion } from "@/shared/kernel/categoria";
import { err, ok, type Result } from "@/shared/kernel/result";
import { PantryErrors } from "./pantry-errors";

export const MAX_UBICACIONES = 12;
export const MAX_NOMBRE_UBICACION = 30;

/** Las que tiene todo hogar al crearse (D3). Se pueden renombrar, ordenar o borrar. */
export const UBICACIONES_POR_DEFECTO: readonly { nombre: string; tipo: TipoUbicacion }[] = [
  { nombre: "Nevera", tipo: "frio" },
  { nombre: "Congelador", tipo: "congelado" },
  { nombre: "Armario", tipo: "ambiente" },
];

export interface UbicacionSnapshot {
  readonly id: string;
  readonly nombre: string;
  readonly tipo: TipoUbicacion;
  /** Posición en la pantalla: 1, 2, 3… */
  readonly orden: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

function validarNombre(nombre: string): Result<string> {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  if (limpio.length === 0 || limpio.length > MAX_NOMBRE_UBICACION) {
    return err(PantryErrors.nombreNoValido(MAX_NOMBRE_UBICACION));
  }
  return ok(limpio);
}

/** Nevera, congelador, armario… o lo que el hogar quiera (D3). */
export class Ubicacion {
  private constructor(private state: UbicacionSnapshot) {}

  static create(
    input: { id: string; nombre: string; tipo: TipoUbicacion; orden: number },
    ahora: Date,
  ): Result<Ubicacion> {
    const nombre = validarNombre(input.nombre);
    if (!nombre.ok) return nombre;
    return ok(
      new Ubicacion({
        id: input.id,
        nombre: nombre.value,
        tipo: input.tipo,
        orden: input.orden,
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      }),
    );
  }

  static rehydrate(snapshot: UbicacionSnapshot): Ubicacion {
    return new Ubicacion(snapshot);
  }

  get id(): string {
    return this.state.id;
  }
  get nombre(): string {
    return this.state.nombre;
  }
  get tipo(): TipoUbicacion {
    return this.state.tipo;
  }
  get orden(): number {
    return this.state.orden;
  }

  renombrar(nombre: string, ahora: Date): Result<void> {
    const limpio = validarNombre(nombre);
    if (!limpio.ok) return limpio;
    this.state = { ...this.state, nombre: limpio.value, updatedAt: ahora };
    return ok(undefined);
  }

  cambiarTipo(tipo: TipoUbicacion, ahora: Date): void {
    if (tipo === this.state.tipo) return;
    this.state = { ...this.state, tipo, updatedAt: ahora };
  }

  colocarEn(orden: number, ahora: Date): void {
    if (orden === this.state.orden) return;
    this.state = { ...this.state, orden, updatedAt: ahora };
  }

  eliminar(ahora: Date): void {
    this.state = { ...this.state, deletedAt: ahora, updatedAt: ahora };
  }

  toSnapshot(): UbicacionSnapshot {
    return this.state;
  }
}

/** Mismo nombre sin distinguir mayúsculas ni espacios: "nevera" choca con "Nevera". */
export function mismoNombre(a: string, b: string): boolean {
  const clave = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-ES");
  return clave(a) === clave(b);
}

/**
 * Dónde proponer guardar algo: la primera ubicación (por orden) del tipo que pide su
 * categoría y, si el hogar no tiene ninguna de ese tipo, la primera de todas.
 */
export function ubicacionPropuesta<U extends Pick<UbicacionSnapshot, "tipo" | "orden">>(
  ubicaciones: readonly U[],
  tipo: TipoUbicacion,
): U | undefined {
  const ordenadas = [...ubicaciones].sort((a, b) => a.orden - b.orden);
  return ordenadas.find((u) => u.tipo === tipo) ?? ordenadas.at(0);
}

/** Memoria del hogar: dónde se guardó un producto la última vez que se eligió sitio. */
export interface UbicacionRecordada {
  /** Clave dentro del hogar: normalizarNombre(nombre). */
  readonly nombreNormalizado: string;
  readonly ubicacionId: string;
}

/**
 * Dónde proponer guardar un producto: donde lo guardó el hogar la última vez, si esa
 * ubicación sigue existiendo; si no, la propuesta por su categoría. Lo usan el servidor
 * y los formularios.
 */
export function ubicacionParaProducto<U extends Pick<UbicacionSnapshot, "id" | "tipo" | "orden">>(
  ubicaciones: readonly U[],
  recordadaId: string | undefined,
  tipo: TipoUbicacion,
): U | undefined {
  const recordada = ubicaciones.find((u) => u.id === recordadaId);
  return recordada ?? ubicacionPropuesta(ubicaciones, tipo);
}
