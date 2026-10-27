import { leerDatosProveedor, LUGAR_COMPRA_GARANTIA, TELEFONO_REPORTA_GARANTIA } from './garantia-datos-proveedor';

export type GarantiaProveedor = {
  numero_garantia: string; fecha: string; cliente: string;
  sucursal?: string | null; cedula_cliente?: string | null; telefono_cliente?: string | null;
  direccion_cliente?: string | null; modelo_codigo?: string | null; numero_serie?: string | null;
  marca?: string | null; proveedor?: string | null; numero_factura?: string | null;
  fecha_facturacion?: string | null; descripcion_articulo?: string | null; accion_realizada?: string | null;
  dentro_15_dias: boolean; no_mal_uso: boolean; estado: string; fecha_cierre?: string | null;
  datos_proveedor?: unknown;
};

export function tituloProveedor(g: GarantiaProveedor) {
  return ['REPORTE DE GARANTÍA', g.marca?.trim(), g.proveedor?.trim()].filter(Boolean).join(' · ');
}

export function filasProveedor(g: GarantiaProveedor, colaborador?: string | null): [string, string][] {
  const datos = leerDatosProveedor(g.datos_proveedor, g.sucursal);
  const dato = (v?: string | null) => v?.trim() || '—';
  return [
    ['Fecha Solicitud', dato(g.fecha)],
    ['Nombre y Apellido Cliente', dato(g.cliente)],
    ['Contacto en tienda', dato(colaborador)],
    ['Teléfono móvil', dato(g.telefono_cliente)],
    ['País', dato(datos.pais)],
    ['Provincia', dato(datos.provincia)], ['Distrito', dato(datos.distrito)], ['Corregimiento', dato(datos.corregimiento)],
    ['Dirección Cliente', dato(g.direccion_cliente)],
    ['Nr. Orden Trabajo / Incidencia', g.numero_garantia],
    ['Producto', dato(g.descripcion_articulo)],
    ['FALLA REPORTADA', dato(g.descripcion_articulo)],
    ['Modelo', dato(g.modelo_codigo)], ['Nr. Serial', dato(g.numero_serie)],
    ['Fecha de compra', dato(g.fecha_facturacion)], ['Nr. Factura', dato(g.numero_factura)],
    ['Tipo de servicio (Garantía / Facturado)', datos.tipo_servicio],
    ['Lugar de compra', `${LUGAR_COMPRA_GARANTIA} · ${datos.sucursal_compra}`],
    ['Nombre de la persona que reporta el servicio', dato(colaborador)],
    ['Teléfono de la persona que reporta el servicio', TELEFONO_REPORTA_GARANTIA],
    ['Taller solicitado por el cliente', '—'],
    ['Marca', dato(g.marca)], ['Proveedor', dato(g.proveedor)],
    ['Cédula del cliente', dato(g.cedula_cliente)],
  ];
}