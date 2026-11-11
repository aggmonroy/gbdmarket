import { describe, expect, it } from "vitest";
import { fechaLarga, periodoFiscal } from "../src/lib/orden-combustible";

describe("Orden de combustible", () => {
  it("el número de orden sigue el periodo fiscal agosto–julio", () => {
    expect(periodoFiscal("2026-11-11")).toBe("2026-2027");
    expect(periodoFiscal("2026-08-01")).toBe("2026-2027");
    expect(periodoFiscal("2026-07-31")).toBe("2025-2026");
  });
  it("muestra la fecha completa en español", () => {
    expect(fechaLarga("2026-11-11")).toBe("miércoles, 11 de noviembre de 2026");
  });
});
