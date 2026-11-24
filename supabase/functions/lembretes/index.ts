// Diário Pessoal: envia os lembretes (roda a cada 15 min pelo pg_cron)
// Segredos (só no Supabase): VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
const WINDOW = 15; // minutos: o mesmo intervalo do cron

type Doc = { path: string; data: Record<string, any> };
type Note = { key: string; title: string; body: string; url: string };

/* data e hora locais no fuso do aparelho */
function localNow(tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { iso: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) % 24 * 60 + Number(p.minute), dow };
}
const toMin = (hhmm?: string) => { if (!hhmm) return -1; const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const due = (hhmm: string | undefined, now: number) => { const t = toMin(hhmm); return t >= 0 && now >= t && now < t + WINDOW; };

function plan(docs: Doc[], tz: string): Note[] {
  const L = localNow(tz), get = (p: string) => docs.find((d) => d.path === p)?.data;
  const cfg = get("config/main") || {}, r = { leitura: "21:00", treino: "18:00", devocional: "07:00", escrita: "", habitos: true, resumo: true, ...(cfg.remind || {}) };
  const goalPages = cfg.goalPages || 20, read = get(`reading/${L.iso}`)?.pages || 0, log = get(`habitlog/${L.iso}`)?.ids || {};
  const habits = docs.filter((d) => d.path.startsWith("habits/")).map((d) => ({ id: d.path.slice(7), ...d.data }))
    .filter((h) => !h.paused && (!h.days?.length || h.days.includes(L.dow)) && (!h.created || h.created <= L.iso));
  const done = (h: any) => { const v = log[h.id]; return (v === true ? 1 : Number(v) || 0) >= (h.target || 1); };
  const trained = docs.some((d) => d.path.startsWith("workouts/") && d.data.date === L.iso);
  const devo = docs.some((d) => d.path.startsWith("devos/") && d.data.date === L.iso) || Object.values(get("bible/main")?.read || {}).includes(L.iso);
  const wrote = docs.some((d) => d.path.startsWith("journal/") && d.data.date === L.iso);
  const out: Note[] = [];
  if (due(r.devocional, L.min) && !devo) out.push({ key: `devo-${L.iso}`, title: "Devocional", body: "Um tempo com Deus antes do dia começar. Seu versículo de hoje está esperando.", url: "./#devocional" });
  if (due(r.leitura, L.min) && read < goalPages)
    out.push({ key: `leitura-${L.iso}`, title: "Hora da leitura", body: read ? `Faltam ${goalPages - read} páginas para a meta de hoje.` : `${goalPages} páginas hoje mantêm a sequência viva.`, url: "./#leitura" });
  if (due(r.treino, L.min) && !trained) out.push({ key: `treino-${L.iso}`, title: "Treino de hoje", body: "Ainda não tem treino registrado hoje. Bora?", url: "./#treino" });
  if (due(r.escrita, L.min) && !wrote) out.push({ key: `escrita-${L.iso}`, title: "Escrever", body: "Poucas linhas já bastam. A pergunta do dia está no app.", url: "./#escrita" });
  if (r.habitos) for (const h of habits) if (!done(h) && due(h.time, L.min))
    out.push({ key: `habito-${h.id}-${L.iso}`, title: h.name, body: h.target > 1 ? `Meta de hoje: ${h.target}×. Marque no app.` : "Lembrete do seu hábito. Marque quando fizer.", url: "./#habitos" });
  if (r.resumo && due("22:00", L.min)) {
    const falta = habits.filter((h) => !done(h)).length, itens = [read < goalPages ? `${goalPages - read} páginas` : "", falta ? `${falta} hábito(s)` : "", cfg.missao?.devocional !== false && !devo ? "o devocional" : ""].filter(Boolean);
    if (itens.length) out.push({ key: `resumo-${L.iso}`, title: "Antes de dormir", body: `Falta ${itens.join(", ")} para fechar o dia e não perder a sequência.`, url: "./#inicio" });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("forbidden", { status: 403 });
  const { data: subs } = await db.from("push_subs").select("endpoint,user_id,sub,tz");
  const users = [...new Set((subs || []).map((s) => s.user_id))];
  let sent = 0;
  for (const uid of users) {
    const { data: docs } = await db.from("docs").select("path,data").eq("user_id", uid).eq("deleted", false)
      .or("path.eq.config/main,path.eq.bible/main,path.like.habits/*,path.like.reading/*,path.like.habitlog/*,path.like.workouts/*,path.like.devos/*,path.like.journal/*");
    const mine = (subs || []).filter((s) => s.user_id === uid);
    const notes = plan((docs || []) as Doc[], mine[0].tz || "America/Sao_Paulo");
    for (const n of notes) {
      const { error } = await db.from("notif_log").insert({ user_id: uid, key: n.key }); // já enviado? a chave primária barra
      if (error) continue;
      await Promise.allSettled(mine.map(async (s) => {
        try { await webpush.sendNotification(s.sub, JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.key }), { TTL: 3600 }); sent++; }
        catch (e) { const c = (e as { statusCode?: number }).statusCode; if (c === 404 || c === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint); }
      }));
    }
  }
  return Response.json({ users: users.length, sent });
});
