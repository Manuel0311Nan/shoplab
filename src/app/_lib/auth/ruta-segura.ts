/**
 * Destino tras entrar, tomado del parámetro `?next=`. Solo se aceptan rutas internas:
 * sin esto, `/login?next=https://web-falsa.com` llevaría al usuario a otra web
 * justo después de iniciar sesión (redirección abierta).
 */
export function rutaSegura(next: string | null | undefined, porDefecto = "/"): string {
  if (typeof next !== "string" || next === "") return porDefecto;
  // Debe empezar por "/" pero no por "//" ni "/\" (el navegador los trata como otro dominio).
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return porDefecto;
  // Caracteres de control: algunos navegadores los ignoran y reconstruyen "//".
  if (/[\u0000-\u001f\u007f]/.test(next)) return porDefecto;
  return next;
}
