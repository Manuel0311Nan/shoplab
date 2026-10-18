/**
 * Forma canónica de un nombre de producto para compararlo: sin espacios sobrantes,
 * en minúsculas y sin tildes ("  Leche  Ácida " → "leche acida").
 * La usan el dominio (detectar duplicados), la UI optimista y la lista base:
 * una sola función para que todos decidan lo mismo.
 */
export function normalizarNombre(nombre: string): string {
  return (
    nombre
      .normalize("NFD")
      // Quita tildes y diéresis, pero no la virgulilla de la ñ: es una letra propia.
      .replace(/(?<![nN])[̀-ͯ]|(?<=[nN])[̀-̂̄-ͯ]/g, "")
      .normalize("NFC")
      .toLocaleLowerCase("es-ES")
      .replace(/\s+/g, " ")
      .trim()
  );
}
