import type { MedidaResponse } from "@/contracts/recipes";

const numero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const ETIQUETA = { unidad: "ud.", g: "g", kg: "kg", ml: "ml", l: "l" } as const;

/** Como en la cocina: 1.000 g se leen mejor como 1 kg, y 1.500 ml como 1,5 l. */
export function formatMedida(medida: MedidaResponse): string {
  if (medida.unidad === "g" && medida.valor >= 1000)
    return `${numero.format(medida.valor / 1000)} kg`;
  if (medida.unidad === "ml" && medida.valor >= 1000)
    return `${numero.format(medida.valor / 1000)} l`;
  return `${numero.format(medida.valor)} ${ETIQUETA[medida.unidad]}`;
}

/** «cebolla», «cebolla y ajo», «cebolla, ajo y perejil». */
export function unirEnFrase(partes: readonly string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

/** Aviso de lo que caduca antes de lo que usa la receta. null si no hace falta avisar. */
export function textoCaducaReceta(caduca: { nombre: string; dias: number } | null): string | null {
  if (caduca === null || caduca.dias > 7) return null;
  if (caduca.dias < 0) return `${caduca.nombre}: ya caducó`;
  if (caduca.dias === 0) return `${caduca.nombre} caduca hoy`;
  if (caduca.dias === 1) return `${caduca.nombre} caduca mañana`;
  return `${caduca.nombre} caduca en ${caduca.dias} días`;
}

/** «Para 2 raciones» y, si se ajustó, cuántas son en la receta. */
export function textoRaciones(sugeridas: number, deLaReceta: number): string {
  const base = `Para ${sugeridas} ${sugeridas === 1 ? "ración" : "raciones"}`;
  return sugeridas < deLaReceta ? `${base} (la receta es para ${deLaReceta})` : base;
}
