"use client";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { CategoriaDto } from "@/contracts/categoria";
import type { UnidadDto } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { selectClase } from "./editar-linea-dialog";

export interface ProductoParaLista {
  readonly nombre: string;
  readonly productoBaseId: string | null;
  readonly categoria: CategoriaDto;
  readonly unidad: UnidadDto;
  /** Por qué se propone: "se ha acabado", "queda poco" o a petición. */
  readonly motivo: "acabado" | "poco" | "manual";
}

type Props = {
  producto: ProductoParaLista | null;
  listas: readonly { id: string; nombre: string }[];
  onAnadir: (producto: ProductoParaLista, listaId: string) => void;
  onCerrar: () => void;
};

const TITULO: Record<ProductoParaLista["motivo"], (nombre: string) => string> = {
  acabado: (n) => `Se ha acabado: ${n}`,
  poco: (n) => `Queda poco: ${n}`,
  manual: (n) => `Añadir ${n} a la lista`,
};

/** D8: lo que se acaba (o queda poco) vuelve a la lista con un toque. */
export function AnadirAListaDialog({ producto, listas, onAnadir, onCerrar }: Props) {
  const [listaId, setListaId] = useState<string | null>(null);
  const elegida = listaId ?? listas.at(0)?.id ?? null;

  return (
    <Dialog open={producto !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {producto && (
          <>
            <DialogTitle>{TITULO[producto.motivo](producto.nombre)}</DialogTitle>
            {listas.length === 0 ? (
              <DialogDescription>
                No tienes ninguna lista activa a la que añadirlo.
              </DialogDescription>
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
                <Button
                  onClick={() => elegida && onAnadir(producto, elegida)}
                  disabled={elegida === null}
                  className="h-11 font-semibold"
                >
                  <ShoppingCart aria-hidden="true" />
                  Añadir a {listas.find((l) => l.id === elegida)?.nombre ?? "la lista"}
                </Button>
              </>
            )}
            <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
              Ahora no
            </DialogClose>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
