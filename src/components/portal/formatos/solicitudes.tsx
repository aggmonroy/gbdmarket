import { KeyRound, Wrench } from "lucide-react";
import { fechaCorta, hoyISO } from "@/lib/formatos";
import { Celda, EditorFormato, Encabezado, LineaDato, nombreArchivo, useBorrador } from "./hoja";

export const TIPOS_ROL = [
  "CREACIÓN DE USUARIO",
  "ASIGNACIÓN DE ROLES",
  "CREACIÓN DE CORREO ELECTRÓNICO",
  "DAR DE BAJA UN USUARIO",
  "DESACTIVAR ROLES",
] as const;

type Informatica = { recibido: string; recibidoFecha: string; tramitado: string; tramitadoFecha: string; notificacion: string; notificacionFecha: string };
const informaticaVacia = (): Informatica => ({ recibido: "", recibidoFecha: "", tramitado: "", tramitadoFecha: "", notificacion: "", notificacionFecha: "" });

function FirmaFecha({ nombre, fecha, onNombre, onFecha, pie, pieFecha }: { nombre: string; fecha: string; onNombre: (v: string) => void; onFecha: (v: string) => void; pie: string; pieFecha: string }) {
  return (
    <div className="fmt-firmas">
      <LineaDato value={nombre} onChange={onNombre} pie={pie} bold />
      <LineaDato value={fecha} onChange={onFecha} pie={pieFecha} type="date" mostrar={fechaCorta(fecha)} />
    </div>
  );
}

function SeccionInformatica({ v, onChange }: { v: Informatica; onChange: (v: Informatica) => void }) {
  const set = (k: keyof Informatica) => (x: string) => onChange({ ...v, [k]: x });
  return (
    <section className="fmt-bloque">
      <div className="fmt-bloque__tit">POR LA SECCIÓN DE INFORMÁTICA:</div>
      <FirmaFecha nombre={v.recibido} fecha={v.recibidoFecha} onNombre={set("recibido")} onFecha={set("recibidoFecha")} pie="RECIBIDO POR" pieFecha="FECHA" />
      <FirmaFecha nombre={v.tramitado} fecha={v.tramitadoFecha} onNombre={set("tramitado")} onFecha={set("tramitadoFecha")} pie="SOLICITUD TRAMITADA POR" pieFecha="FECHA" />
      <FirmaFecha nombre={v.notificacion} fecha={v.notificacionFecha} onNombre={set("notificacion")} onFecha={set("notificacionFecha")} pie="NOTIFICACIÓN AL ÁREA" pieFecha="FECHA" />
    </section>
  );
}

type Roles = {
  tipos: string[];
  trabajador: string;
  puesto: string;
  departamento: string;
  seccion: string;
  detalle: string;
  solicitadoPor: string;
  solicitadoSeccion: string;
  fechaSolicitud: string;
  aprobadoPor: string;
  fechaAprobacion: string;
  informatica: Informatica;
};
const crearRoles = (): Roles => ({
  tipos: [],
  trabajador: "",
  puesto: "",
  departamento: "",
  seccion: "",
  detalle: "",
  solicitadoPor: "",
  solicitadoSeccion: "",
  fechaSolicitud: hoyISO(),
  aprobadoPor: "",
  fechaAprobacion: "",
  informatica: informaticaVacia(),
});

