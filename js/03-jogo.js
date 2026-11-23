/* ============ gamificação: XP, nível, sequência, missão do dia, medalhas ============ */
const XP = { pagina: 1, habito: 10, treino: 40, livro: 100, diaCompleto: 25, meta: 150 };
const TITULOS = ['Aprendiz', 'Iniciado', 'Constante', 'Disciplinado', 'Focado', 'Inabalável', 'Mestre', 'Sábio', 'Lenda'];

/* dias em que houve qualquer registro */
function activeDays() {
  const set = new Set();
  for (const p of Object.keys(store.docs)) {
    const d = store.docs[p]; if (d.deleted) continue;
    if (p.startsWith('reading/') && d.data.pages > 0) set.add(p.slice(8));
    if (p.startsWith('habitlog/') && Object.values(d.data.ids || {}).some(Boolean)) set.add(p.slice(9));
  }
  workouts().forEach((w) => set.add(w.date));
  return set;
}

/* sequência: dias seguidos com registro, terminando hoje (ou ontem, se hoje ainda está vazio) */
function streakOf(set) {
  let d = set.has(today()) ? today() : addDays(today(), -1), n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
function bestStreak(set) {
  const days = [...set].sort(); let best = 0, cur = 0, prev = null;
  for (const d of days) { cur = prev && addDays(prev, 1) === d ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
  return best;
}

/* missão do dia: ler a meta de páginas, cumprir os hábitos de hoje, treinar se for dia */
function mission(iso = today()) {
  const c = cfg(), due = habits().filter((h) => habitDueOn(h, iso)), done = habitsDone(iso);
  const items = [
    { k: 'leitura', label: `Ler ${c.goalPages} páginas`, ok: readingOn(iso) >= c.goalPages, prog: clamp(readingOn(iso) / c.goalPages, 0, 1) },
  ];
  if (due.length) items.push({ k: 'habitos', label: `${due.length} ${due.length === 1 ? 'hábito' : 'hábitos'} de hoje`, ok: due.every((h) => done[h.id]), prog: due.filter((h) => done[h.id]).length / due.length });
  items.push({ k: 'treino', label: 'Treinar', ok: workouts().some((w) => w.date === iso), prog: workouts().some((w) => w.date === iso) ? 1 : 0, opt: true });
  const req = items.filter((i) => !i.opt);
  return { items, complete: req.every((i) => i.ok), pct: Math.round(100 * items.reduce((a, i) => a + i.prog, 0) / items.length) };
}

function totals() {
  let pages = 0, checks = 0, full = 0;
  for (const [p, d] of Object.entries(store.docs)) {
    if (d.deleted) continue;
    if (p.startsWith('reading/')) pages += d.data.pages || 0;
    if (p.startsWith('habitlog/')) { checks += Object.values(d.data.ids || {}).filter(Boolean).length; if (d.data.full) full++; }
  }
  const finished = books().filter((b) => b.status === 'lido');
  const tr = workouts().length;
  const metas = goalsHit();
  const xp = pages * XP.pagina + checks * XP.habito + tr * XP.treino + finished.length * XP.livro + full * XP.diaCompleto + metas * XP.meta;
  return { pages, checks, workouts: tr, finished: finished.length, full, metas, xp };
}

/* nível n exige 150·n·(n−1)/2 XP acumulado: 0, 150, 450, 900, 1500… */
function levelOf(xp) {
  let n = 1; while (75 * (n + 1) * n <= xp) n++;
  const base = 75 * n * (n - 1), next = 75 * (n + 1) * n;
  return { n, title: TITULOS[Math.min(TITULOS.length - 1, Math.floor((n - 1) / 3))], pct: (xp - base) / (next - base), falta: next - xp };
}

/* grava a bandeira de "dia completo" uma vez por dia (vale XP extra) */
function checkFullDay() {
  const m = mission(), p = 'habitlog/' + today(), cur = store.doc(p) || { ids: {} };
  if (m.complete && !cur.full) { store.set(p, { ...cur, full: true }); toast('Missão do dia cumprida! +' + XP.diaCompleto + ' XP'); }
}

const MEDALHAS = [
  { id: 'primeira', nome: 'Primeira página', desc: 'Registrar a primeira leitura', ok: (t) => t.pages > 0 },
  { id: 'cem', nome: 'Cem páginas', desc: 'Ler 100 páginas no total', ok: (t) => t.pages >= 100 },
  { id: 'mil', nome: 'Mil páginas', desc: 'Ler 1.000 páginas no total', ok: (t) => t.pages >= 1000 },
  { id: 'livro1', nome: 'Fim do livro', desc: 'Terminar o primeiro livro', ok: (t) => t.finished >= 1 },
  { id: 'livro10', nome: 'Estante cheia', desc: 'Terminar 10 livros', ok: (t) => t.finished >= 10 },
  { id: 'seq7', nome: 'Uma semana', desc: '7 dias seguidos', ok: (t, s) => s.best >= 7 },
  { id: 'seq30', nome: 'Um mês firme', desc: '30 dias seguidos', ok: (t, s) => s.best >= 30 },
  { id: 'seq100', nome: 'Cem dias', desc: '100 dias seguidos', ok: (t, s) => s.best >= 100 },
  { id: 'treino1', nome: 'Primeiro treino', desc: 'Registrar um treino', ok: (t) => t.workouts >= 1 },
  { id: 'treino50', nome: 'Cinquenta treinos', desc: 'Registrar 50 treinos', ok: (t) => t.workouts >= 50 },
  { id: 'habito100', nome: 'Cem marcações', desc: 'Marcar 100 hábitos', ok: (t) => t.checks >= 100 },
  { id: 'completo7', nome: 'Semana perfeita', desc: '7 dias com a missão cumprida', ok: (t) => t.full >= 7 },
  { id: 'meta1', nome: 'Primeira meta', desc: 'Bater uma meta', ok: (t) => t.metas >= 1 },
  { id: 'meta10', nome: 'Imparável', desc: 'Bater 10 metas', ok: (t) => t.metas >= 10 },
];

/* comemora depois de cada registro: subiu de nível ou bateu meta */
function celebrate() {
  const g = game(), prev = S.prevGame; S.prevGame = { n: g.level.n, metas: g.metas };
  if (!prev) return;
  if (g.level.n > prev.n) toast(`Nível ${g.level.n}! Agora você é ${g.level.title}`);
  else if (g.metas > prev.metas) toast(`Meta batida! +${XP.meta} XP`);
}

function game() {
  const set = activeDays(), t = totals(), s = { cur: streakOf(set), best: bestStreak(set) };
  return { ...t, streak: s.cur, best: s.best, level: levelOf(t.xp), medals: MEDALHAS.map((m) => ({ ...m, got: m.ok(t, s) })) };
}
