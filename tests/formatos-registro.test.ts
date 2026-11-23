import { describe, expect, it } from "vitest";
import {
  decidirEmision,
  estadoTrasAccion,
  puedeResolverDocumentos,
  puedeSolicitarAnulacion,
  veTodoElRegistro,
  type DocumentoAbierto,
} from "../src/lib/formatos-registro";

const doc = (p: Partial<DocumentoAbierto>): DocumentoAbierto => ({
  id: "1",
  numero: "DOC-20261118-001",
  estado: "vigente",
  modo: "nuevo",
  original: "A",
  ...p,
});

describe("registro diario de documentos", () => {
  it("solo el admin anula, elimina o aprueba directamente", () => {
    expect(puedeResolverDocumentos("admin")).toBe(true);
    expect(puedeResolverDocumentos("colaborador")).toBe(false);
    expect(puedeResolverDocumentos("gerente")).toBe(false);
  });

  it("los colaboradores solicitan; la gerencia (solo lectura) no", () => {
    expect(puedeSolicitarAnulacion("colaborador")).toBe(true);
    expect(puedeSolicitarAnulacion("gerente")).toBe(false);
  });

  it("cada colaborador ve lo suyo; admin y gerencia ven todo", () => {
    expect(veTodoElRegistro("colaborador")).toBe(false);
    expect(veTodoElRegistro("admin")).toBe(true);
    expect(veTodoElRegistro("gerente")).toBe(true);
  });

  it("aprobar una anulación marca el documento anulado; una eliminación, eliminado", () => {
    expect(estadoTrasAccion("anular")).toBe("anulado");
    expect(estadoTrasAccion("eliminar")).toBe("eliminado");
  });

  it("el primer impreso registra un documento nuevo", () => {
    expect(decidirEmision(null, "A")).toBe("crear");
  });

  it("reabierto sin cambios es reimpresión; con cambios es documento nuevo", () => {
    expect(decidirEmision(doc({ modo: "reabierto" }), "A")).toBe("reimprimir");
    expect(decidirEmision(doc({ modo: "reabierto" }), "B")).toBe("crear");
  });

  it("imprimir otro documento con datos distintos crea uno nuevo, sin sobrescribir el anterior", () => {
    expect(decidirEmision(doc({ modo: "nuevo" }), "B")).toBe("crear");
  });

  it("volver a imprimir el mismo documento sin cambios es reimpresión", () => {
    expect(decidirEmision(doc({ modo: "nuevo" }), "A")).toBe("reimprimir");
  });

  it("un documento anulado no se vuelve a registrar", () => {
    expect(decidirEmision(doc({ estado: "anulado", modo: "reabierto" }), "A")).toBe("ninguna");
  });
});

import { hoyPanama } from "../src/lib/formatos-registro";
describe("fecha del registro", () => {
  it("usa la fecha de Panamá (UTC-5): 01:40 UTC del 19 es aún el 18", () => {
    expect(hoyPanama(new Date("2026-11-19T01:40:00Z"))).toBe("2026-11-18");
  });
});
