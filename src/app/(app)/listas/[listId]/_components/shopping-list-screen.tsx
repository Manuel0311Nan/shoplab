"use client";
import { ArchiveRestore, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
  addItemAction,
  removeItemAction,
  setItemPurchasedAction,
  updateItemCategoryAction,
  updateItemQuantityAction,
} from "@/app/actions/shopping-items";
import { actualizarListaAction, finishShoppingAction } from "@/app/actions/shopping-lists";
import type { CategoriaDto } from "@/contracts/categoria";
import type { PacksRecordados } from "@/contracts/memoria";
import type {
  CantidadDto,
  LimiteDeListasDetails,
  ModoTerminarCompraDto,
  ShoppingItemResponse,
  ShoppingListResponse,
} from "@/contracts/shopping";
import { newId } from "@/shared/kernel/ids";
import type { Result } from "@/shared/kernel/result";
import { Button } from "@/shared/ui/button";
import { ElegirListaDialog } from "../../../_components/elegir-lista-dialog";
import { duplicado, limiteDeListas } from "../../../_components/errores";
import { formatDiaYMes } from "../../../_components/fechas";
import { AddItemForm, NUEVO_PRODUCTO_ID, type NewItemValues } from "./add-item-form";
import { DuplicadoDialog, type EstadoDuplicado, type RespuestaUnir } from "./duplicado-dialog";
import { FinishShoppingButton } from "./finish-shopping-button";
import { GuardarEnDespensaSheet } from "./guardar-en-despensa-sheet";
import { ItemList } from "./item-list";
import { SelectorOrden, useOrdenLista } from "./orden-lista";
import { type AccionLista, aplicarAccion } from "./list-reducer";

type Props = {
  list: ShoppingListResponse;
  /** Memoria del hogar: el formulario propone el pack de cada producto. */
  packs?: PacksRecordados;
};

/** Alta que espera respuesta del usuario (producto repetido). */
type AltaPendiente = EstadoDuplicado & { readonly values: NewItemValues; readonly id: string };

