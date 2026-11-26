/* ============ gamificação: XP por área, nível, sequência com escudos, missão, conquistas ============ */
const XP = { pagina: 1, habito: 10, treino: 40, pr: 30, livro: 100, citacao: 5, diaCompleto: 25, meta: 150, devocional: 20, capitulo: 3, oracao: 20, diario: 15, saude: 5, exame: 20, revisao: 15, refeicao: 5, refeicaoFora: 2 };
const TITULOS = ['Aprendiz', 'Iniciado', 'Constante', 'Disciplinado', 'Focado', 'Inabalável', 'Mestre', 'Sábio', 'Lenda'];
const AREAS = { habitos: ['Hábitos', 'habit', '#30b158'], leitura: ['Leitura', 'book', '#ff9f0a'], treino: ['Treino', 'gym', '#ff375f'],
  devocional: ['Devocional', 'cross', '#5e5ce6'], escrita: ['Escrita', 'pen', '#0a84ff'], metas: ['Metas', 'target', '#bf5af2'], saude: ['Saúde', 'pulse', '#30b0c7'], dieta: ['Dieta', 'food', '#a2845e'], bonus: ['Bônus', 'sparkle', '#ff5a1f'] };

/* dias com algum registro, e quais áreas tiveram registro em cada dia (para o mapa do ano) */
function activity() {
  const map = new Map(), add = (d, a) => { if (!d) return; const s = map.get(d) || new Set(); s.add(a); map.set(d, s); };
  for (const [p, d] of Object.entries(store.docs)) {
    if (d.deleted) continue;
    if (p.startsWith('reading/') && d.data.pages > 0) add(p.slice(8), 'leitura');
    if (p.startsWith('habitlog/') && Object.values(d.data.ids || {}).some(Boolean)) add(p.slice(9), 'habitos');
  }
  workouts().forEach((w) => add(w.date, 'treino'));
  devos().forEach((x) => add(x.date, 'devocional'));
  Object.values(bibleRead()).forEach((d) => add(d, 'devocional'));
  journal().forEach((j) => add(j.date, 'escrita'));
  store.col('dietalog').forEach((x) => { if (Object.keys(x.r || {}).length) add(x.id, 'dieta'); });
  return map;
}

/* sequência com escudos: a cada 7 dias seguidos você ganha 1 escudo (máx. 3);
   um dia em branco gasta um escudo em vez de zerar a sequência */
function streakInfo(set) {
  const days = [...set].sort(), end = today(), saved = new Set();
  let cur = 0, best = 0, shields = 0, run = 0;
  if (!days.length) return { cur, best, shields, saved };
  for (let d = days[0], g = 0; d <= end && g < 4000; d = addDays(d, 1), g++) {
    if (set.has(d)) { cur++; run++; if (run % 7 === 0) shields = Math.min(3, shields + 1); }
    else if (d === end) { /* hoje ainda está em aberto */ }
    else if (shields > 0) { shields--; saved.add(d); }
    else { cur = 0; run = 0; }
    best = Math.max(best, cur);
  }
  return { cur, best, shields, saved };
}

/* missão do dia: as áreas ligadas em Ajustes; o resto vale como bônus */
function mission(iso = today()) {
  const c = cfg(), due = habits().filter((h) => habitDueOn(h, iso)), log = habitsDone(iso), items = [];
  const it = (k, label, prog, opt) => items.push({ k, label, prog: clamp(prog, 0, 1), ok: prog >= 1, opt: !!opt });
  if (due.length) it('habitos', `${due.length} ${due.length === 1 ? 'hábito' : 'hábitos'}`, due.filter((h) => hDone(h, log)).length / due.length, !c.missao.habitos);
  it('leitura', `Ler ${c.goalPages} páginas`, readingOn(iso) / c.goalPages, !c.missao.leitura);
  it('devocional', 'Devocional', devoOn(iso) || Object.values(bibleRead()).includes(iso) ? 1 : 0, !c.missao.devocional);
  it('escrita', 'Escrever', journalOn(iso) ? 1 : 0, !c.missao.escrita);
  if (store.doc('config/dieta') && refsDoDia(iso).length) { const L = dietaLog(iso), rs = refsDoDia(iso); it('dieta', 'Dieta', rs.reduce((a, r) => a + (PONTO[L.r[r.id]] || 0), 0) / rs.length / 0.8, !c.missao.dieta); }
  it('treino', 'Treinar', workouts().some((w) => w.date === iso) ? 1 : 0, true);
  const vis = items.filter((i) => i.k === 'habitos' || areaOn(i.k));
  items.length = 0; items.push(...vis);
  const req = items.filter((i) => !i.opt);
  return { items, complete: req.length > 0 && req.every((i) => i.ok), pct: Math.round(100 * (req.length ? req.reduce((a, i) => a + i.prog, 0) / req.length : 0)) };
}

