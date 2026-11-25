import { describe, expect, it } from "vitest";
import { aplicarComunes, expedienteInicial, paginasExpediente, vistaApc, vistaDeclaracion, vistaLey81 } from "../src/lib/expediente-credito";

describe("expediente de crédito", () => {
  it("datos del cliente y APC en la primera hoja, Ley 81 en la segunda, declaración aparte", () => {
    expect(paginasExpediente({ cliente: true, apc: true, ley81: true, declaracion: true })).toEqual([["cliente", "apc"], ["ley81"], ["declaracion"]]);
  });
  it("un documento quitado no deja hoja vacía", () => {
    expect(paginasExpediente({ cliente: false, apc: true, ley81: false, declaracion: true })).toEqual([["apc"], ["declaracion"]]);
  });
  it("los datos del cliente llenan APC, Ley 81 y declaración", () => {
    let e = expedienteInicial();
    e = { ...e, cliente: { ...e.cliente, nombre: "Ana Gomez", cedula: "7-111-222", numeroCliente: "C-45", provincia: "Los Santos", distrito: "Las Tablas" } };
    expect(vistaApc(e)).toEqual({ nombre: "Ana Gomez", cedula: "7-111-222" });
    expect(vistaLey81(e).nombre).toBe("Ana Gomez");
    const d = vistaDeclaracion(e);
    expect(d.cedula).toBe("7-111-222");
    expect(d.numeroCliente).toBe("C-45");
    expect(d.direccion).toBe("Las Tablas, Los Santos");
  });
  it("cambiar el nombre en la APC lo cambia en los datos del cliente", () => {
    const e = aplicarComunes(expedienteInicial(), { nombre: "Luis Pérez" });
    expect(e.cliente.nombre).toBe("Luis Pérez");
  });
});
