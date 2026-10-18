/** Error general del formulario. `role="alert"`: el lector de pantalla lo anuncia al aparecer. */
export function ErrorFormulario({ mensaje }: { mensaje: string | null }) {
  if (mensaje === null) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
    >
      {mensaje}
    </p>
  );
}
