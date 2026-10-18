import { conflictError, notFoundError, validationError } from "@/shared/kernel/errors";

/** Lo que el cliente necesita para preguntar si unir (POSIBLE_DUPLICADO, UNIDADES_DISTINTAS). */
export interface DetalleDuplicado {
  readonly itemId: string;
  readonly nombre: string;
  readonly cantidad: { readonly valor: number; readonly unidad: string };
  readonly comprado: boolean;
}
export const ShoppingErrors = {
  listaNoEncontrada: () => notFoundError("LISTA_NO_ENCONTRADA", "La lista no existe"),

  itemNoEncontrado: () => notFoundError("ITEM_NO_ENCONTRADO", "Ese producto no está en la lista"),

  itemYaExiste: () => conflictError("ITEM_YA_EXISTE", "Ya existe un producto con ese id"),

  listaArchivada: () =>
    conflictError("LISTA_ARCHIVADA", "La lista está archivada y no se puede modificar"),

  listaLlena: (max: number) =>
    conflictError("LISTA_LLENA", `Una lista admite como máximo ${max} productos`),

  nombreNoValido: (max: number) =>
    validationError("NOMBRE_NO_VALIDO", `El nombre debe tener entre 1 y ${max} caracteres`),

  sinCambios: () =>
    validationError("SIN_CAMBIOS", "Indica al menos un cambio: cantidad o comprado"),

  sinCambiosLista: () =>
    validationError("SIN_CAMBIOS", "Indica al menos un cambio: nombre o archivada"),

  limiteDeListas: (max: number, activas: readonly { id: string; nombre: string }[]) =>
    conflictError(
      "LIMITE_DE_LISTAS",
      `Has llegado al máximo de ${max} listas activas. Elige una para archivarla y hacer sitio`,
      { max, activas },
    ),

  listaParaArchivarNoValida: () =>
    validationError(
      "LISTA_PARA_ARCHIVAR_NO_VALIDA",
      "La lista elegida para archivar no existe o ya está archivada",
    ),

  posibleDuplicado: (existente: DetalleDuplicado) =>
    conflictError("POSIBLE_DUPLICADO", `Ya tienes «${existente.nombre}» en la lista`, {
      existente,
    }),

  unidadesDistintas: (existente: DetalleDuplicado) =>
    validationError(
      "UNIDADES_DISTINTAS",
      "Las cantidades están en unidades distintas: elige en qué unidad contarlo y, si no se pueden convertir, la cantidad final",
      { existente },
    ),

  cantidadNoValida: () =>
    validationError("CANTIDAD_NO_VALIDA", "La cantidad total se sale de los límites permitidos"),

  notaNoValida: (max: number) =>
    validationError("NOTA_NO_VALIDA", `La nota admite como máximo ${max} caracteres`),
};
