"use client";
import { AlertTriangle, Plus, Settings2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useOptimistic, useState, useTransition } from "react";
import {
  abrirLineaAction,
  actualizarLineaAction,
  anadirADespensaAction,
  anadirALaListaAction,
  deshacerConsumoAction,
  consumirAction,
  quitarLineaAction,
} from "@/app/actions/pantry";
import type { PacksRecordados, UbicacionesRecordadas } from "@/contracts/memoria";
import type {
  AddStockRequest,
  LineaDespensaResponse,
  MotivoConsumoDto,
  PantryResponse,
  UpdateStockRequest,
} from "@/contracts/pantry";
import { estandarizarProductoAction } from "@/app/actions/productos";
import { newId } from "@/shared/kernel/ids";
import { normalizarNombre } from "@/shared/kernel/texto";
import { NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { cn } from "@/shared/lib/utils";
import { type Aviso, AvisoFlotante } from "../../_components/aviso-flotante";
import { propuestaDeUnidad } from "../../_components/cantidad-pack";
import { EditarNombreDialog, type NombreEditado } from "../../_components/editar-nombre-dialog";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";
import { AbrirDialog } from "./abrir-dialog";
import {
  AnadirAListaDialog,
  type CantidadParaLista,
  type ProductoParaLista,
} from "./anadir-a-lista-dialog";
import { ConsumirDialog } from "./consumir-dialog";
import { aplicarAccionDespensa } from "./despensa-reducer";
import { EditarLineaDialog } from "./editar-linea-dialog";
import { NuevoProductoDialog } from "./nuevo-producto-dialog";
import { TarjetaProducto } from "./tarjeta-producto";
import { type Agrupar, agruparDespensa, textoAvisos } from "./vista-despensa";

type Props = {
  despensa: PantryResponse;
  /** Listas activas, para "Añadir a la lista" (la primera es la última modificada). */
  listas: readonly { id: string; nombre: string }[];
  /** Memoria del hogar: el pack de cada producto y dónde se guardó la última vez. */
  packs?: PacksRecordados;
  recordadas?: UbicacionesRecordadas;
};

const segmento = (activo: boolean) =>
  cn(
    "h-11 flex-1 rounded-lg px-2 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    activo ? "bg-card shadow-card" : "text-muted-foreground",
  );

export function DespensaScreen({ despensa, listas, packs = {}, recordadas = {} }: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const agrupar: Agrupar = params.get("agrupar") === "categoria" ? "categoria" : "ubicacion";
  const ubicacionId = params.get("ubicacion");
  const urgentes = params.get("filtro") === "semana";

  const [lineas, aplicarOptimista] = useOptimistic(despensa.lineas, aplicarAccionDespensa);
  const [ocupado, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [flotante, setFlotante] = useState<Aviso | null>(null);
  const cerrarFlotante = useCallback(() => setFlotante(null), []);
  const [aGastar, setAGastar] = useState<LineaDespensaResponse | null>(null);
  const [aEditar, setAEditar] = useState<LineaDespensaResponse | null>(null);
  const [aRenombrar, setARenombrar] = useState<LineaDespensaResponse | null>(null);
  const [paraLista, setParaLista] = useState<ProductoParaLista | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [aAbrir, setAAbrir] = useState<LineaDespensaResponse | null>(null);

  function cambiarParam(clave: string, valor: string | null) {
    const siguiente = new URLSearchParams(params);
    if (valor === null) siguiente.delete(clave);
    else siguiente.set(clave, valor);
    const query = siguiente.toString();
    router.replace(`${ruta}${query ? `?${query}` : ""}` as Route, { scroll: false });
  }

  function hacer(llamada: () => Promise<void>) {
    setError(null);
    setAviso(null);
    startTransition(llamada);
  }

  const productoDe = (
    l: LineaDespensaResponse,
    motivo: ProductoParaLista["motivo"],
  ): ProductoParaLista => ({
    nombre: l.nombre,
    productoBaseId: l.productoBaseId,
    categoria: l.categoria,
    unidad: l.cantidad.unidad,
    motivo,
  });

  /**
   * Gastar o tirar. Sin preguntar antes: el aviso de abajo ofrece «Deshacer» y, si se ha
   * acabado o queda poco, «Añadir a la lista» (no interrumpe con un diálogo).
   */
  function consumir(
    linea: LineaDespensaResponse,
    valor: number | undefined,
    motivo: MotivoConsumoDto,
  ) {
    setAGastar(null);
    const movimientoId = newId();
    vibrar();
    hacer(async () => {
      aplicarOptimista({
        tipo: "consumir",
        lineaId: linea.id,
        ...(valor === undefined ? {} : { valor }),
      });
      const r = await consumirAction(linea.id, {
        id: movimientoId,
        motivo,
        ...(valor === undefined ? {} : { cantidad: { valor, unidad: linea.cantidad.unidad } }),
      });
      if (!r.ok) {
        setError(r.error.message);
        return;
      }
      const cuanto = formatCantidad(
        valor === undefined ? linea.cantidad : { valor, unidad: linea.cantidad.unidad },
      );
      const hecho = motivo === "tirado" ? "Tirado" : "Gastado";
      const estado = r.value.linea.agotada
        ? " Se ha acabado."
        : r.value.avisarLista
          ? " Queda poco."
          : "";
      setFlotante({
        id: movimientoId,
        texto: `${hecho}: ${cuanto} de ${linea.nombre}.${estado}`,
        acciones: [
          ...(r.value.avisarLista
            ? [{ etiqueta: "A la lista", onClick: () => anadirRapido(linea) }]
            : []),
          { etiqueta: "Deshacer", onClick: () => deshacer(movimientoId, linea) },
        ],
      });
    });
  }

  /** «−1»: un toque, 1 ud. gastada (o la última). */
  function gastarUno(linea: LineaDespensaResponse) {
    consumir(linea, linea.cantidad.valor > 1 ? 1 : undefined, "gastado");
  }

  function deshacer(movimientoId: string, linea: LineaDespensaResponse) {
    hacer(async () => {
      aplicarOptimista({ tipo: "reponer", linea });
      const r = await deshacerConsumoAction(movimientoId, { id: newId() });
      if (!r.ok) setError(r.error.message);
    });
  }

  /** Desde el aviso: a la lista con un toque, con el pack que recuerda el hogar. */
  function anadirRapido(linea: LineaDespensaResponse) {
    const propuesta = propuestaDeUnidad(packs, linea.nombre, linea.cantidad.unidad);
    const n = Number(propuesta.porPack);
    const cantidad: CantidadParaLista =
      propuesta.unidad === "pack"
        ? { cantidad: { valor: n, unidad: "unidad" }, unidadesPorPack: n }
        : { cantidad: { valor: 1, unidad: linea.cantidad.unidad }, unidadesPorPack: null };
    hacer(async () => {
      const r = await anadirALaListaAction({
        ...productoDe(linea, "acabado"),
        ...cantidad,
      });
      if (!r.ok) setError(r.error.message);
      else {
        setFlotante({
          id: newId(),
          texto: r.value.yaEstaba
            ? `${linea.nombre} ya estaba en «${r.value.listaNombre}».`
            : `${linea.nombre} añadido a «${r.value.listaNombre}».`,
        });
      }
    });
  }

  function editar(linea: LineaDespensaResponse, cambios: UpdateStockRequest) {
    setAEditar(null);
    hacer(async () => {
      const r = await actualizarLineaAction(linea.id, cambios);
      if (!r.ok) setError(r.error.message);
    });
  }

  /** Solo esta línea, o en todo el hogar (listas, despensa y Mis productos). */
  function renombrar(linea: LineaDespensaResponse, cambio: NombreEditado) {
    setARenombrar(null);
    hacer(async () => {
      if (!cambio.todoElHogar) {
        const r = await actualizarLineaAction(linea.id, {
          producto: { nombre: cambio.nombre, productoBaseId: cambio.productoBaseId },
        });
        if (!r.ok) setError(r.error.message);
        return;
      }
      const r = await estandarizarProductoAction({
        desde: normalizarNombre(linea.nombre),
        nombre: cambio.nombre,
        productoBaseId: cambio.productoBaseId,
      });
      if (!r.ok) setError(r.error.message);
      else {
        setAviso(
          `Cambiado en todo el hogar: ${r.value.enDespensa} en la despensa y ${r.value.enListas} en listas.`,
        );
      }
    });
  }

  function abrir(linea: LineaDespensaResponse, abiertoEl: string) {
    setAAbrir(null);
    hacer(async () => {
      const r = await abrirLineaAction(linea.id, { abiertoEl, lineaNuevaId: newId() });
      if (!r.ok) setError(r.error.message);
      else if (r.value.resto !== null) {
        setAviso(`Abierta 1 ud. de ${linea.nombre}; el resto sigue cerrado.`);
      }
    });
  }

  function cerrarAbierto(linea: LineaDespensaResponse) {
    hacer(async () => {
      const r = await actualizarLineaAction(linea.id, { abiertoEl: null });
      if (!r.ok) setError(r.error.message);
    });
  }

  function quitar(linea: LineaDespensaResponse) {
    hacer(async () => {
      aplicarOptimista({ tipo: "quitar", lineaId: linea.id });
      const r = await quitarLineaAction(linea.id);
      if (!r.ok) setError(r.error.message);
    });
  }

  function anadir(valores: AddStockRequest) {
    hacer(async () => {
      const r = await anadirADespensaAction({ ...valores, id: newId() });
      if (!r.ok) setError(r.error.message);
    });
  }

  function anadirALista(producto: ProductoParaLista, listaId: string, cantidad: CantidadParaLista) {
    setParaLista(null);
    hacer(async () => {
      const r = await anadirALaListaAction({ ...producto, ...cantidad, listaId });
      if (!r.ok) setError(r.error.message);
      else
        setAviso(
          r.value.yaEstaba
            ? `${producto.nombre} ya estaba en «${r.value.listaNombre}».`
            : `${producto.nombre} añadido a «${r.value.listaNombre}».`,
        );
    });
  }

  const avisos = textoAvisos(lineas);
  const grupos = agruparDespensa(despensa.ubicaciones, lineas, agrupar, { ubicacionId, urgentes });
  const nombreUbicacion = new Map(despensa.ubicaciones.map((u) => [u.id, u.nombre]));

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5 px-5 pt-4 pb-24 sm:pb-10">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-[28px] leading-9 font-bold">Despensa</h1>
        <Link
          href="/despensa/ubicaciones"
          aria-label="Gestionar ubicaciones"
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Settings2 className="size-5" aria-hidden="true" />
        </Link>
      </header>

      {avisos !== null && (
        <button
          type="button"
          aria-pressed={urgentes}
          onClick={() => cambiarParam("filtro", urgentes ? null : "semana")}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl px-4 py-2 text-left text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            urgentes ? "bg-amber-200 text-amber-950" : "bg-amber-100 text-amber-900",
          )}
        >
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          {avisos}
          {urgentes ? " · ver todo" : " · ver"}
        </button>
      )}

      <div
        role="radiogroup"
        aria-label="Agrupar por"
        className="flex gap-1 rounded-xl bg-muted p-1"
      >
        {(["ubicacion", "categoria"] as const).map((modo) => (
          <button
            key={modo}
            type="button"
            role="radio"
            aria-checked={agrupar === modo}
            onClick={() => cambiarParam("agrupar", modo === "ubicacion" ? null : modo)}
            className={segmento(agrupar === modo)}
          >
            {modo === "ubicacion" ? "Por ubicación" : "Por categoría"}
          </button>
        ))}
      </div>

      <nav
        aria-label="Filtrar por ubicación"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
      >
        {[{ id: null, nombre: "Todo" }, ...despensa.ubicaciones].map((u) => (
          <button
            key={u.id ?? "todo"}
            type="button"
            aria-pressed={ubicacionId === u.id}
            onClick={() => cambiarParam("ubicacion", u.id)}
            className={cn(
              "h-11 shrink-0 rounded-full px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              ubicacionId === u.id ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {u.nombre}
          </button>
        ))}
      </nav>

      {(error ?? aviso) !== null && (
        <p
          role={error ? "alert" : "status"}
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            error ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground",
          )}
        >
          {error ?? aviso}
        </p>
      )}

      {lineas.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
          Tu despensa está vacía. Se llena sola al terminar una compra, o añade algo con +.
        </p>
      ) : grupos.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
          No hay nada con este filtro.
        </p>
      ) : (
        <div className="flex flex-col gap-6" aria-busy={ocupado}>
          {grupos.map((g) => (
            <section key={g.clave} aria-label={g.titulo} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">{g.titulo}</h2>
              {g.subgrupos.map((s) => (
                <div key={s.titulo ?? "todo"} className="flex flex-col gap-2">
                  {s.titulo && (
                    <h3 className="text-sm font-semibold text-muted-foreground">{s.titulo}</h3>
                  )}
                  <ul className="flex flex-col gap-2">
                    {s.productos.map((p) => (
                      <TarjetaProducto
                        key={p.clave}
                        producto={p}
                        detalle={
                          agrupar === "categoria"
                            ? (nombreUbicacion.get(p.ubicacionId) ?? null)
                            : s.titulo === null
                              ? NOMBRE_CATEGORIA[p.categoria]
                              : null
                        }
                        onGastar={setAGastar}
                        onGastarUno={gastarUno}
                        onEditar={setAEditar}
                        onAnadirALista={(l) => setParaLista(productoDe(l, "manual"))}
                        onQuitar={quitar}
                        onAbrir={setAAbrir}
                        onCerrarAbierto={cerrarAbierto}
                        onRenombrar={setARenombrar}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setNuevo(true)}
        aria-label="Añadir a la despensa"
        className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90"
      >
        <Plus className="size-8" aria-hidden="true" />
      </button>

      <ConsumirDialog linea={aGastar} onConsumir={consumir} onCerrar={() => setAGastar(null)} />
      <AvisoFlotante aviso={flotante} onCerrar={cerrarFlotante} />
      <EditarLineaDialog
        linea={aEditar}
        ubicaciones={despensa.ubicaciones}
        hoy={despensa.hoy}
        onGuardar={editar}
        onCerrar={() => setAEditar(null)}
      />
      <EditarNombreDialog
        producto={aRenombrar}
        soloAqui="Solo esta línea de la despensa"
        onGuardar={(cambio) => aRenombrar && renombrar(aRenombrar, cambio)}
        onCerrar={() => setARenombrar(null)}
      />
      <AbrirDialog
        linea={aAbrir}
        hoy={despensa.hoy}
        onAbrir={abrir}
        onCerrar={() => setAAbrir(null)}
      />
      <AnadirAListaDialog
        producto={paraLista}
        listas={listas}
        packs={packs}
        onAnadir={anadirALista}
        onCerrar={() => setParaLista(null)}
      />
      <NuevoProductoDialog
        abierto={nuevo}
        ubicaciones={despensa.ubicaciones}
        ubicacionInicial={ubicacionId}
        recordadas={recordadas}
        hoy={despensa.hoy}
        onAnadir={anadir}
        onCerrar={() => setNuevo(false)}
      />
    </section>
  );
}

/** Una vibración corta al gastar, donde el navegador lo permite (Android). */
function vibrar() {
  try {
    navigator.vibrate?.(15);
  } catch {
    // Sin vibración no pasa nada.
  }
}