function totals() {
  let pages = 0, checks = 0, full = 0, maxPages = 0;
  const alvo = Object.fromEntries(habits().map((h) => [h.id, h.target || 1]));
  for (const [p, d] of Object.entries(store.docs)) {
    if (d.deleted) continue;
    if (p.startsWith('reading/')) { pages += d.data.pages || 0; maxPages = Math.max(maxPages, d.data.pages || 0); }
    if (p.startsWith('habitlog/')) { checks += Object.entries(d.data.ids || {}).filter(([k, v]) => v === true || Number(v) >= (alvo[k] || 1)).length; if (d.data.full) full++; }
  }
  const ws = workouts(), finished = books().filter((b) => b.status === 'lido').length, qs = quotes().length;
  const prs = ws.reduce((a, w) => a + (w.prs || []).length, 0), volume = ws.reduce((a, w) => a + (w.volume || 0), 0);
  const dv = devos().length, caps = Object.keys(bibleRead()).length, resp = prayers().filter((x) => x.answered).length;
  const dietaRefs = { ok: 0, fora: 0 }; store.col('dietalog').forEach((x) => Object.values(x.r || {}).forEach((s) => { if (s in dietaRefs) dietaRefs[s]++; }));
  const anoDias = store.col('anolog').filter((x) => x.c).length, js = journal(), palavras = js.reduce((a, j) => a + (j.words || 0), 0), metas = goalsHit();
  const xp = {
    habitos: checks * XP.habito, leitura: pages * XP.pagina + finished * XP.livro + qs * XP.citacao, treino: ws.length * XP.treino + prs * XP.pr,
    devocional: dv * XP.devocional + caps * XP.capitulo + resp * XP.oracao, escrita: js.reduce((a, j) => a + XP.diario + Math.min(10, Math.floor((j.words || 0) / 50)), 0),
    metas: metas * XP.meta, saude: store.col('medidas').length * XP.saude + store.col('exames').length * XP.exame, dieta: dietaRefs.ok * XP.refeicao + dietaRefs.fora * XP.refeicaoFora, bonus: full * XP.diaCompleto + store.col('semana').filter((x) => x.c).length * XP.revisao,
  };
  return { pages, maxPages, checks, full, finished, qs, workouts: ws.length, prs, volume, dv, caps, resp, entradas: js.length, palavras, metas, anoDias, dietaOk: dietaRefs.ok, saudeN: store.col('medidas').length + store.col('exames').length, xpArea: xp, xp: Object.values(xp).reduce((a, b) => a + b, 0) };
}

/* nível n exige 75·n·(n−1) XP acumulado: 0, 150, 450, 900, 1500… */
function levelOf(xp) {
  let n = 1; while (75 * (n + 1) * n <= xp) n++;
  const base = 75 * n * (n - 1), next = 75 * (n + 1) * n;
  return { n, title: TITULOS[Math.min(TITULOS.length - 1, Math.floor((n - 1) / 3))], pct: (xp - base) / (next - base), falta: next - xp };
}

