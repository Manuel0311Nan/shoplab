import Link from "next/link";

/**
 * Se muestra cuando page.tsx llama a `notFound()` (404).
 * El mensaje es ambiguo a propósito: por la extensión de tenant, una lista de
 * otro hogar es indistinguible de una que no existe, y así debe seguir.
 */
export default function ListNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 p-4">
      <p>Esta lista no existe o no pertenece a tu hogar.</p>
      <Link href="/" className="self-start underline">
        Volver al inicio
      </Link>
    </div>
  );
}
