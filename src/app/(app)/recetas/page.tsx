import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sugerirRecetas } from "@/app/_lib/recipes/recetas-con-despensa";
import { toRecetaResumen } from "@/app/_lib/recipes/to-response";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { TarjetaReceta } from "./_components/tarjeta-receta";

export const metadata: Metadata = { title: "Recetas · Migas" };

/**
 * Vista 4: recetas de la biblioteca según la despensa. Primero las que se pueden hacer
 * (raciones ajustadas a lo que hay); después las que casi.
 */
export default async function RecetasPage() {
  const contexto = await getAuthContext();
  if (!contexto.ok) {
    redirect(contexto.error.code === "SIN_HOGAR" ? "/bienvenida" : "/login?next=%2Frecetas");
  }

  const result = await sugerirRecetas(contexto.value);
  if (!result.ok) throw new Error(result.error.message);
  const puedes = result.value.puedes.map(toRecetaResumen);
  const casi = result.value.casi.map(toRecetaResumen);
  const { despensaVacia, masCompra } = result.value;

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pt-4 pb-24 sm:pb-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-9 font-bold">Recetas</h1>
        <p className="text-muted-foreground">Con lo que hay en tu despensa</p>
      </header>

      {despensaVacia ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed px-4 py-8 text-muted-foreground">
          <p>
            Tu despensa está vacía: aquí no quedan ni las migas. Cuando guardes la compra, verás las
            recetas que puedes hacer con lo que tienes.
          </p>
          <Link
            href="/despensa"
            className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
          >
            Ir a la despensa
          </Link>
        </div>
      ) : (
        <>
          <Seccion
            titulo="Puedes hacerlas"
            vacio="Con lo que hay ahora no sale ninguna receta completa. Mira las que casi."
            recetas={puedes}
          />
          <Seccion
            titulo="Te falta poco"
            vacio="No hay recetas a las que les falten solo uno o dos ingredientes."
            recetas={casi}
          />
          {masCompra > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {masCompra === 1
                ? "1 receta más necesita más compra."
                : `${masCompra} recetas más necesitan más compra.`}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Las primeras de cada sección; el resto, al pedirlo. */
const VISIBLES = 8;

function ListaRecetas({ recetas }: Readonly<{ recetas: ReturnType<typeof toRecetaResumen>[] }>) {
  return (
    <ul className="flex flex-col gap-3">
      {recetas.map((r) => (
        <li key={r.id}>
          <TarjetaReceta receta={r} />
        </li>
      ))}
    </ul>
  );
}

function Seccion({
  titulo,
  vacio,
  recetas,
}: Readonly<{ titulo: string; vacio: string; recetas: ReturnType<typeof toRecetaResumen>[] }>) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        {titulo}
        <span className="rounded-full bg-accent px-2 text-sm font-semibold text-accent-foreground">
          {recetas.length}
        </span>
      </h2>
      {recetas.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {vacio}
        </p>
      ) : (
        <>
          <ListaRecetas recetas={recetas.slice(0, VISIBLES)} />
          {recetas.length > VISIBLES && (
            // Sin JS: <details> despliega el resto.
            <details className="group flex flex-col gap-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-xl bg-muted font-semibold outline-none group-open:hidden focus-visible:ring-3 focus-visible:ring-ring/50">
                Ver {recetas.length - VISIBLES} más
              </summary>
              <ListaRecetas recetas={recetas.slice(VISIBLES)} />
            </details>
          )}
        </>
      )}
    </section>
  );
}
