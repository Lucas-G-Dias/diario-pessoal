/* ============ dados: cache local + sincronização com o Supabase ============
   Tudo é um documento { path, data }. Caminhos usados:
   config/main · books/<id> · reading/<data> · habits/<id> · habitlog/<data> · workouts/<id>
   Sempre grave por store.set/del: funciona offline e sincroniza quando voltar a internet. */
const sb = SB_URL && window.supabase ? supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
const LOCAL = !sb;

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
  write(path, data, deleted = false) {
    this.docs[path] = { data, t: Date.now(), deleted };
    if (!LOCAL && !this.outbox.includes(path)) this.outbox.push(path);
    this.save(); this.flush(); render();
  },
  set(path, data) { this.write(path, data); },
  merge(path, patch) { this.write(path, { ...(this.doc(path) || {}), ...patch }); },
  del(path) { this.write(path, {}, true); },

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
    this.since = max; this.save(); render();
  },
};

/* ---- atalhos de leitura usados pelas telas ---- */
const DEF_CFG = { name: '', goalBooks: 20, goalPages: 20, goalWorkouts: 4, remind: { leitura: '21:00', habitos: true, treino: '18:00', resumo: true } };
const cfg = () => { const c = store.doc('config/main') || {}; return { ...DEF_CFG, ...c, remind: { ...DEF_CFG.remind, ...(c.remind || {}) } }; };
const books = () => store.col('books').sort((a, b) => (b.updated || 0) - (a.updated || 0));
const habits = () => store.col('habits').sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
const workouts = () => store.col('workouts').sort((a, b) => b.date.localeCompare(a.date));
const readingOn = (iso) => store.doc('reading/' + iso)?.pages || 0;
const habitsDone = (iso) => store.doc('habitlog/' + iso)?.ids || {};
const habitDueOn = (h, iso) => !h.days || !h.days.length || h.days.includes(dow(iso));

addEventListener('online', () => { S.online = true; store.flush(); store.pull(); });
addEventListener('offline', () => { S.online = false; render(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') store.pull(); });
