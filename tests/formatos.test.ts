import { describe, expect, it } from "vitest";
import {
  arqueoInicial,
  calcularArqueo,
  estadoDiferencia,
  totalPedido,
  totalesHoras,
  totalesTraslado,
} from "../src/lib/formatos";

describe("Arqueo de caja", () => {
  it("suma efectivo, Yappy, ACH y demás, resta el fondo de 500 y compara con recibos", () => {
    const a = arqueoInicial("caja");
    expect(a.fondo).toBe("500");
    a.billetes = ["0", "0", "3", "6", "75", "0"]; // 60 + 60 + 375 = 495
    a.monedas = ["0", "37", "0", "45", "16", "30", "25"]; // 37 + 11.25 + 1.6 + 1.5 + 0.25 = 51.60
    a.otros = ["0", "0", "20", "10", "0"]; // Yappy 20, ACH 10
    a.recibos = "70";
    const r = calcularArqueo(a);
    expect(r.efectivo).toBe(546.6);
    expect(r.totalDinero).toBe(576.6);
    expect(r.totalIngreso).toBe(76.6);
    expect(r.diferencia).toBe(6.6);
    expect(r.estado).toBe("Sobrante");
  });

  it("caja menuda usa comprobantes y fondo de 100", () => {
    const a = arqueoInicial("caja-menuda");
    expect(a.fondo).toBe("100");
    expect(a.otros).toHaveLength(1);
    a.billetes = ["0", "0", "2", "0", "0", "0"];
    a.otros = ["60"];
    expect(calcularArqueo(a).totalIngreso).toBe(0);
  });

  it("marca faltante, sobrante o no hay", () => {
    expect(estadoDiferencia(-0.01)).toBe("Faltante");
    expect(estadoDiferencia(0)).toBe("No hay");
    expect(estadoDiferencia(0.000001)).toBe("No hay");
    expect(estadoDiferencia(2)).toBe("Sobrante");
  });
});

describe("Pedido, traslados y horas", () => {
  it("pedido: total = cantidad × precio", () => {
    expect(
      totalPedido([
        { cantidad: "2", unidad: "UNIDADES", modelo: "", descripcion: "", precio: "125.50" },
        { cantidad: "3", unidad: "BULTOS", modelo: "", descripcion: "", precio: "10" },
      ]),
    ).toBe(281);
  });
  it("traslado: suma cantidades y precios", () => {
    expect(
      totalesTraslado([
        { articulo: "a", cantidad: "1", codigo: "", precio: "300" },
        { articulo: "b", cantidad: "1", codigo: "", precio: "45.5" },
      ]),
    ).toEqual({ cantidad: 2, precio: 345.5 });
  });
  it("horas: los descuentos negativos restan del total", () => {
    const l = { fecha: "", desde: "", hasta: "", justificacion: "" };
    expect(
      totalesHoras([
        { ...l, horas: "1", aplicable: "1" },
        { ...l, horas: "-0.5", aplicable: "-0.5" },
        { ...l, horas: "4.5", aplicable: "4" },
      ]),
    ).toEqual({ horas: 5, aplicable: 4.5 });
  });
});
