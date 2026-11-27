import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { consolidarInventario, type MovimientoTraslado } from "@/lib/formatos";
import { listarTrasladosInventario } from "@/lib/formatos-registro.functions";

/** Inventario consolidado por sucursal a partir de los traslados impresos o descargados. */
export function InventarioPanel({ token, onVolver }: { token: string; onVolver: () => void }) {
  const [movs, setMovs] = useState<MovimientoTraslado[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    listarTrasladosInventario({ data: { token } })
      .then(setMovs)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el inventario"));
  }, [token]);
  const inv = useMemo(() => consolidarInventario(movs ?? []), [movs]);
  const filtro = q.trim().toLowerCase();
  const sucursales = Object.keys(inv);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onVolver}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver a formatos
      </Button>
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Boxes className="h-5 w-5 text-primary" /> Inventario por sucursal
        </h2>
        <p className="text-sm text-muted-foreground">
          Se arma solo con los traslados impresos o descargados: la cantidad entra a la sucursal de destino y sale de la
          de origen. Los traslados anulados o eliminados no cuentan.
        </p>
      </div>
      <Input placeholder="Buscar artículo o código" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!movs && !error && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {movs && sucursales.length === 0 && (
        <p className="text-sm text-muted-foreground">Aún no hay traslados registrados.</p>
      )}
      {sucursales.map((s) => {
        const filas = (inv[s] ?? []).filter(
          (e) => !filtro || e.articulo.toLowerCase().includes(filtro) || e.codigo.toLowerCase().includes(filtro),
        );
        if (!filas.length) return null;
        return (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-2">Artículo</th>
                    <th className="py-1 pr-2">Código</th>
                    <th className="py-1 pr-2 text-right">Recibido</th>
                    <th className="py-1 pr-2 text-right">Enviado</th>
                    <th className="py-1 text-right">Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((e) => (
                    <tr key={`${e.codigo}|${e.articulo}`} className="border-t">
                      <td className="py-1 pr-2">{e.articulo || "—"}</td>
                      <td className="py-1 pr-2">{e.codigo || "—"}</td>
                      <td className="py-1 pr-2 text-right">{e.entradas}</td>
                      <td className="py-1 pr-2 text-right">{e.salidas}</td>
                      <td className={`py-1 text-right font-semibold ${e.disponible < 0 ? "text-destructive" : ""}`}>
                        {e.disponible}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
