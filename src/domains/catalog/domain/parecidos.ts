import { normalizarNombre } from "@/shared/kernel/texto";

/** Palabras que no distinguen productos: «yogur de fresa» ≈ «yogur fresa». */
const VACIAS = new Set(["de", "del", "la", "las", "el", "los", "con", "sin", "y", "en", "al", "a"]);

/**
 * Una clave para encontrar nombres que seguramente son el mismo producto escrito de
 * otra forma: sin tildes ni mayúsculas, sin plurales («yogures» → «yogur», «tomates» y
 * «tomate» → «tomat»), sin palabras vacías y sin importar el orden.
 */
export function claveParecida(nombre: string): string {
  return normalizarNombre(nombre)
    .split(" ")
    .filter((p) => p !== "" && !VACIAS.has(p))
    .map(singular)
    .sort()
    .join(" ");
}

function singular(palabra: string): string {
  let p = palabra;
  if (p.length > 3 && p.endsWith("s")) p = p.slice(0, -1);
  if (p.length > 3 && p.endsWith("e")) p = p.slice(0, -1);
  return p;
}

export interface ProductoParecido {
  readonly nombreNormalizado: string;
  readonly nombre: string;
}

export interface GrupoParecido {
  /** Del hogar: dos o más que parecen el mismo, o uno que parece de la lista base. */
  readonly productos: readonly ProductoParecido[];
  /** El de la lista base al que se parecen, si hay uno. */
  readonly base: { readonly id: string; readonly nombre: string } | null;
}

/**
 * Posibles duplicados para proponer «unir»: productos del hogar con la misma clave
 * parecida entre sí o con un producto de la lista base.
 */
export function gruposParecidos(
  delHogar: readonly ProductoParecido[],
  base: readonly { readonly id: string; readonly nombre: string }[],
): GrupoParecido[] {
  const porClave = new Map<string, ProductoParecido[]>();
  for (const p of delHogar) {
    const clave = claveParecida(p.nombre);
    if (clave === "") continue;
    porClave.set(clave, [...(porClave.get(clave) ?? []), p]);
  }
  const basePorClave = new Map(base.map((b) => [claveParecida(b.nombre), b]));

  const grupos: GrupoParecido[] = [];
  for (const [clave, productos] of porClave) {
    const b = basePorClave.get(clave);
    if (productos.length < 2 && b === undefined) continue;
    grupos.push({ productos, base: b === undefined ? null : { id: b.id, nombre: b.nombre } });
  }
  return grupos.sort((a, b) =>
    (a.productos[0]?.nombre ?? "").localeCompare(b.productos[0]?.nombre ?? "", "es"),
  );
}
