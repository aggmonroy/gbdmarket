import { describe, expect, it } from 'vitest';
import { filasProveedor, tituloProveedor, type GarantiaProveedor } from '../src/lib/garantia-proveedor';
import { crearGarantiaSchema, datosProveedorSchema } from '../src/lib/garantias.schemas';

const garantia: GarantiaProveedor = { numero_garantia: '2026-10-24-0001', fecha: '2026-10-24', cliente: 'Cliente de prueba', numero_serie: 'SN123', marca: 'Marca de prueba', proveedor: 'Proveedor de prueba', modelo_codigo: 'M123', dentro_15_dias: true, no_mal_uso: true, estado: 'proceso', sucursal: 'tonosi' };
describe('Datos de garantía para proveedor', () => {
  it('incluye marca y proveedor del caso en el título', () => {
    expect(tituloProveedor(garantia)).toBe('REPORTE DE GARANTÍA · Marca de prueba · Proveedor de prueba');
  });
  it('conserva modelo y serie y usa el teléfono de la sucursal del trámite', () => {
    const rows = new Map(filasProveedor(garantia, 'Asesor'));
    expect(rows.get('Modelo')).toBe('M123');
    expect(rows.get('Nr. Serial')).toBe('SN123');
    expect(rows.get('Teléfono de la persona que reporta el servicio')).toBe('50768711242');
  });
  it('no inventa los datos que el formulario no recopila', () => {
    const rows = new Map(filasProveedor(garantia));
    expect(rows.get('Provincia')).toBe('—');
    expect(rows.get('Taller solicitado por el cliente')).toBe('—');
  });
  it('no incluye acciones ni seguimiento interno', () => {
    const rows = new Map(filasProveedor({ ...garantia, accion_realizada: 'Nota interna' }));
    for (const k of ['Acción realizada', 'Siguiente paso', 'Estado', 'Fecha de cierre', 'Examen descarta mal uso', 'Dentro de los primeros 15 días']) expect(rows.has(k)).toBe(false);
  });
  it('acepta los nuevos datos y permite garantías anteriores sin ellos', () => {
    const input = { ...garantia, token: 'test-token', pin: '1234' };
    expect(crearGarantiaSchema.parse(input).numero_serie).toBe('SN123');
    expect(crearGarantiaSchema.parse({ ...input, numero_serie: undefined }).numero_serie).toBeUndefined();
    expect(datosProveedorSchema.safeParse({ token: 'test-token', garantia_id: '00000000-0000-4000-8000-000000000001', numero_serie: 'SN123', marca: 'Marca', proveedor: 'Proveedor' }).success).toBe(true);
  });
});