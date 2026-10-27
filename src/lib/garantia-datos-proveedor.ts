import { z } from 'zod';

export const LUGAR_COMPRA_GARANTIA = 'Cooperativa de Servicios Integrales Gladys B. de Ducasa, R.L.';
export const TELEFONO_REPORTA_GARANTIA = '67841941';
export const SUCURSALES_COMPRA_GARANTIA = ['Casa Matriz', 'Tonosí', 'El Progreso', 'Mueblería'] as const;
export const formularioProveedorSchema = z.object({
  pais: z.string().trim().max(100).default('Panamá'),
  provincia: z.string().trim().max(100).default(''),
  distrito: z.string().trim().max(100).default(''),
  corregimiento: z.string().trim().max(100).default(''),
  tipo_servicio: z.enum(['Garantía', 'Facturado']).default('Garantía'),
  sucursal_compra: z.enum(SUCURSALES_COMPRA_GARANTIA).default('Mueblería'),
});
export type DatosFormularioProveedor = z.infer<typeof formularioProveedorSchema>;
export const DATOS_PROVEEDOR_VACIOS = formularioProveedorSchema.parse({});
export function leerDatosProveedor(valor: unknown, sucursal?: string | null): DatosFormularioProveedor {
  const base = { ...DATOS_PROVEEDOR_VACIOS, sucursal_compra: sucursal === 'tonosi' ? 'Tonosí' : 'Mueblería' };
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return formularioProveedorSchema.parse(base);
  const resultado = formularioProveedorSchema.safeParse({ ...base, ...valor });
  return resultado.success ? resultado.data : formularioProveedorSchema.parse(base);
}