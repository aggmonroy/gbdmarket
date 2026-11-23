import { nuevoProducto, type ProductoInput } from "./pricing-gbd";
import type { ArticuloCopiado } from "./lista-proveedores";

/** Convierte un artículo copiado de la lista en un producto de la cotización (precio de proveedor). */
export function articuloAProducto(a: ArticuloCopiado): ProductoInput {
  const descripcion = [a.descripcion, a.proveedor && `Proveedor: ${a.proveedor}`].filter(Boolean).join(" · ");
  return {
    ...nuevoProducto(),
    nombre: a.modelo || a.descripcion,
    referencia: a.modelo,
    descripcion,
    precioProveedor: String(a.precio),
  };
}

/** Fila sin datos (la que trae la calculadora al abrir): se reemplaza al agregar artículos. */
export function esProductoVacio(p: ProductoInput): boolean {
  return (
    !p.catalogProductId &&
    !String(p.nombre ?? "").trim() &&
    !String(p.descripcion ?? "").trim() &&
    !String(p.referencia ?? "").trim() &&
    !String(p.precioProveedor ?? "").trim() &&
    !String(p.precioEtiqueta ?? "").trim() &&
    !String(p.precioUnitario ?? "").trim() &&
    !p.imagen
  );
}
