import Link from "next/link";

export default function RecetaNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 pt-4">
      <p>Esta receta no existe.</p>
      <Link href="/recetas" className="self-start underline">
        Volver a las recetas
      </Link>
    </div>
  );
}
