import type {
  IngredienteRecetaResponse,
  RecetaDetalleResponse,
  RecetaResumenResponse,
} from "@/contracts/recipes";
import type {
  Evaluacion,
  IngredienteEvaluado,
  Medida,
} from "@/domains/recipes/domain/disponibilidad";

export function toRecetaResumen(e: Evaluacion): RecetaResumenResponse {
  return {
    id: e.receta.id,
    slug: e.receta.slug,
    nombre: e.receta.nombre,
    descripcion: e.receta.descripcion,
    minutos: e.receta.minutos,
    etiquetas: [...e.receta.etiquetas],
    raciones: e.receta.raciones,
    racionesSugeridas: e.racionesSugeridas,
    sePuedeHacer: e.sePuedeHacer,
    faltan: e.faltan,
    queFalta: e.ingredientes
      .filter((i) => i.estado === "falta" || i.estado === "poco")
      .map((i) => i.nombre.toLocaleLowerCase("es-ES")),
    caduca: e.caduca,
  };
}

export function toRecetaDetalle(e: Evaluacion): RecetaDetalleResponse {
  return {
    ...toRecetaResumen(e),
    racionesElegidas: e.raciones,
    racionesPosibles: e.racionesPosibles,
    ingredientes: e.ingredientes.map(toIngrediente),
    pasos: [...e.receta.pasos],
  };
}

function toIngrediente(i: IngredienteEvaluado): IngredienteRecetaResponse {
  return {
    nombre: i.nombre,
    nota: i.nota,
    basico: i.basico,
    opcional: i.opcional,
    producto: i.producto === null ? null : { id: i.producto.id, nombre: i.producto.nombre },
    cantidadBase: medida(i.cantidadBase),
    cantidad: medida(i.cantidad),
    disponible: medida(i.disponible),
    hay: i.hay,
    falta: medida(i.falta),
    estado: i.estado,
  };
}

/** Sin la marca de `Cantidad`: el DTO es un objeto plano. */
function medida(m: Medida | null) {
  return m === null ? null : { valor: m.valor, unidad: m.unidad };
}
