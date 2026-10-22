"use client";
import { ChevronLeft, Layers, Search } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { estandarizarProductoAction, olvidarProductoAction } from "@/app/actions/productos";
import type { MiProductoResponse, MisProductosResponse } from "@/contracts/catalog";
import { NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ETIQUETA_UNIDAD } from "../../_components/cantidad-pack";
import { type CambiosProducto, EditarProductoDialog } from "./editar-producto-dialog";
import { filtrarProductos, unionPropuesta } from "./parecidos";

type Props = { datos: MisProductosResponse };

/**
 * «Mis productos»: lo que el hogar ha escrito a mano. Aquí se estandariza: corregir el
 * nombre, unir duplicados (entre sí o con la lista base), categoría, unidad y pack. Los
 * cambios llegan también a las listas activas y a la despensa.
 */
export function MisProductosScreen({ datos }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [aEditar, setAEditar] = useState<MiProductoResponse | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const productos = filtrarProductos(datos.items, busqueda);
  const nombrePorClave = new Map(datos.items.map((p) => [p.nombreNormalizado, p.nombre]));

  function hacer(trabajo: () => Promise<string | null>) {
    setError(null);
    setAviso(null);
    startTransition(async () => {
      const mensaje = await trabajo();
      if (mensaje !== null) setAviso(mensaje);
    });
  }

  function guardar(producto: MiProductoResponse, cambios: CambiosProducto) {
    setAEditar(null);
    hacer(async () => {
      const r = await estandarizarProductoAction({ desde: producto.nombreNormalizado, ...cambios });
      if (!r.ok) {
        setError(r.error.message);
        return null;
      }
      return `Guardado: ${r.value.enListas} en listas y ${r.value.enDespensa} en la despensa.`;
    });
  }

  function olvidar(producto: MiProductoResponse) {
    setAEditar(null);
    hacer(async () => {
      const r = await olvidarProductoAction(producto.nombreNormalizado);
      if (!r.ok) {
        setError(r.error.message);
        return null;
      }
      return `«${producto.nombre}» ya no saldrá en las sugerencias.`;
    });
  }

  function unir(indice: number) {
    const grupo = datos.parecidos[indice];
    if (grupo === undefined) return;
    const { destino, desde } = unionPropuesta(grupo, datos.items);
    hacer(async () => {
      for (const nombre of desde) {
        const r = await estandarizarProductoAction({
          desde: nombre,
          nombre: destino.nombre,
          productoBaseId: destino.productoBaseId,
        });
        if (!r.ok) {
          setError(r.error.message);
          return null;
        }
      }
      return `Unidos en «${destino.nombre}».`;
    });
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pt-2 pb-24 sm:pb-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/listas"
          className="-ml-2 flex h-11 items-center gap-1 self-start rounded-lg px-2 font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          Mis listas
        </Link>
        <h1 className="text-[28px] leading-9 font-bold">Mis productos</h1>
        <p className="text-muted-foreground">
          Lo que has escrito a mano. Corrige nombres, une duplicados y elige su categoría, unidad y
          pack: el cambio llega a tus listas y a la despensa.
        </p>
      </header>

      {aviso !== null && (
        <p
          role="status"
          className="rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
        >
          {aviso}
        </p>
      )}
      {error !== null && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}

      {datos.parecidos.length > 0 && (
        <section aria-labelledby="parecidos" className="flex flex-col gap-3">
          <h2 id="parecidos" className="text-xl font-semibold">
            Posibles duplicados
          </h2>
          <ul className="flex flex-col gap-2">
            {datos.parecidos.map((grupo, i) => {
              const { destino } = unionPropuesta(grupo, datos.items);
              return (
                <li
                  key={grupo.productos.map((p) => p.nombreNormalizado).join("|")}
                  className="flex flex-col gap-3 rounded-xl bg-accent/60 p-3"
                >
                  <p className="text-sm">
                    {grupo.productos.map((p) => `«${p.nombre}»`).join(", ")}
                    {grupo.base !== null && (
                      <>
                        {" "}
                        se parece a <strong>«{grupo.base.nombre}»</strong> de la lista base
                      </>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    disabled={pendiente}
                    onClick={() => unir(i)}
                    className="h-11 self-start font-semibold"
                  >
                    <Layers aria-hidden="true" />
                    Unir en «{destino.nombre}»
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="todos" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 id="todos" className="text-xl font-semibold">
            Todos
          </h2>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            {datos.items.length}
          </span>
        </div>
        {datos.items.length > 6 && (
          <label className="relative">
            <span className="sr-only">Buscar en mis productos</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="h-11 rounded-lg border-transparent bg-muted pl-10 md:text-base"
            />
          </label>
        )}
        {datos.items.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Aún no has escrito productos a mano: los de la lista base ya vienen estandarizados.
          </p>
        ) : productos.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">Nada coincide con «{busqueda}».</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {productos.map((p) => (
              <li key={p.nombreNormalizado}>
                <button
                  type="button"
                  onClick={() => setAEditar(p)}
                  disabled={pendiente}
                  className="flex min-h-16 w-full flex-col gap-1 rounded-xl bg-card p-3 text-left shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                >
                  <span className="text-lg leading-6 font-semibold break-words">{p.nombre}</span>
                  <span className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    <span>{NOMBRE_CATEGORIA[p.categoria]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ETIQUETA_UNIDAD[p.unidad]}</span>
                    {p.unidadesPorPack !== null && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>pack de {p.unidadesPorPack}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{p.usos === 1 ? "usado 1 vez" : `usado ${p.usos} veces`}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditarProductoDialog
        producto={aEditar}
        otros={nombrePorClave}
        onGuardar={(cambios) => aEditar && guardar(aEditar, cambios)}
        onOlvidar={() => aEditar && olvidar(aEditar)}
        onCerrar={() => setAEditar(null)}
      />
    </section>
  );
}
