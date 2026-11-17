import { Contact, FileSignature, ShieldCheck, UserCheck, X } from "lucide-react";
import {
  FRECUENCIAS_INGRESO,
  PROVINCIAS_PANAMA,
  calcularDeclaracion,
  datosClienteInicial,
  declaracionInicial,
  dinero,
  fechaCorta,
  fechaLarga,
  hoyISO,
  partesComprobantes,
  partesFecha,
  sumarComprobantes,
  type ArticuloCliente,
  type DatosCliente,
  type Declaracion,
  type LineaMonto,
} from "@/lib/formatos";
import { Celda, ControlFilas, EditorFormato, Encabezado, EnLinea, editarFila, nombreArchivo, useBorrador } from "./hoja";

const COOP = "Cooperativa de Servicios Integrales Gladys B. de Ducasa, R.L.";

/** Monto con sumas (+10+10+10): muestra el total debajo mientras se escribe. */
function Monto({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const partes = partesComprobantes(value);
  const total = sumarComprobantes(value);
  return (
    <>
      <Celda
        numero
        suma
        align="right"
        value={value}
        onChange={onChange}
        label={`${label} (puedes sumar: +10+10+10)`}
        placeholder="0.00"
        mostrar={value.trim() ? dinero(total) : ""}
      />
      {partes.length > 1 && <div className="fmt-noprint fmt-suma">= {dinero(total)}</div>}
    </>
  );
}

function FilasMonto({
  lineas,
  onChange,
  numerar,
  nueva,
}: {
  lineas: LineaMonto[];
  onChange: (ls: LineaMonto[]) => void;
  numerar?: boolean;
  nueva: () => LineaMonto;
}) {
  return (
    <>
      {lineas.map((l, i) => (
        <tr key={i}>
          {numerar && <td className="c">{i + 1})</td>}
          <td colSpan={numerar ? 1 : 2}>
            <div className="fmt-celda-quitar">
              <Celda value={l.concepto} onChange={(v) => onChange(editarFila(lineas, i, "concepto", v))} label={`Concepto ${i + 1}`} />
              <button
                type="button"
                className="fmt-noprint fmt-quitar"
                aria-label={`Quitar ${l.concepto || `fila ${i + 1}`}`}
                onClick={() => onChange(lineas.filter((_, j) => j !== i))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </td>
          <td>
            <Monto value={l.monto} onChange={(v) => onChange(editarFila(lineas, i, "monto", v))} label={l.concepto || `Monto ${i + 1}`} />
          </td>
        </tr>
      ))}
      <tr className="fmt-noprint fmt-ctrl">
        <td colSpan={3}>
          <ControlFilas onAgregar={() => onChange([...lineas, nueva()])} onQuitar={() => onChange(lineas.slice(0, -1))} puedeQuitar={lineas.length > 1} />
        </td>
      </tr>
    </>
  );
}

/** Declaración de ingresos de independientes (REQUISITOS.xlsx, hoja DECLARACIÓN DE INGRESOS). */
export function DeclaracionIngresosEditor({ onVolver }: { onVolver: () => void }) {
  const [d, setD, reiniciar] = useBorrador<Declaracion>("gbd_formato_declaracion_ingresos", declaracionInicial);
  const set = <K extends keyof Declaracion>(k: K) => (v: Declaracion[K]) => setD((x) => ({ ...x, [k]: v }));
  const r = calcularDeclaracion(d);

  return (
    <EditorFormato
      titulo="Declaración de ingresos de independientes"
      icono={FileSignature}
      orientacion="portrait"
      archivo={nombreArchivo(`declaracion-ingresos-${d.nombre || "cliente"}`, d.fecha)}
      ayuda="Completa los datos del cliente y los montos. En cada monto puedes sumar escribiendo +10+10+10. Los ingresos brutos (ingresos − costos de ventas) y la ganancia neta (ingresos brutos − gastos) se calculan solos. Puedes agregar o quitar actividades y gastos."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <div className="fmt-carta">
        <div className="fmt-derecha">
          <span className="fmt-w-40">
            <Celda type="date" value={d.fecha} onChange={set("fecha")} mostrar={fechaLarga(d.fecha)} label="Fecha" align="right" />
          </span>
        </div>
        <p className="fmt-carta__saludo">A QUIEN CONCIERNA</p>
        <p>
          Yo, <EnLinea ancho={250} value={d.nombre} onChange={set("nombre")} label="Nombre del cliente" placeholder="(NOMBRE DE CLIENTE)" bold />, asoc/cliente{" "}
          <EnLinea ancho={90} value={d.numeroCliente} onChange={set("numeroCliente")} label="Número de cliente" placeholder="# CLIENTE" />, cedulado nº{" "}
          <EnLinea ancho={130} value={d.cedula} onChange={set("cedula")} label="Cédula" placeholder="(# DE CÉDULA)" />, declaro que me dedico a la actividad de{" "}
          <EnLinea ancho={300} value={d.profesion} onChange={set("profesion")} label="Profesión principal" placeholder="(PROFESIÓN PRINCIPAL)" />, en el área (dirección, ruta o negocio){" "}
          <EnLinea ancho={340} value={d.direccion} onChange={set("direccion")} label="Dirección, ruta o negocio" placeholder="(DIRECCIÓN)" />, actividad que me genera un ingreso
          bruto de B/. <b className="fmt-linea fmt-linea--dato">{dinero(r.ingresosBrutos)}</b> mensuales, distribuidos así:
        </p>
      </div>

      <table className="fmt-tabla fmt-declaracion">
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "62%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <tbody>
          <tr>
            <th colSpan={3}>INGRESOS</th>
          </tr>
          <FilasMonto
            lineas={d.ingresos}
            onChange={set("ingresos")}
            numerar
            nueva={() => ({ concepto: `ACTIVIDAD ${d.ingresos.length + 1}`, monto: "" })}
          />
          <tr className="fmt-total">
            <td colSpan={2}>TOTAL DE INGRESOS</td>
            <td className="r">{dinero(r.totalIngresos)}</td>
          </tr>
          <tr>
            <td colSpan={2}>
              <b>COSTOS DE VENTAS</b>
            </td>
            <td>
              <Monto value={d.costoVentas} onChange={set("costoVentas")} label="Costos de ventas" />
            </td>
          </tr>
          <tr className="fmt-total">
            <td colSpan={2}>INGRESOS BRUTOS</td>
            <td className="r">{dinero(r.ingresosBrutos)}</td>
          </tr>
          <tr>
            <th colSpan={3}>GASTOS</th>
          </tr>
          <FilasMonto lineas={d.gastos} onChange={set("gastos")} nueva={() => ({ concepto: "", monto: "" })} />
          <tr className="fmt-total">
            <td colSpan={2}>TOTAL DE GASTOS B/.</td>
            <td className="r">{dinero(r.totalGastos)}</td>
          </tr>
          <tr className="fmt-total fmt-neta">
            <td colSpan={2}>INGRESO O GANANCIA NETA B/.</td>
            <td className={r.gananciaNeta < 0 ? "r fmt-alerta" : "r"}>{dinero(r.gananciaNeta)}</td>
          </tr>
        </tbody>
      </table>

      <div className="fmt-carta">
        <p>
          Generalmente recibo mis ingresos:{" "}
          <EnLinea ancho={120} value={d.frecuencia} onChange={set("frecuencia")} sugerencias={FRECUENCIAS_INGRESO} label="Frecuencia de ingresos" bold /> realizando la(s)
          actividad(es) antes mencionada(s).
        </p>
        <p>
          Declaro que no cuento con documentación como aviso de operación, declaración de renta, Estados Financieros u otro documento sustentable por ser una
          actividad informal y que los ingresos percibidos de la misma no llegan a lo establecido en la legislación para presentarlos.
        </p>
        <p>Igualmente doy fe que la información expresada en este documento es verdadera, confiable y actual.</p>
        <div className="fmt-firma-carta">
          <p>Para dar fe, firmo este documento,</p>
          <div className="fmt-firma-carta__raya" />
          <div>
            <b>Nombre:</b> {d.nombre}
          </div>
          <div>
            <b>Cédula:</b> {d.cedula}
          </div>
          <div>
            <b>Asoc./cliente:</b> {d.numeroCliente}
          </div>
        </div>
      </div>
    </EditorFormato>
  );
}

// ---------------------------------------------------------------- APC

type Apc = { nombre: string; cedula: string };

/** Autorización de APC (REQUISITOS.xlsx): tres copias por hoja con los mismos datos. */
export function ApcEditor({ onVolver }: { onVolver: () => void }) {
  const [a, setA, reiniciar] = useBorrador<Apc>("gbd_formato_apc", () => ({ nombre: "", cedula: "" }));
  return (
    <EditorFormato
      titulo="Autorización de APC"
      icono={ShieldCheck}
      orientacion="portrait"
      archivo={nombreArchivo(`autorizacion-apc-${a.nombre || "cliente"}`)}
      ayuda="Escribe el nombre y la cédula una sola vez: se copian en las tres autorizaciones de la hoja. Si los dejas en blanco, se imprimen las rayas para llenar a mano."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      {[0, 1, 2].map((n) => (
        <section key={n} className="fmt-apc">
          <div className="fmt-apc__tit">AUTORIZACIÓN</div>
          <p className="fmt-legal">
            El suscrito,{" "}
            <EnLinea ancho={260} value={a.nombre} onChange={(v) => setA((x) => ({ ...x, nombre: v }))} label={`Nombre (copia ${n + 1})`} bold />, mayor de edad, portador
            de la cédula de identidad personal número{" "}
            <EnLinea ancho={140} value={a.cedula} onChange={(v) => setA((x) => ({ ...x, cedula: v }))} label={`Cédula (copia ${n + 1})`} bold />, actuando en mi propio
            nombre, por este medio autorizo expresamente a la {COOP}, para que de conformidad con lo expresado en el artículo 24 y demás disposiciones aplicables de la
            Ley 24 del 22 de mayo de 2002 y sus reformas, y de conformidad con la Ley 81 del 26 de marzo de 2019 sobre Protección de Datos, y con respecto de APC BURÓ,
            S.A. o cualquier agencia de información de datos, banco o agente económico, capte, obtenga, solicite, recopile, registre, organice, estructure, almacene,
            conserve, adapte o modifique según lo que permita u ordene la ley, extraiga, consulte, utilice, comunique, transmita, intercambie, comparta, difunda (en
            aquellos casos en los que la ley lo permita u ordene), limite, suprima o destruya (en aquellos datos en los que la ley lo permita u ordene) y en cualquier
            otra forma trate dichos datos, con respecto de informaciones relacionadas con obligaciones o transacciones crediticias que mantengo o pudiera mantener con
            dichos agentes económicos, así como cualquier otro dato relacionado con mi persona. Así mismo, autorizo a {COOP} y APC BURÓ, S.A. a consultar el Sistema de
            Verificación de Identidad (SVI) del Tribunal Electoral con el objetivo de validación de mis datos de identificación. <b>Nota:</b> Queda entendido que la{" "}
            {COOP}, suministrará a requerimiento del interesado toda la información crediticia recopilada en base a la presente autorización. Declaro que la anterior
            autorización se otorga de manera libre y voluntaria.
          </p>
          <div className="fmt-apc__firma">
            <div className="fmt-firma-carta__raya" />
            <div>FIRMA DE AUTORIZACIÓN</div>
          </div>
        </section>
      ))}
    </EditorFormato>
  );
}

// ---------------------------------------------------------------- Uso de datos personales

const FINALIDADES = [
  "Crear y mejorar los servicios de la cooperativa.",
  "Ofrecer nuevos productos y servicios.",
  "Realizar análisis interno de asociados y terceros para fines de mercadeo, fines estadísticos, análisis de riesgos y estratégicos, elaboración de perfiles.",
  "Ofrecer y enviar promociones, servicios, productos, eventos, noticias, beneficios y encuestas.",
  "Realizar gestiones de cobranzas administrativas, judiciales y extra-judiciales.",
  "Aplicar la política conozca al cliente de la cooperativa.",
  "Usar, brindar y/o transferir información para dar cumplimiento a las obligaciones y/o requerimientos que se generen en virtud de las normas vigentes para la prevención de lavado de activos y financiamiento del terrorismo.",
  "Transmisión de datos para los efectos de reportes regulatorias a entidades establecidas por ley.",
  "Para gestiones administrativas y comerciales.",
  "Aplicación de procedimientos para levantamiento y mantenimiento de estadísticas.",
  "Atención de reclamos y consultas.",
  "Aplicar la política de otorgamiento de créditos y evaluar mi calidad crediticia y capacidad de pago.",
  "Evaluar solicitudes de beneficios y productos que efectúe y/o pudiere efectuar en la cooperativa.",
  "Efectuar encuestas sobre los servicios y productos de la cooperativa.",
  "La cooperativa podrá utilizar registros fotográficos, videos e imágenes recolectadas en reuniones y eventos realizados por la cooperativa para ser utilizados en sus redes sociales como medio de comunicación.",
  "Comunicarme información sobre temas generales vinculados a la cooperativa.",
  "Cumplir con requerimientos de entes reguladores o de fiscalización, aseguradoras y demás instituciones financieras con las cuales la cooperativa mantenga relación contractual para fines únicos y exclusivos de la cooperativa.",
] as const;

type DatosPersonales = { lugar: string; fecha: string; nombre: string; cedula: string };

/** Autorización para uso de datos personales (REQUISITOS.xlsx). */
export function DatosPersonalesEditor({ onVolver }: { onVolver: () => void }) {
  const [p, setP, reiniciar] = useBorrador<DatosPersonales>("gbd_formato_datos_personales", () => ({
    lugar: "Las Tablas",
    fecha: hoyISO(),
    nombre: "",
    cedula: "",
  }));
  const set = (k: keyof DatosPersonales) => (v: string) => setP((x) => ({ ...x, [k]: v }));
  const f = partesFecha(p.fecha);
  return (
    <EditorFormato
      titulo="Autorización de uso de datos personales"
      icono={UserCheck}
      orientacion="portrait"
      archivo={nombreArchivo(`autorizacion-datos-personales-${p.nombre || "cliente"}`, p.fecha)}
      ayuda="Completa el lugar, la fecha, el nombre y la cédula. Si borras la fecha, se imprimen las rayas para llenarla a mano."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <div className="fmt-datos">
        <div className="fmt-apc__tit">AUTORIZACIÓN PARA USO DE DATOS PERSONALES</div>
        <p>
          Por medio del presente documento, el abajo firmante autorizo de manera voluntaria, previa, explícita, informada e inequívoca a la COOPERATIVA DE SERVICIOS
          INTEGRALES GLADYS B. DE DUCASA, R.L., para tratar mis datos personales, así como otro dato sensible como registros fotográficos, audiovisuales, entre otros
          para que en los términos legalmente establecidos realice la recolección, almacenamiento, grabación, organización, elaboración, selección, extracción,
          confrontación, disociación, comunicación, cancelación o utilización y en general el tratamiento de mis datos personales que he procedido a entregar o que
          entregaré, tal como dispone la Ley 81 Sobre la Protección de Datos Personales de 26 de marzo de 2019 y el Decreto Ejecutivo N.º 285 de 28 de mayo de 2021.
        </p>
        <p>Afirmo que he sido informado que el uso de mis datos y documentos personales tiene la finalidad de:</p>
        <ul>
          {FINALIDADES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p>
          Reconozco el derecho que me asiste de acceso a mis datos recabados, así como la rectificación, corrección, modificación o actualización de mis datos en
          cualquier momento, cancelación o eliminación de datos personales incorrectos, irrelevantes, incompletos o falsos, portabilidad de mis datos y oposición. En
          caso que desee limitar el uso de mis datos personales o ejercer mis derechos como titular de mis datos, debo presentar en las oficinas de la cooperativa una
          solicitud o formulario mismo que se le dará respuesta considerando lo establecido en la regulación.
        </p>
        <p>
          Además, se me comunica que la cooperativa es responsable del tratamiento que se le dé a mis datos personales, incluyendo la obtención, la protección de los
          mismos y su uso, por lo que tiene la obligación de cumplir con las medidas legales y de seguridad suficientes para protegerlos. Los datos personales serán
          mantenidos en estricta confidencialidad, de conformidad con las medidas de seguridad, administrativas, técnicas y físicas que implemente en sus políticas y
          procedimientos protección de datos, quedando estrictamente prohibido su divulgación ilícita y limitando su uso a terceros dentro y fuera del país, salvo que
          resulte obligada a ello por una ley.
        </p>
        <p>
          Para constancia de lo anterior, se firma en{" "}
          <EnLinea ancho={150} value={p.lugar} onChange={set("lugar")} sugerencias={["Las Tablas", "Tonosí"]} label="Lugar" />, el{" "}
          <span className="fmt-linea" style={{ width: 36 }}>
            <span className="fmt-linea__txt">{f.dia}</span>
          </span>{" "}
          de{" "}
          <span className="fmt-linea" style={{ width: 110 }}>
            <span className="fmt-linea__txt">{f.mes}</span>
          </span>{" "}
          de{" "}
          <span className="fmt-linea" style={{ width: 60 }}>
            <span className="fmt-linea__txt">{f.anio}</span>
          </span>
          .{" "}
          <span className="fmt-noprint fmt-w-40">
            <Celda type="date" value={p.fecha} onChange={set("fecha")} label="Fecha de la firma" />
          </span>
        </p>
        <div className="fmt-datos__firma">
          <div className="fmt-raya">
            <span>Firma:</span>
            <span className="fmt-raya__v" />
          </div>
          <div className="fmt-raya">
            <span>Nombre completo:</span>
            <span className="fmt-raya__v">
              <Celda value={p.nombre} onChange={set("nombre")} label="Nombre completo" />
            </span>
          </div>
          <div className="fmt-raya">
            <span>N.º de identificación o cédula:</span>
            <span className="fmt-raya__v">
              <Celda value={p.cedula} onChange={set("cedula")} label="Número de identificación o cédula" />
            </span>
          </div>
        </div>
      </div>
    </EditorFormato>
  );
}

// ---------------------------------------------------------------- Datos del cliente

/** Datos del cliente, Sección Línea Blanca (REQUISITOS.xlsx). */
export function DatosClienteEditor({ onVolver }: { onVolver: () => void }) {
  const [c, setC, reiniciar] = useBorrador<DatosCliente>("gbd_formato_datos_cliente", datosClienteInicial);
  const set = (k: Exclude<keyof DatosCliente, "articulos">) => (v: string) => setC((x) => ({ ...x, [k]: v }));
  const setArticulo = (i: number, k: keyof ArticuloCliente, v: string) => setC((x) => ({ ...x, articulos: editarFila(x.articulos, i, k, v) }));
  const campo = (k: Exclude<keyof DatosCliente, "articulos">, label: string, extra?: Partial<Parameters<typeof Celda>[0]>) => (
    <Celda value={c[k]} onChange={set(k)} label={label} {...extra} />
  );

  return (
    <EditorFormato
      titulo="Datos del cliente (Línea Blanca)"
      icono={Contact}
      orientacion="portrait"
      archivo={nombreArchivo(`datos-cliente-${c.nombre || "cliente"}`, c.fecha)}
      ayuda="Completa la ficha del cliente. Puedes agregar o quitar artículos, cada uno con modelo y descripción."
      onVolver={onVolver}
      onReiniciar={reiniciar}
    >
      <Encabezado titulo="DATOS DEL CLIENTE SECCIÓN LÍNEA BLANCA">
        <div className="fmt-head__fecha">
          <span className="fmt-w-40">
            <Celda type="date" value={c.fecha} onChange={set("fecha")} mostrar={fechaCorta(c.fecha)} label="Fecha" align="center" />
          </span>
        </div>
      </Encabezado>
      <table className="fmt-tabla fmt-ficha">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="fmt-lbl"># CLIENTE</td>
            <td>{campo("numeroCliente", "Número de cliente")}</td>
            <td className="fmt-lbl"># ASOCIADO</td>
            <td>{campo("numeroAsociado", "Número de asociado")}</td>
          </tr>
          <tr>
            <td className="fmt-lbl"># FACTURA SISTEMA</td>
            <td>{campo("facturaSistema", "Número de factura del sistema")}</td>
            <td className="fmt-lbl"># F. ELECTRÓNICA</td>
            <td>{campo("facturaElectronica", "Número de factura electrónica")}</td>
          </tr>
          <tr>
            <td className="fmt-lbl">NOMBRE COMPLETO</td>
            <td colSpan={3}>{campo("nombre", "Nombre completo", { bold: true })}</td>
          </tr>
          <tr>
            <td className="fmt-lbl">CÉDULA</td>
            <td>{campo("cedula", "Cédula")}</td>
            <td className="fmt-lbl">TELÉFONO</td>
            <td>{campo("telefono", "Teléfono")}</td>
          </tr>
          <tr>
            <td className="fmt-lbl">EMAIL</td>
            <td colSpan={3}>{campo("email", "Correo electrónico")}</td>
          </tr>
          <tr>
            <th colSpan={4}>DIRECCIÓN RESIDENCIAL</th>
          </tr>
          <tr>
            <td className="fmt-lbl">PROVINCIA</td>
            <td>{campo("provincia", "Provincia", { sugerencias: PROVINCIAS_PANAMA })}</td>
            <td className="fmt-lbl">DISTRITO</td>
            <td>{campo("distrito", "Distrito")}</td>
          </tr>
          <tr>
            <td className="fmt-lbl">CORREGIMIENTO</td>
            <td>{campo("corregimiento", "Corregimiento")}</td>
            <td className="fmt-lbl">COMUNIDAD</td>
            <td>{campo("comunidad", "Comunidad")}</td>
          </tr>
          <tr>
            <td className="fmt-lbl">BARRIADA</td>
            <td colSpan={3}>{campo("barriada", "Barriada")}</td>
          </tr>
          <tr>
            <td className="fmt-lbl">DETALLES ESPECÍFICOS DE LA DIRECCIÓN</td>
            <td colSpan={3}>{campo("detalles", "Detalles específicos de la dirección", { multilinea: 2 })}</td>
          </tr>
          <tr>
            <td className="fmt-lbl">LUGAR DE TRABAJO</td>
            <td colSpan={3}>{campo("lugarTrabajo", "Lugar de trabajo")}</td>
          </tr>
        </tbody>
      </table>

      <table className="fmt-tabla fmt-ficha">
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "66%" }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={3}>ARTÍCULO(S)</th>
          </tr>
          <tr>
            <th>#</th>
            <th>MODELO</th>
            <th>DESCRIPCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {c.articulos.map((a, i) => (
            <tr key={i}>
              <td className="c">{i + 1}</td>
              <td>
                <Celda value={a.modelo} onChange={(v) => setArticulo(i, "modelo", v)} label={`Modelo del artículo ${i + 1}`} />
              </td>
              <td>
                <div className="fmt-celda-quitar">
                  <Celda value={a.descripcion} onChange={(v) => setArticulo(i, "descripcion", v)} label={`Descripción del artículo ${i + 1}`} />
                  {c.articulos.length > 1 && (
                    <button
                      type="button"
                      className="fmt-noprint fmt-quitar"
                      aria-label={`Quitar artículo ${i + 1}`}
                      onClick={() => setC((x) => ({ ...x, articulos: x.articulos.filter((_, j) => j !== i) }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ControlFilas
        onAgregar={() => setC((x) => ({ ...x, articulos: [...x.articulos, { modelo: "", descripcion: "" }] }))}
        onQuitar={() => setC((x) => ({ ...x, articulos: x.articulos.slice(0, -1) }))}
        puedeQuitar={c.articulos.length > 1}
      />

      <table className="fmt-tabla fmt-ficha">
        <thead>
          <tr>
            <th colSpan={3}>DESGLOSE DE PAGOS</th>
          </tr>
          <tr>
            <th>ABONO INICIAL</th>
            <th>LETRA MENSUAL</th>
            <th>LETRA QUINCENAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{campo("abono", "Abono inicial", { numero: true, align: "center" })}</td>
            <td>{campo("letraMensual", "Letra mensual", { numero: true, align: "center" })}</td>
            <td>{campo("letraQuincenal", "Letra quincenal", { numero: true, align: "center" })}</td>
          </tr>
        </tbody>
      </table>

      <div className="fmt-obs">
        <b>OBSERVACIONES:</b>
        {campo("observaciones", "Observaciones", { multilinea: 3 })}
      </div>
    </EditorFormato>
  );
}
