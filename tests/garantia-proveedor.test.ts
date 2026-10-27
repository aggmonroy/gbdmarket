import { describe, expect, it } from 'vitest';
import { filasProveedor, tituloProveedor, type GarantiaProveedor } from '../src/lib/garantia-proveedor';
import { crearGarantiaSchema, datosProveedorSchema } from '../src/lib/garantias.schemas';
import { formularioProveedorSchema } from '../src/lib/garantia-datos-proveedor';

const garantia: GarantiaProveedor = { numero_garantia: '2026-10-24-0001', fecha: '2026-10-24', cliente: 'Cliente de prueba', numero_serie: 'SN123', marca: 'Marca de prueba', proveedor: 'Proveedor de prueba', modelo_codigo: 'M123', dentro_15_dias: true, no_mal_uso: true, estado: 'proceso', sucursal: 'tonosi' };
describe('Datos de garantía para proveedor', () => {
  it('conserva la dirección detallada y la ubicación del cliente', () => {
    const datos = { pais: 'Panamá', provincia: 'Los Santos', distrito: 'Las Tablas', corregimiento: 'La Palma', tipo_servicio: 'Facturado', sucursal_compra: 'El Progreso' };
    const input = crearGarantiaSchema.parse({ ...garantia, token: 'test-token', pin: '1234', direccion_cliente: 'Calle principal, casa 25', datos_proveedor: datos });
    const rows = new Map(filasProveedor(input));
    expect(rows.get('Dirección Cliente')).toBe('Calle principal, casa 25');
    expect(rows.get('País')).toBe('Panamá');
    expect(rows.get('Provincia')).toBe('Los Santos');
    expect(rows.get('Distrito')).toBe('Las Tablas');
    expect(rows.get('Corregimiento')).toBe('La Palma');
  });
  it.each(['Garantía', 'Facturado'])('acepta tipo de servicio %s y rechaza otros', tipo_servicio => {
    expect(formularioProveedorSchema.parse({ tipo_servicio }).tipo_servicio).toBe(tipo_servicio);
    expect(formularioProveedorSchema.safeParse({ tipo_servicio: 'Otro' }).success).toBe(false);
  });
  it.each(['Casa Matriz', 'Tonosí', 'El Progreso', 'Mueblería'])('usa lugar fijo con sucursal de compra %s sin cambiar seguimiento', sucursal_compra => {
    const datos = formularioProveedorSchema.parse({ sucursal_compra, tipo_servicio: 'Facturado' });
    const rows = new Map(filasProveedor({ ...garantia, datos_proveedor: datos }));
    expect(rows.get('Lugar de compra')).toBe(`Cooperativa de Servicios Integrales Gladys B. de Ducasa, R.L. · ${sucursal_compra}`);
    expect(rows.get('Tipo de servicio (Garantía / Facturado)')).toBe('Facturado');
    expect(rows.get('Teléfono de la persona que reporta el servicio')).toBe('67841941');
    expect(formularioProveedorSchema.safeParse({ sucursal_compra: 'Otra' }).success).toBe(false);
  });
  it('incluye marca y proveedor del caso en el título', () => {
    expect(tituloProveedor(garantia)).toBe('REPORTE DE GARANTÍA · Marca de prueba · Proveedor de prueba');
  });
  it('conserva modelo y serie y usa el teléfono fijo de quien reporta', () => {
    const rows = new Map(filasProveedor(garantia, 'Asesor'));
    expect(rows.get('Modelo')).toBe('M123');
    expect(rows.get('Nr. Serial')).toBe('SN123');
    expect(rows.get('Teléfono de la persona que reporta el servicio')).toBe('67841941');
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