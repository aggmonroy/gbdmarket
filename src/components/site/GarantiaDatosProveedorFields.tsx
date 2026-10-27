import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LUGAR_COMPRA_GARANTIA, TELEFONO_REPORTA_GARANTIA, SUCURSALES_COMPRA_GARANTIA, type DatosFormularioProveedor } from '@/lib/garantia-datos-proveedor';

export function GarantiaDatosProveedorFields({ datos, direccion, onDatos, onDireccion }: {
  datos: DatosFormularioProveedor; direccion: string;
  onDatos: (datos: DatosFormularioProveedor) => void; onDireccion: (direccion: string) => void;
}) {
  return <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Dirección detallada cliente</Label>
      <Textarea aria-label="Dirección detallada cliente" maxLength={400} rows={3} value={direccion} onChange={e => onDireccion(e.target.value)} />
    </div>
    {([['pais', 'País'], ['provincia', 'Provincia'], ['distrito', 'Distrito'], ['corregimiento', 'Corregimiento']] as const).map(([key, label]) =>
      <div key={key} className="space-y-1.5">
        <Label>{label}</Label>
        <Input aria-label={label} maxLength={100} value={datos[key]} onChange={e => onDatos({ ...datos, [key]: e.target.value })} />
      </div>
    )}
    <div className="space-y-1.5">
      <Label>Tipo de servicio</Label>
      <Select value={datos.tipo_servicio} onValueChange={value => { if (value === 'Garantía' || value === 'Facturado') onDatos({ ...datos, tipo_servicio: value }); }}>
        <SelectTrigger aria-label="Tipo de servicio"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="Garantía">Garantía</SelectItem><SelectItem value="Facturado">Facturado</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="space-y-1.5">
      <Label>Sucursal de compra</Label>
      <Select value={datos.sucursal_compra} onValueChange={value => { const sucursal = SUCURSALES_COMPRA_GARANTIA.find(s => s === value); if (sucursal) onDatos({ ...datos, sucursal_compra: sucursal }); }}>
        <SelectTrigger aria-label="Sucursal de compra"><SelectValue /></SelectTrigger>
        <SelectContent>{SUCURSALES_COMPRA_GARANTIA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Lugar de compra</Label><p className="text-sm text-foreground">{LUGAR_COMPRA_GARANTIA}</p>
    </div>
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Teléfono de quien reporta el servicio</Label><Input aria-label="Teléfono de quien reporta el servicio" value={TELEFONO_REPORTA_GARANTIA} readOnly />
    </div>
  </div>;
}