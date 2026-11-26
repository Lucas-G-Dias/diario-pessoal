/* ============ dados: cache local + sincronização com o Supabase ============
   Tudo é um documento { path, data }. Caminhos usados:
   config/main · config/seen · books/<id> · quotes/<id> · reading/<data> · habits/<id> · habitlog/<data>
   workouts/<id> · routines/<id> · session/treino · session/leitura · goals/<id>
   devos/<id> · bible/main · prayers/<id> · journal/<id>
   Sempre grave por store.set/del: funciona offline e sincroniza quando voltar a internet. */
const sb = SB_URL && window.supabase ? supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
const LOCAL = !sb;
const STATS = new Map(); // cache das estatísticas por período; zera a cada gravação
let GAME = null; // cache do game(); zera a cada gravação

const store = {
  docs: {}, // path -> { data, t, deleted }
  outbox: [], // caminhos a enviar
  key: () => 'dp-docs-' + (S.user?.id || 'local'),
  load() {
    try { const o = JSON.parse(localStorage.getItem(this.key()) || '{}'); this.docs = o.docs || {}; this.outbox = o.outbox || []; this.since = o.since || null; }
    catch { this.docs = {}; this.outbox = []; this.since = null; }
  },
  save() { try { localStorage.setItem(this.key(), JSON.stringify({ docs: this.docs, outbox: this.outbox, since: this.since })); } catch { /* cheio ou bloqueado */ } },
  doc(path) { const d = this.docs[path]; return d && !d.deleted ? d.data : null; },
  col(prefix) {
    const pre = prefix + '/', out = [];
    for (const [p, d] of Object.entries(this.docs)) if (!d.deleted && p.startsWith(pre) && !p.slice(pre.length).includes('/')) out.push({ id: p.slice(pre.length), ...d.data });
    return out;
  },
  /* silent: grava sem redesenhar a tela (campos digitados no meio do treino) */
  write(path, data, deleted = false, silent = false) {
    this.docs[path] = { data, t: Date.now(), deleted }; STATS.clear(); GAME = null;
    if (!LOCAL && !this.outbox.includes(path)) this.outbox.push(path);
    this.save(); clearTimeout(this.ft); this.ft = setTimeout(() => this.flush(), silent ? 2000 : 300);
    if (!silent) { render(); setTimeout(celebrate, 450); }
  },
  set(path, data, silent) { this.write(path, data, false, silent); },
  merge(path, patch) { this.write(path, { ...(this.doc(path) || {}), ...patch }); },
  del(path) { this.write(path, {}, true); },
  /* apaga de uma vez todos os documentos que começam com estes prefixos (recomeçar uma área) */
  delPrefixes(prefixes, keep = []) {
    const t = Date.now(); let n = 0;
    for (const p of Object.keys(this.docs)) {
      if (keep.includes(p) || this.docs[p].deleted || !prefixes.some((x) => p === x || p.startsWith(x + '/'))) continue;
      this.docs[p] = { data: {}, t, deleted: true }; n++;
      if (!LOCAL && !this.outbox.includes(p)) this.outbox.push(p);
    }
    STATS.clear(); GAME = null; this.save(); this.flush(); return n;
  },

  /* envia o que está na fila (1 consulta para tudo) */
  async flush() {
    if (LOCAL || !S.user || !this.outbox.length || this.flushing) return;
    this.flushing = true;
    const paths = [...this.outbox];
    const rows = paths.map((p) => ({ path: p, data: this.docs[p].data, deleted: !!this.docs[p].deleted, updated_at: new Date(this.docs[p].t).toISOString() }));
    try {
      const { error } = await sb.from('docs').upsert(rows, { onConflict: 'user_id,path' });
      if (error) throw error;
      this.outbox = this.outbox.filter((p) => !paths.includes(p)); this.save();
    } catch (e) { console.warn('sync', e); }
    this.flushing = false;
    if (this.outbox.length && navigator.onLine) setTimeout(() => this.flush(), 5000);
  },

  /* traz o que mudou desde a última vez (1 consulta) */
  async pull() {
    if (LOCAL || !S.user) return;
    let q = sb.from('docs').select('path,data,deleted,updated_at');
    if (this.since) q = q.gt('updated_at', this.since);
    const { data, error } = await q;
    if (error) { console.warn('pull', error); return; }
    let max = this.since;
    for (const r of data || []) {
      const t = Date.parse(r.updated_at), mine = this.docs[r.path];
      if (!this.outbox.includes(r.path) && (!mine || mine.t <= t)) this.docs[r.path] = { data: r.data, t, deleted: r.deleted };
      if (!max || r.updated_at > max) max = r.updated_at;
    }
    STATS.clear(); GAME = null; this.since = max || this.since || '1970-01-01T00:00:00Z'; this.save(); S.prevGame = null; render(); celebrate();
  },
};