export function ShoppingListScreen({ list, packs = {} }: Props) {
  const [items, aplicarOptimista] = useOptimistic(list.items, aplicarAccion);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [alta, setAlta] = useState<AltaPendiente | null>(null);
  const [limite, setLimite] = useState<LimiteDeListasDetails | null>(null);
  const soloLectura = list.archivada;
  const [orden, setOrden] = useOrdenLista();
  const [paraDespensa, setParaDespensa] = useState<ShoppingItemResponse[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function ejecutar(accion: AccionLista | null, llamada: () => Promise<Result<unknown>>) {
    setError(null);
    startTransition(async () => {
      if (accion !== null) aplicarOptimista(accion);
      const result = await llamada();
      if (!result.ok) setError(result.error.message);
    });
  }

  /**
   * Añade (con el ítem optimista) o, tras preguntar, une o separa (sin optimista: el
   * resultado depende del servidor). Si el servidor ve un repetido, abre el diálogo.
   */
  function enviarAlta(
    values: NewItemValues,
    id: string,
    respuesta: RespuestaUnir & { duplicado?: "unir" | "separar" } = {},
  ) {
    setError(null);
    startTransition(async () => {
      if (respuesta.duplicado === undefined) {
        aplicarOptimista({
          tipo: "anadir",
          item: {
            id,
            nombre: values.nombre,
            cantidad: values.cantidad,
            unidadesPorPack: values.unidadesPorPack ?? null,
            nota: values.nota ?? null,
            ingredientId: null,
            productoBaseId: values.productoBaseId ?? null,
            // La decide el servidor si no se eligió del autocompletado; mientras, Otros.
            categoria: values.categoria ?? "otros",
            compradoAt: null,
            updatedAt: new Date().toISOString(),
            listaId: list.id,
            listaNombre: list.nombre,
          },
        });
      }
      const result = await addItemAction(list.id, { ...values, id, ...respuesta });
      if (result.ok) return;

      const existente = duplicado(result.error);
      if (existente === null) {
        setError(result.error.message);
        return;
      }
      setAlta({
        values,
        id,
        existente,
        nueva: values.cantidad,
        paso: result.error.code === "POSIBLE_DUPLICADO" ? "decidir" : "unidad",
      });
    });
  }

  function responderAlta(respuesta: RespuestaUnir & { duplicado: "unir" | "separar" }) {
    if (alta === null) return;
    setAlta(null);
    enviarAlta(alta.values, alta.id, respuesta);
  }

  function recuperar(archivarListaId?: string) {
    setError(null);
    startTransition(async () => {
      const result = await actualizarListaAction(list.id, {
        archivada: false,
        ...(archivarListaId ? { archivarListaId } : {}),
      });
      if (result.ok) return;
      const detalles = limiteDeListas(result.error);
      if (detalles !== null) setLimite(detalles);
      else setError(result.error.message);
    });
  }

  // En la general cada ítem pertenece a su lista: los cambios van allí.
  const listaDe = (itemId: string) => items.find((i) => i.id === itemId)?.listaId ?? list.id;
  const marcar = (itemId: string, comprado: boolean) =>
    ejecutar({ tipo: "comprado", itemId, comprado }, () =>
      setItemPurchasedAction(listaDe(itemId), itemId, comprado),
    );
  const cambiarCantidad = (itemId: string, cantidad: CantidadDto) =>
    ejecutar({ tipo: "cantidad", itemId, cantidad }, () =>
      updateItemQuantityAction(listaDe(itemId), itemId, cantidad),
    );
  const cambiarCategoria = (itemId: string, categoria: CategoriaDto) =>
    ejecutar({ tipo: "categoria", itemId, categoria }, () =>
      updateItemCategoryAction(listaDe(itemId), itemId, categoria),
    );
  const quitar = (itemId: string) =>
    ejecutar({ tipo: "quitar", itemId }, () => removeItemAction(listaDe(itemId), itemId));
  /** D6: al terminar, lo que estaba en el carro se ofrece para guardarlo en la despensa. */
  function terminar(modo: ModoTerminarCompraDto) {
    const comprados = items.filter((item) => item.compradoAt !== null);
    setError(null);
    setAviso(null);
    startTransition(async () => {
      aplicarOptimista({ tipo: "terminar", modo });
      const result = await finishShoppingAction(list.id, modo);
      if (!result.ok) setError(result.error.message);
      else if (comprados.length > 0) setParaDespensa(comprados);
    });
  }

  // El FAB del diseño lleva al formulario: en móvil suele quedar fuera de vista.
  function irAlFormulario() {
    const input = document.getElementById(NUEVO_PRODUCTO_ID);
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  const pendientes = items.filter((item) => item.compradoAt === null);
  const enElCarro = items.filter((item) => item.compradoAt !== null);

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pt-2 pb-24 sm:pb-10">
      <header className="flex flex-col gap-2">
        <Link
          href={soloLectura ? "/listas?estado=archivadas" : "/listas"}
          className="-ml-2 flex h-11 items-center gap-1 self-start rounded-lg px-2 font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          Mis listas
        </Link>
        {/* El título ocupa todo el ancho y salta de línea si no cabe: nunca se corta. */}
        <h1 className="text-[28px] leading-9 font-bold text-balance break-words">{list.nombre}</h1>
        {list.general && (
          <p className="text-sm text-muted-foreground">
            Reúne lo que añades aquí y lo de todas tus listas. Cambiar o quitar un producto aquí lo
            cambia también en su lista.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-muted-foreground" aria-live="polite">
            {isPending ? "Guardando…" : `${enElCarro.length} de ${items.length} en el carro`}
          </p>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
            {pendientes.length} por comprar
          </span>
        </div>
      </header>

      {soloLectura ? (
        <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4 text-secondary-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Lista archivada: no se puede cambiar.
            {list.caducaEl !== null && (
              <>
                {" "}
                <strong className="font-semibold">
                  Se borrará el {formatDiaYMes(list.caducaEl)}.
                </strong>
              </>
            )}
          </p>
          <Button
            onClick={() => recuperar()}
            disabled={isPending}
            className="h-11 px-4 font-semibold"
          >
            <ArchiveRestore aria-hidden="true" />
            Recuperar
          </Button>
        </div>
      ) : (
        <AddItemForm packs={packs} onAdd={(values) => enviarAlta(values, newId())} />
      )}

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

      {pendientes.length > 1 && <SelectorOrden orden={orden} onCambiar={setOrden} />}

      <ItemList
        titulo="Por comprar"
        vacio="No queda nada por comprar."
        items={pendientes}
        onToggle={marcar}
        onCantidad={cambiarCantidad}
        onCategoria={cambiarCategoria}
        onQuitar={quitar}
        agrupar={orden === "categoria"}
        soloLectura={soloLectura}
        generalId={list.general ? list.id : null}
      />
      <ItemList
        titulo="En el carro"
        vacio="Todavía no has cogido nada."
        items={enElCarro}
        onToggle={marcar}
        onCantidad={cambiarCantidad}
        onCategoria={cambiarCategoria}
        onQuitar={quitar}
        soloLectura={soloLectura}
        generalId={list.general ? list.id : null}
      />

      {!soloLectura && enElCarro.length > 0 && (
        <FinishShoppingButton
          // En la general lo pendiente es de cada lista: nunca se vacía, solo sale lo comprado.
          pendientes={list.general ? 0 : pendientes.length}
          onTerminar={terminar}
        />
      )}

      {!soloLectura && (
        <button
          type="button"
          onClick={irAlFormulario}
          aria-label="Añadir producto"
          className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90 sm:hidden"
        >
          <Plus className="size-8" aria-hidden="true" />
        </button>
      )}

      <GuardarEnDespensaSheet
        listaId={list.id}
        productos={paraDespensa}
        onCerrar={(mensaje) => {
          setParaDespensa(null);
          if (mensaje) setAviso(mensaje);
        }}
      />
      <DuplicadoDialog
        estado={alta}
        onUnir={(respuesta) => responderAlta({ duplicado: "unir", ...respuesta })}
        onSeparar={() => responderAlta({ duplicado: "separar" })}
        onCerrar={() => setAlta(null)}
      />
      <ElegirListaDialog
        limite={limite}
        motivo="desarchivar"
        onElegir={(id) => {
          setLimite(null);
          recuperar(id);
        }}
        onCerrar={() => setLimite(null)}
      />
    </section>
  );
}
