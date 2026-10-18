"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Props = { onCrear: (nombre: string) => void; creando: boolean };

export function NuevaListaForm({ onCrear, creando }: Props) {
  const [nombre, setNombre] = useState("");
  const limpio = nombre.trim();

  return (
    <form
      aria-label="Nueva lista"
      className="flex gap-2 rounded-xl bg-card p-4 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (limpio !== "") onCrear(limpio);
      }}
    >
      <Input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nueva lista…"
        aria-label="Nombre de la nueva lista"
        maxLength={80}
        autoComplete="off"
        className="h-11 flex-1 rounded-lg border-transparent bg-muted md:text-base"
      />
      <Button
        type="submit"
        disabled={limpio === "" || creando}
        className="h-11 px-4 text-sm font-semibold"
      >
        <Plus aria-hidden="true" />
        {creando ? "Creando…" : "Crear"}
      </Button>
    </form>
  );
}
