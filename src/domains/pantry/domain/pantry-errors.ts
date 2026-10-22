import { conflictError, notFoundError, validationError } from "@/shared/kernel/errors";

export const PantryErrors = {
  lineaNoEncontrada: () =>
    notFoundError("LINEA_NO_ENCONTRADA", "Ese producto no está en la despensa"),

  ubicacionNoEncontrada: () => notFoundError("UBICACION_NO_ENCONTRADA", "Esa ubicación no existe"),

  nombreNoValido: (max: number) =>
    validationError("NOMBRE_NO_VALIDO", `El nombre debe tener entre 1 y ${max} caracteres`),

  cantidadInsuficiente: (disponible: { valor: number; unidad: string }) =>
    conflictError("CANTIDAD_INSUFICIENTE", `Solo quedan ${disponible.valor} ${disponible.unidad}`, {
      disponible,
    }),

  cantidadIncompatible: () =>
    validationError(
      "CANTIDAD_INCOMPATIBLE",
      "Esa unidad no se puede convertir a la del producto (por ejemplo, ud. y kg)",
    ),

  despensaLlena: (max: number) =>
    conflictError("DESPENSA_LLENA", `La despensa admite como mucho ${max} productos`, { max }),

  demasiadasUbicaciones: (max: number) =>
    conflictError("DEMASIADAS_UBICACIONES", `Puedes tener como mucho ${max} ubicaciones`, { max }),

  ubicacionRepetida: () =>
    conflictError("UBICACION_REPETIDA", "Ya hay una ubicación con ese nombre"),

  ubicacionConProductos: (productos: number) =>
    conflictError(
      "UBICACION_CON_PRODUCTOS",
      "La ubicación tiene productos: elige a dónde moverlos",
      { productos },
    ),

  ultimaUbicacion: () =>
    conflictError("ULTIMA_UBICACION", "La despensa necesita al menos una ubicación"),

  destinoNoValido: () =>
    validationError("DESTINO_NO_VALIDO", "Elige otra ubicación que exista como destino"),

  sinCambios: () => validationError("SIN_CAMBIOS", "Indica al menos un cambio"),

  movimientoNoEncontrado: () =>
    notFoundError("MOVIMIENTO_NO_ENCONTRADO", "No encontramos ese gasto para deshacerlo"),

  noSePuedeDeshacer: () =>
    conflictError("NO_SE_PUEDE_DESHACER", "Ya no se puede deshacer: corrige la cantidad a mano"),

  categoriaNoValida: () => validationError("CATEGORIA_NO_VALIDA", "Esa categoría no existe"),

  yaAbierta: () => conflictError("LINEA_YA_ABIERTA", "Este paquete ya está abierto"),

  noEstaAbierta: () =>
    validationError("LINEA_NO_ABIERTA", "Ese producto no está abierto: ábrelo primero"),

  noSeAbre: () =>
    validationError("NO_SE_ABRE", "Este producto no se marca como abierto (fruta, verdura…)"),

  tipoNoValido: () =>
    validationError("TIPO_NO_VALIDO", "El tipo debe ser frío, congelado o ambiente"),
};