/** Formulario de solicitud de roles y privilegios (hoja ROLES). */
export function RolesEditor({ onVolver }: { onVolver: () => void }) {
  const [r, setR, reiniciar] = useBorrador<Roles>("gbd_formato_roles", crearRoles);
  const set = <K extends keyof Roles>(k: K) => (v: Roles[K]) => setR((d) => ({ ...d, [k]: v }));
  const toggle = (t: string) =>
    setR((d) => ({ ...d, tipos: d.tipos.includes(t) ? d.tipos.filter((x) => x !== t) : [...d.tipos, t] }));

  return (
    <EditorFormato
      titulo="Solicitud de roles y privilegios"
      icono={KeyRound}
      orientacion="portrait"
      archivo={nombreArchivo(`solicitud-roles-${r.trabajador || "usuario"}`, r.fechaSolicitud)}
      ayuda="Marca el tipo de rol solicitado y completa los datos del trabajador y las firmas."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <Encabezado titulo="FORMULARIO DE SOLICITUD DE ROLES Y PRIVILEGIOS" />
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">TIPO DE ROL SOLICITADO</div>
        <div className="fmt-checks">
          {TIPOS_ROL.map((t) => {
            const on = r.tipos.includes(t);
            return (
              <button key={t} type="button" role="checkbox" aria-checked={on} className="fmt-check" onClick={() => toggle(t)}>
                <span className="fmt-check__box">{on ? "X" : ""}</span> {t}
              </button>
            );
          })}
        </div>
      </section>
      <div className="fmt-firmas">
        <LineaDato value={r.trabajador} onChange={set("trabajador")} pie="NOMBRE DEL TRABAJADOR A QUIEN SE LE ASIGNARÁ EL ROL" bold />
        <LineaDato value={r.puesto} onChange={set("puesto")} pie="PUESTO O POSICIÓN QUE OCUPA" />
      </div>
      <div className="fmt-firmas">
        <LineaDato value={r.departamento} onChange={set("departamento")} pie="DEPARTAMENTO AL QUE PERTENECE" />
        <LineaDato value={r.seccion} onChange={set("seccion")} pie="SECCIÓN A LA QUE PERTENECE" />
      </div>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">DETALLE DEL ROL O PRIVILEGIO SOLICITADO:</div>
        <Celda multilinea={4} value={r.detalle} onChange={set("detalle")} label="Detalle del rol o privilegio" />
      </section>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">SOLICITADO POR:</div>
        <FirmaFecha nombre={r.solicitadoPor} fecha={r.fechaSolicitud} onNombre={set("solicitadoPor")} onFecha={set("fechaSolicitud")} pie="NOMBRE" pieFecha="FECHA DE LA SOLICITUD" />
        <div className="fmt-firmas">
          <LineaDato value={r.solicitadoSeccion} onChange={set("solicitadoSeccion")} pie="SECCIÓN" />
          <div />
        </div>
      </section>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">APROBADO POR:</div>
        <FirmaFecha nombre={r.aprobadoPor} fecha={r.fechaAprobacion} onNombre={set("aprobadoPor")} onFecha={set("fechaAprobacion")} pie="JEFE DE DEPARTAMENTO" pieFecha="FECHA DE APROBACIÓN" />
      </section>
      <SeccionInformatica v={r.informatica} onChange={set("informatica")} />
    </EditorFormato>
  );
}

type Cambios = {
  descripcion: string;
  justificacion: string;
  solicitadoPor: string;
  fechaSolicitud: string;
  aprobadoPor: string;
  fechaAprobacion: string;
  informatica: Informatica;
};
const crearCambios = (): Cambios => ({
  descripcion: "",
  justificacion: "",
  solicitadoPor: "ANA GOMEZ",
  fechaSolicitud: hoyISO(),
  aprobadoPor: "ELENA MORENO",
  fechaAprobacion: hoyISO(),
  informatica: informaticaVacia(),
});

/** Formulario de solicitud de cambios o adecuaciones del sistema (hoja CAMBIOS). */
export function CambiosEditor({ onVolver }: { onVolver: () => void }) {
  const [c, setC, reiniciar] = useBorrador<Cambios>("gbd_formato_cambios", crearCambios);
  const set = <K extends keyof Cambios>(k: K) => (v: Cambios[K]) => setC((d) => ({ ...d, [k]: v }));
  return (
    <EditorFormato
      titulo="Solicitud de cambios en el sistema"
      icono={Wrench}
      orientacion="portrait"
      archivo={nombreArchivo("solicitud-cambios-sistema", c.fechaSolicitud)}
      ayuda="Describe el cambio, su justificación y completa las firmas."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <Encabezado titulo="FORMULARIO DE SOLICITUD DE CAMBIOS O ADECUACIONES DEL SISTEMA" />
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">DESCRIPCIÓN DEL CAMBIO O ADECUACIÓN:</div>
        <Celda multilinea={4} value={c.descripcion} onChange={set("descripcion")} label="Descripción del cambio" />
      </section>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">JUSTIFICACIÓN DEL CAMBIO:</div>
        <Celda multilinea={4} value={c.justificacion} onChange={set("justificacion")} label="Justificación del cambio" />
      </section>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">SOLICITADO POR:</div>
        <FirmaFecha nombre={c.solicitadoPor} fecha={c.fechaSolicitud} onNombre={set("solicitadoPor")} onFecha={set("fechaSolicitud")} pie="USUARIO" pieFecha="FECHA DE LA SOLICITUD" />
      </section>
      <section className="fmt-bloque">
        <div className="fmt-bloque__tit">APROBADO POR:</div>
        <FirmaFecha nombre={c.aprobadoPor} fecha={c.fechaAprobacion} onNombre={set("aprobadoPor")} onFecha={set("fechaAprobacion")} pie="GERENTE GENERAL" pieFecha="FECHA DE APROBACIÓN" />
      </section>
      <SeccionInformatica v={c.informatica} onChange={set("informatica")} />
    </EditorFormato>
  );
}
