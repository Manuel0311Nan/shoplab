"use client";
import { useState } from "react";
import type { LineaDespensaResponse } from "@/contracts/pantry";
import { Dia, sumarDias } from "@/shared/kernel/dia";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

type Props = {
  linea: LineaDespensaResponse | null;
  /** Hoy en la zona del hogar (lo manda el servidor). */
  hoy: string;
  onAbrir: (linea: LineaDespensaResponse, abiertoEl: string) => void;
  onCerrar: () => void;
};

/**
 * «Lo he abierto»: ¿cuándo? Hoy o ayer con un toque; otro día con el calendario.
 * No cambia la caducidad: solo avisa para que revises si sigue bueno.
 */
export function AbrirDialog({ linea, hoy, onAbrir, onCerrar }: Props) {
  return (
    <Dialog open={linea !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {linea && <Formulario key={linea.id} linea={linea} hoy={hoy} onAbrir={onAbrir} />}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  linea,
  hoy,
  onAbrir,
}: {
  linea: LineaDespensaResponse;
  hoy: string;
  onAbrir: Props["onAbrir"];
}) {
  const [otroDia, setOtroDia] = useState("");
  const hoyDia = Dia.create(hoy);
  const ayer = hoyDia.ok ? sumarDias(hoyDia.value, -1) : null;
  const varias = linea.cantidad.unidad === "unidad" && linea.cantidad.valor > 1;

  return (
    <>
      <DialogTitle>¿Cuándo abriste {linea.nombre}?</DialogTitle>
      <DialogDescription>
        Te avisaremos cuando toque revisar si sigue bueno: verde, amarillo y rojo según los días que
        lleve abierto. La fecha de caducidad no cambia.
        {varias && ` Se abre 1 de las ${linea.cantidad.valor} ud.; el resto sigue cerrado.`}
      </DialogDescription>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => onAbrir(linea, hoy)} className="h-11 font-semibold">
          Hoy
        </Button>
        <Button
          variant="outline"
          disabled={ayer === null}
          onClick={() => ayer && onAbrir(linea, ayer)}
          className="h-11 font-semibold"
        >
          Ayer
        </Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (otroDia !== "") onAbrir(linea, otroDia);
        }}
        className="flex items-end gap-2"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
          Otro día
          <Input
            type="date"
            max={hoy}
            value={otroDia}
            onChange={(e) => setOtroDia(e.target.value)}
            className="h-11"
          />
        </label>
        <Button type="submit" variant="outline" disabled={otroDia === ""} className="h-11">
          Guardar
        </Button>
      </form>
      <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
        Cancelar
      </DialogClose>
    </>
  );
}