/* conquistas em 4 níveis: bronze, prata, ouro, lenda */
const TIERS = ['Bronze', 'Prata', 'Ouro', 'Lenda'];
const CONQ = [
  ['paginas', 'Leitor', 'book', 'páginas lidas', (t) => t.pages, [100, 1000, 5000, 20000]],
  ['livros', 'Estante', 'book', 'livros terminados', (t) => t.finished, [1, 5, 20, 50]],
  ['citacoes', 'Marca-texto', 'quote', 'citações guardadas', (t) => t.qs, [1, 10, 50, 200]],
  ['treinos', 'Atleta', 'gym', 'treinos', (t) => t.workouts, [1, 25, 100, 300]],
  ['volume', 'Ferro', 'gym', 'kg levantados', (t) => t.volume, [1000, 50000, 250000, 1000000]],
  ['prs', 'Recordista', 'trophy', 'recordes pessoais', (t) => t.prs, [1, 10, 50, 150]],
  ['habitos', 'Constância', 'habit', 'hábitos marcados', (t) => t.checks, [10, 100, 500, 2000]],
  ['sequencia', 'Chama', 'flame', 'dias seguidos (melhor)', (t) => t.best, [7, 30, 100, 365]],
  ['perfeitos', 'Dia perfeito', 'sparkle', 'dias com a missão cumprida', (t) => t.full, [1, 7, 30, 100]],
  ['devocionais', 'Fiel', 'cross', 'devocionais', (t) => t.dv, [1, 10, 50, 200]],
  ['capitulos', 'Escrituras', 'book', 'capítulos da Bíblia', (t) => t.caps, [10, 100, 500, 1189]],
  ['oracoes', 'Oração', 'heart', 'orações respondidas', (t) => t.resp, [1, 5, 20, 50]],
  ['diario', 'Escritor', 'pen', 'entradas no diário', (t) => t.entradas, [1, 10, 50, 200]],
  ['palavras', 'Pena', 'pen', 'palavras escritas', (t) => t.palavras, [1000, 10000, 50000, 200000]],
  ['metas', 'Determinação', 'target', 'metas batidas', (t) => t.metas, [1, 5, 20, 50]],
  ['dieta', 'No prato', 'food', 'refeições no plano', (t) => t.dietaOk, [10, 100, 500, 1500]],
  ['saude', 'Cuidado', 'pulse', 'registros de saúde', (t) => t.saudeN, [1, 10, 50, 150]],
  ['ano', 'Um ano na Palavra', 'cross', 'dias do plano anual', (t) => t.anoDias, [6, 52, 156, 312]],
].map(([id, nome, icon, unit, fn, tiers]) => ({ id, nome, icon, unit, fn, tiers }));

function conquistas(t) {
  return CONQ.map((c) => {
    const v = c.fn(t), tier = c.tiers.filter((x) => v >= x).length, next = c.tiers[tier];
    return { ...c, v, tier, next, pct: next ? v / next : 1 };
  });
}

function game() {
  if (GAME) return GAME;
  const act = activity(), s = streakInfo(new Set(act.keys())), t = { ...totals(), streak: s.cur, best: s.best, shields: s.shields, saved: s.saved, act };
  GAME = { ...t, level: levelOf(t.xp), conq: conquistas(t) };
  return GAME;
}

/* grava a bandeira de "dia completo" uma vez por dia (vale XP extra) */
function checkFullDay() {
  const m = mission(), p = 'habitlog/' + today(), cur = store.doc(p) || { ids: {} };
  if (m.complete && !cur.full) { store.set(p, { ...cur, full: true }); confetti(); toast('Missão do dia cumprida! +' + XP.diaCompleto + ' XP'); }
}

/* comemora depois de cada registro: conquista desbloqueada, novo nível ou meta batida */
function celebrate() {
  if (S.auth !== 'in' || (!LOCAL && !store.since)) return; // espera a 1ª sincronização para não comemorar o que já existia
  const g = game(), got = g.conq.flatMap((c) => Array.from({ length: c.tier }, (_, i) => `${c.id}-${i}`));
  const prev = S.prevGame; S.prevGame = { n: g.level.n, metas: g.metas };
  const seenDoc = store.doc('config/seen');
  if (!seenDoc) { store.set('config/seen', { ids: got }, true); return; } // primeira vez: marca o que já existe, sem festa
  const novas = got.filter((id) => !seenDoc.ids.includes(id));
  if (novas.length) {
    store.set('config/seen', { ids: [...seenDoc.ids, ...novas] }, true);
    const [cid, ti] = novas[novas.length - 1].split('-'), c = g.conq.find((x) => x.id === cid);
    unlockModal(c, Number(ti), novas.length); return;
  }
  if (!prev) return;
  if (g.level.n > prev.n) { confetti(); toast(`Nível ${g.level.n}! Agora você é ${g.level.title}`); }
  else if (g.metas > prev.metas) { confetti(); toast(`Meta batida! +${XP.meta} XP`); }
}
