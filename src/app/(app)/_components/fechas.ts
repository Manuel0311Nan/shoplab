// Zona fija: el servidor (UTC en Vercel) y el navegador deben pintar lo mismo al hidratar.
const diaYMes = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Madrid",
});

/** "3 de noviembre". */
export function formatDiaYMes(iso: string): string {
  return diaYMes.format(new Date(iso));
}
