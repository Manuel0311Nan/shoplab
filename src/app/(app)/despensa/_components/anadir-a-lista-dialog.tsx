"use client";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { CategoriaDto } from "@/contracts/categoria";
import type { PacksRecordados } from "@/contracts/memoria";
import type { CantidadDto, UnidadDto } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  aCantidadDeLista,
  ETIQUETA_UNIDAD,
  propuestaDeUnidad,
  UNIDADES_ELEGIBLES,
  type UnidadElegida,
} from "../../_components/cantidad-pack";
import { selectClase } from "./editar-linea-dialog";

export interface ProductoParaLista {
  readonly nombre: string;
  readonly productoBaseId: string | null;
  readonly categoria: CategoriaDto;
  readonly unidad: UnidadDto;
  /** Por qué se propone: "se ha acabado", "queda poco" o a petición. */
  readonly motivo: "acabado" | "poco" | "manual";
}

/** Lo que se pide en el diálogo, ya en unidades si es por packs. */
export interface CantidadParaLista {
  readonly cantidad: CantidadDto;
  readonly unidadesPorPack: number | null;
}

type Props = {
  producto: ProductoParaLista | null;
  listas: readonly { id: string; nombre: string }[];
  /** Memoria del hogar: si se compra por packs, se propone el pack. */
  packs?: PacksRecordados;
  onAnadir: (producto: ProductoParaLista, listaId: string, cantidad: CantidadParaLista) => void;
  onCerrar: () => void;
};

const TITULO: Record<ProductoParaLista["motivo"], (nombre: string) => string> = {
  acabado: (n) => `Se ha acabado: ${n}`,
  poco: (n) => `Queda poco: ${n}`,
  manual: (n) => `Añadir ${n} a la lista`,
};

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";

/**
 * D8: lo que se acaba (o queda poco) vuelve a la lista con un toque. Propone 1 en su
 * unidad, o 1 pack si el hogar lo compra así; se puede cambiar antes de añadir.
 */
export function AnadirAListaDialog({ producto, listas, packs = {}, onAnadir, onCerrar }: Props) {
  return (
    <Dialog open={producto !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {producto && (
          <Formulario
            key={`${producto.nombre}-${producto.motivo}`}
            producto={producto}
            listas={listas}
            packs={packs}
            onAnadir={onAnadir}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  producto,
  listas,
  packs,
  onAnadir,
}: {
  producto: ProductoParaLista;
  listas: Props["listas"];
  packs: PacksRecordados;
  onAnadir: Props["onAnadir"];
}) {
  const propuesta = propuestaDeUnidad(packs, producto.nombre, producto.unidad);
  const [listaId, setListaId] = useState<string | null>(null);
  const [valor, setValor] = useState("1");
  const [unidad, setUnidad] = useState<UnidadElegida>(propuesta.unidad);
  const [porPack, setPorPack] = useState(propuesta.porPack);
  const [error, setError] = useState<string | null>(null);
  const elegida = listaId ?? listas.at(0)?.id ?? null;

  function anadir() {
    if (elegida === null) return;
    const r = aCantidadDeLista(Number(valor), unidad, porPack);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    onAnadir(producto, elegida, { cantidad: r.cantidad, unidadesPorPack: r.unidadesPorPack });
  }

  return (
    <>
      <DialogTitle>{TITULO[producto.motivo](producto.nombre)}</DialogTitle>
      {listas.length === 0 ? (
        <DialogDescription>No tienes ninguna lista activa a la que añadirlo.</DialogDescription>
      ) : (
        <>
          <DialogDescription>¿Lo añades a la lista de la compra?</DialogDescription>
          {listas.length > 1 && (
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Lista
              <select
                value={elegida ?? ""}
                onChange={(e) => setListaId(e.target.value)}
                className={selectClase}
              >
                {listas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">Cantidad</legend>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                aria-label="Cantidad"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={`${campo} w-24`}
              />
              <select
                aria-label="Unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value as UnidadElegida)}
                className={`${selectClase} flex-1`}
              >
                {UNIDADES_ELEGIBLES.map((u) => (
                  <option key={u} value={u}>
                    {ETIQUETA_UNIDAD[u]}
                  </option>
                ))}
              </select>
            </div>
            {unidad === "pack" && (
              <label className="flex items-center gap-2 text-sm font-semibold">
                de
                <Input
                  type="number"
                  inputMode="numeric"
                  min="2"
                  max="100"
                  step="1"
                  value={porPack}
                  onChange={(e) => setPorPack(e.target.value)}
                  aria-label="Unidades por pack"
                  className={`${campo} w-20`}
                />
                ud. por pack
              </label>
            )}
          </fieldset>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button onClick={anadir} disabled={elegida === null} className="h-11 font-semibold">
            <ShoppingCart aria-hidden="true" />
            Añadir a {listas.find((l) => l.id === elegida)?.nombre ?? "la lista"}
          </Button>
        </>
      )}
      <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
        Ahora no
      </DialogClose>
    </>
  );
}