/* ---- atalhos de leitura usados pelas telas ---- */
const DEF_CFG = { name: '', goalBooks: 20, goalPages: 20, goalWorkouts: 4, rest: 90, accent: 'brasa', fonte: 'normal',
  inicio: { kpis: true, seq: true, missao: true, lendo: true, metas: true, verso: true },
  areas: { leitura: true, treino: true, devocional: true, escrita: true, saude: true, dieta: true },
  missao: { habitos: true, leitura: true, devocional: true, escrita: false, dieta: false },
  remind: { leitura: '21:00', habitos: true, treino: '18:00', devocional: '07:00', escrita: '', resumo: true } };
const cfg = () => { const c = store.doc('config/main') || {}; return { ...DEF_CFG, ...c, missao: { ...DEF_CFG.missao, ...(c.missao || {}) }, remind: { ...DEF_CFG.remind, ...(c.remind || {}) },
  inicio: { ...DEF_CFG.inicio, ...(c.inicio || {}) }, areas: { ...DEF_CFG.areas, ...(c.areas || {}) } }; };
/* área ligada? (hábitos, metas e conquistas estão sempre ligadas) */
const areaOn = (k) => cfg().areas[k] !== false;
const books = () => store.col('books').sort((a, b) => (b.updated || 0) - (a.updated || 0));
const habits = () => store.col('habits').sort((a, b) => porOrdem(a, b) || (a.time || '99').localeCompare(b.time || '99'));
const workouts = () => store.col('workouts').sort((a, b) => (b.date + (b.end || '')).localeCompare(a.date + (a.end || '')));
const routines = () => store.col('routines').sort((a, b) => porOrdem(a, b) || a.name.localeCompare(b.name));
const quotes = () => store.col('quotes').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const devos = () => store.col('devos').sort((a, b) => b.date.localeCompare(a.date));
const prayers = () => store.col('prayers').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const journal = () => store.col('journal').sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
const bibleRead = () => store.doc('bible/main')?.read || {}; // { 'Jo:3': '2026-11-24' }
const readingOn = (iso) => store.doc('reading/' + iso)?.pages || 0;
const habitsDone = (iso) => store.doc('habitlog/' + iso)?.ids || {};
/* hábito com contagem (ex.: 8 copos): valor guardado é número; simples: true */
const hVal = (h, log) => { const v = log[h.id]; return v === true ? 1 : Number(v) || 0; };
const hDone = (h, log) => hVal(h, log) >= (h.target || 1);
/* hábito pausado num dia: dentro de uma pausa { from, to } (to vazio = pausa em andamento) */
const pausedOn = (h, iso) => (h.pauses || []).some((p) => iso >= p.from && (!p.to || iso < p.to));
const habitDueOn = (h, iso) => (!h.days || !h.days.length || h.days.includes(dow(iso))) && (!h.created || iso >= h.created) && !pausedOn(h, iso);
const activeHabits = () => habits().filter((h) => !h.paused);
const goals = () => store.col('goals').sort((a, b) => (a.created || '').localeCompare(b.created || ''));
const devoOn = (iso) => devos().some((d) => d.date === iso);
const journalOn = (iso) => journal().some((j) => j.date === iso);

addEventListener('online', () => { S.online = true; store.flush(); store.pull(); });
addEventListener('offline', () => { S.online = false; render(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') store.pull(); });
