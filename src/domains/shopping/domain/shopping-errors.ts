import { conflictError, notFoundError, validationError } from "@/shared/kernel/errors";
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

  notaNoValida: (max: number) =>
    validationError("NOTA_NO_VALIDA", `La nota admite como máximo ${max} caracteres`),
};
