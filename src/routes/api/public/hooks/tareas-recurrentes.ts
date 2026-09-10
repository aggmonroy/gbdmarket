import { createFileRoute } from "@tanstack/react-router";

/**
 * Tareas recurrentes automáticas (se invoca una vez al día vía pg_cron):
 *  - "Limpieza de área de trabajo": cada 2 días (omitiendo domingos) para
 *    TODOS los colaboradores activos.
 *  - "Depositar la basura en contenedor de la cooperativa": miércoles y
 *    sábados, responsable Sebastián Taylor, verificadora Ana Gómez.
 *
 * Seguridad: exige Authorization: Bearer <CRON_SECRET>.
 */

const PANAMA_OFFSET_MIN = -5 * 60;
// Día ancla del ciclo "cada 2 días" de limpieza (fecha de Panamá).
const ANCLA_LIMPIEZA = "2026-09-09";

function fechaPanamaAhora() {
  const ahora = new Date(Date.now() + PANAMA_OFFSET_MIN * 60000);
  return {
    iso: ahora.toISOString().slice(0, 10),
    dow: ahora.getUTCDay(), // 0 = domingo
  };
}

function diffDias(a: string, b: string) {
  const ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
  return Math.round(ms / 86400000);
}

export const Route = createFileRoute("/api/public/hooks/tareas-recurrentes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        const validos = [process.env["CRON_SECRET"], import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]].filter(Boolean);
        if (!token || !validos.includes(token)) {
          return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { admin } = await import("@/lib/garantias.server");
        const { generarNumeroTarea } = await import("@/lib/tareas.server");
        const sb = await admin();

        const { iso: hoy, dow } = fechaPanamaAhora();
        const creadas: string[] = [];

        const { data: cols, error: eCols } = await sb
          .from("colaboradores")
          .select("id,nombre")
          .eq("activo", true)
          .is("deleted_at", null);
        if (eCols) {
          return new Response(JSON.stringify({ error: eCols.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const colaboradores = cols ?? [];

        async function existeTarea(titulo: string, asignado: string | null) {
          let q = sb.from("tareas").select("id", { count: "exact", head: true }).eq("fecha", hoy).eq("titulo", titulo);
          q = asignado ? q.eq("asignado_a", asignado) : q.is("asignado_a", null);
          const { count } = await q;
          return (count ?? 0) > 0;
        }

        async function crear(opts: {
          titulo: string;
          descripcion?: string;
          asignadoA?: string | null;
          verificadorA?: string | null;
        }) {
          if (await existeTarea(opts.titulo, opts.asignadoA ?? null)) return;
          const numero = await generarNumeroTarea(sb, "tarea");
          const { error } = await sb.from("tareas").insert({
            tipo: "tarea",
            origen: "sistema",
            numero_orden: numero,
            titulo: opts.titulo,
            descripcion: opts.descripcion ?? null,
            asignado_a: opts.asignadoA ?? null,
            verificador_a: opts.verificadorA ?? null,
            fecha: hoy,
            fecha_vencimiento: hoy,
            estado: "pendiente",
          });

          if (error) throw new Error(error.message);
          creadas.push(`${numero} · ${opts.titulo}`);
        }

        // 1) Limpieza de área de trabajo: cada 2 días, omitiendo domingos.
        if (dow !== 0 && diffDias(ANCLA_LIMPIEZA, hoy) % 2 === 0) {
          for (const c of colaboradores) {
            await crear({
              titulo: "Limpieza de área de trabajo",
              descripcion: "Tarea fija: mantener limpio y ordenado tu área de trabajo.",
              asignadoA: c.id,
            });
          }
        }

        // 2) Basura al contenedor: miércoles (3) y sábados (6), Sebastián Taylor
        //    como responsable y Ana Gómez como verificadora.
        if (dow === 3 || dow === 6) {
          const porNombre = (patron: string) =>
            colaboradores.find((c: any) => (c.nombre ?? "").toUpperCase().includes(patron));
          const sebastian = porNombre("SEBASTIAN");
          const ana = porNombre("ANA");
          if (sebastian) {
            await crear({
              titulo: "Depositar la basura en contenedor de la cooperativa",
              descripcion: ana
                ? "Responsable: Sebastián Taylor. La tarea solo se cierra cuando Ana Gómez valide la verificación."
                : "Responsable: Sebastián Taylor.",
              asignadoA: sebastian.id,
              verificadorA: ana?.id ?? null,
            });
          }
        }

        return new Response(JSON.stringify({ ok: true, fecha: hoy, creadas }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
