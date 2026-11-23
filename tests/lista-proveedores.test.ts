import { describe, expect, it } from "vitest";
import { esSoloEnlace, leerArticulosCopiados, leerPrecio } from "../src/lib/lista-proveedores";

describe("artículo copiado de la lista de precios de proveedores", () => {
  it("lee precios con B/., $ y miles", () => {
    expect(leerPrecio("B/. 1,250.50")).toBe(1250.5);
    expect(leerPrecio("$399.99")).toBe(399.99);
  });

  it("líneas con etiquetas: modelo, descripción y precio", () => {
    expect(leerArticulosCopiados("Modelo: WT19DSB\nDescripción: Lavadora LG 19 kg carga superior\nPrecio: $489.00")).toEqual([
      { modelo: "WT19DSB", descripcion: "Lavadora LG 19 kg carga superior", precio: 489 },
    ]);
  });

  it("fila de tabla copiada con tabuladores", () => {
    expect(leerArticulosCopiados("RT38K5930SL\tRefrigeradora Samsung 13 pies inverter\tB/. 725.00")).toEqual([
      { modelo: "RT38K5930SL", descripcion: "Refrigeradora Samsung 13 pies inverter", precio: 725 },
    ]);
  });

  it("texto con guiones: modelo - descripción - precio", () => {
    expect(leerArticulosCopiados("MS-1102 - Microondas Mabe 1.1 pies - $95.50")).toEqual([
      { modelo: "MS-1102", descripcion: "Microondas Mabe 1.1 pies", precio: 95.5 },
    ]);
  });

  it("JSON con varios artículos", () => {
    expect(
      leerArticulosCopiados('[{"modelo":"A1","descripcion":"Estufa 4 hornillas","precio":210},{"model":"B22","name":"Abanico","price":"$35"}]'),
    ).toEqual([
      { modelo: "A1", descripcion: "Estufa 4 hornillas", precio: 210 },
      { modelo: "B22", descripcion: "Abanico", precio: 35 },
    ]);
  });

  it("tabla con encabezado ubica las columnas por nombre", () => {
    expect(leerArticulosCopiados("Código\tArtículo\tCosto\nX9\tSilla plástica\t12.50")).toEqual([
      { modelo: "X9", descripcion: "Silla plástica", precio: 12.5 },
    ]);
  });

  it("texto sin precio no agrega nada", () => {
    expect(leerArticulosCopiados("Hola, ¿cómo estás?")).toEqual([]);
  });

  it("«Copiar enlace» no agrega un artículo y se distingue de «Copiar ficha»", () => {
    const enlace = "https://claude.ai/artifact/MTi9cm8qKR35HAj3MjkMhQ";
    expect(esSoloEnlace(enlace)).toBe(true);
    expect(leerArticulosCopiados(enlace)).toEqual([]);
    expect(esSoloEnlace("Modelo: WT19DSB\nDescripción: Lavadora LG 19 kg\nPrecio: $489.00")).toBe(false);
  });
});

import { articuloAProducto, esProductoVacio } from "../src/lib/lista-proveedores-producto";
import { nuevoProducto } from "../src/lib/pricing-gbd";

describe("artículo copiado → producto de la cotización", () => {
  it("llena modelo, descripción y precio de proveedor", () => {
    const p = articuloAProducto({ modelo: "RT38K5930SL", descripcion: "Refrigeradora Samsung 13 pies", precio: 725 });
    expect(p.referencia).toBe("RT38K5930SL");
    expect(p.nombre).toBe("RT38K5930SL");
    expect(p.descripcion).toBe("Refrigeradora Samsung 13 pies");
    expect(p.precioProveedor).toBe("725");
    expect(p.precioEtiqueta).toBe("");
  });

  it("la fila vacía inicial se reemplaza, una con datos no", () => {
    expect(esProductoVacio(nuevoProducto())).toBe(true);
    expect(esProductoVacio({ ...nuevoProducto(), precioProveedor: "10" })).toBe(false);
  });
});
