import { describe, expect, it } from "vitest";
import { consolidarInventario } from "../src/lib/formatos";

const l = (articulo: string, cantidad: string, codigo = "") => ({ articulo, cantidad, codigo, precio: "" });

describe("inventario por sucursal desde traslados", () => {
  it("suma en el destino y resta del origen", () => {
    const inv = consolidarInventario([
      { numero: "1", fecha: "2026-11-27", origen: "Las Tablas", destino: "Tonosí", lineas: [l("Refri", "3", "RT38")] },
      { numero: "2", fecha: "2026-11-27", origen: "Las Tablas", destino: "Tonosí", lineas: [l("Refri", "2", "rt38"), l("", "")] },
      { numero: "3", fecha: "2026-11-28", origen: "Tonosí", destino: "Las Tablas", lineas: [l("Refri", "1", "RT38")] },
    ]);
    expect(inv["Tonosí"]?.[0]).toMatchObject({ entradas: 5, salidas: 1, disponible: 4 });
    expect(inv["Las Tablas"]?.[0]).toMatchObject({ entradas: 1, salidas: 5, disponible: -4 });
  });
});
