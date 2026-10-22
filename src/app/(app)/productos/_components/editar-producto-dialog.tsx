"use client";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { CategoriaDto } from "@/contracts/categoria";
import type { MiProductoResponse } from "@/contracts/catalog";
import { type UnidadDto, unidadSchema } from "@/contracts/shopping";
import { CATEGORIAS, NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { emojiPorDefecto } from "@/shared/kernel/emoji";
import { normalizarNombre } from "@/shared/kernel/texto";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { CampoProducto } from "../../_components/autocompletar/campo-producto";
import { ETIQUETA_UNIDAD } from "../../_components/cantidad-pack";
import { SelectorEmoji } from "../../_components/selector-emoji";

/** Lo que se envía al guardar (el servidor lo aplica en todo el hogar). */
export interface CambiosProducto {
  readonly nombre: string;
  readonly productoBaseId: string | null;
  readonly categoria: CategoriaDto;
  readonly unidad: UnidadDto;
  /** Sin el campo: no se toca; null: se olvida. */
  readonly unidadesPorPack?: number | null;
  /** Sin el campo: no se toca; null: vuelve al de por defecto. */
  readonly emoji?: string | null;
}

type Props = {
  producto: MiProductoResponse | null;
  /** Los demás productos del hogar (nombre normalizado → nombre), para avisar al unir. */
  otros: ReadonlyMap<string, string>;
  onGuardar: (cambios: CambiosProducto) => void;
  onOlvidar: () => void;
  onCerrar: () => void;
};

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";
const select =
  "h-11 w-full rounded-lg bg-muted px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function EditarProductoDialog({ producto, ...resto }: Props) {
  return (
    <Dialog open={producto !== null} onOpenChange={(abierto) => !abierto && resto.onCerrar()}>
      <DialogContent>
        {producto && <Formulario key={producto.nombreNormalizado} producto={producto} {...resto} />}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  producto,
  otros,
  onGuardar,
  onOlvidar,
}: Omit<Props, "producto" | "onCerrar"> & { producto: MiProductoResponse }) {
  const { register, handleSubmit, setValue, watch } = useForm<{ nombre: string }>({
    defaultValues: { nombre: producto.nombre },
  });
  const [productoBaseId, setProductoBaseId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaDto>(producto.categoria);
  const [unidad, setUnidad] = useState<UnidadDto>(producto.unidad);
  const [porPack, setPorPack] = useState(producto.unidadesPorPack?.toString() ?? "");
  // undefined: sin tocar; null: volver al de por defecto.
  const [emoji, setEmoji] = useState<string | null | undefined>(undefined);
  const emojiElegido = emoji === undefined ? producto.emoji : emoji;
  const [error, setError] = useState<string | null>(null);
  const nombre = register("nombre");
  const escrito = normalizarNombre(watch("nombre") ?? "");
  const seUneCon =
    productoBaseId === null && escrito !== producto.nombreNormalizado
      ? otros.get(escrito)
      : undefined;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((v) => {
        const limpio = v.nombre.trim().replace(/\s+/g, " ");
        if (limpio === "" || limpio.length > 80) {
          setError("El nombre debe tener entre 1 y 80 caracteres");
          return;
        }
        let unidadesPorPack: number | null | undefined;
        if (porPack.trim() === "") {
          unidadesPorPack = producto.unidadesPorPack === null ? undefined : null;
        } else {
          const n = Number(porPack);
          if (!Number.isInteger(n) || n < 2 || n > 100) {
            setError("Un pack tiene entre 2 y 100 unidades");
            return;
          }
          unidadesPorPack = n;
        }
        onGuardar({
          nombre: limpio,
          productoBaseId,
          categoria,
          unidad,
          ...(unidadesPorPack === undefined ? {} : { unidadesPorPack }),
          ...(emoji === undefined ? {} : { emoji }),
        });
      })}
    >
      <DialogTitle>Editar producto</DialogTitle>
      <DialogDescription>
        Se cambia en todo el hogar: Mis productos, las listas activas y la despensa. Elige una
        sugerencia para unirlo a ese producto.
      </DialogDescription>
      <CampoProducto
        id="editar-mi-producto"
        campo={nombre}
        invalido={error !== null}
        className={campo}
        placeholder="Nombre del producto…"
        onElegir={(s) => {
          setValue("nombre", s.nombre);
          setProductoBaseId(s.productoBaseId);
          setCategoria(s.categoria);
          setUnidad(s.unidad);
          setError(null);
        }}
        onEscribir={() => {
          setProductoBaseId(null);
          setError(null);
        }}
      />
      {(productoBaseId !== null || seUneCon !== undefined) && (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {productoBaseId !== null
            ? "Se unirá al producto de la lista base."
            : `Se unirá con «${seUneCon}», que ya tienes.`}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Categoría
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaDto)}
            className={select}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {NOMBRE_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Unidad
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value as UnidadDto)}
            className={select}
          >
            {unidadSchema.options.map((u) => (
              <option key={u} value={u}>
                {ETIQUETA_UNIDAD[u]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">Emoji</p>
        <SelectorEmoji
          actual={emojiElegido ?? emojiPorDefecto(watch("nombre") ?? producto.nombre)}
          elegido={emojiElegido !== null}
          onElegir={setEmoji}
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        Se compra en packs de
        <Input
          type="number"
          inputMode="numeric"
          min="2"
          max="100"
          step="1"
          value={porPack}
          onChange={(e) => setPorPack(e.target.value)}
          placeholder="—"
          aria-label="Unidades por pack"
          className={`${campo} w-20`}
        />
        ud.
      </label>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" className="h-11 font-semibold">
        Guardar
      </Button>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onOlvidar}
          className="h-11 flex-1 font-semibold text-destructive"
        >
          <Trash2 aria-hidden="true" />
          Olvidar
        </Button>
        <DialogClose
          render={<Button type="button" variant="ghost" className="h-11 flex-1 font-semibold" />}
        >
          Cancelar
        </DialogClose>
      </div>
    </form>
  );
}
