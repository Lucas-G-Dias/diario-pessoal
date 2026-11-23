/* ============ Metas e relatório mês a mês ============
   Uma meta: goals/<id> { kind, target, period: semana|mes|ano, habitId?, title?, progress?: { <periodo>: n }, created }
   Ela se repete sozinha a cada período; cada período batido vale XP.meta. */
const MESES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const monthLabel = (k) => { const m = MESES_L[Number(k.slice(5, 7)) - 1]; return `${m[0].toUpperCase() + m.slice(1)} de ${k.slice(0, 4)}`; };
const shiftMonth = (k, n) => { const d = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1 + n, 15); return isoOf(d).slice(0, 7); };
const daysBetween = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };

function periodOf(period, iso = today()) {
  if (period === 'semana') { const s = addDays(iso, -((dow(iso) + 6) % 7)); return { key: s, start: s, end: addDays(s, 6) }; }
  if (period === 'ano') { const y = iso.slice(0, 4); return { key: y, start: y + '-01-01', end: y + '-12-31' }; }
  const k = iso.slice(0, 7), last = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)), 0).getDate();
  return { key: k, start: k + '-01', end: `${k}-${pad(last)}` };
}
const pastDays = (P) => (P.start > today() ? [] : daysBetween(P.start, P.end < today() ? P.end : today()));

/* % de cumprimento: feitos ÷ previstos. Hoje só conta se já foi feito (o dia ainda não acabou). */
function habitRate(hs, days) {
  let due = 0, done = 0;
  for (const d of days) {
    const log = habitsDone(d);
    for (const h of hs) { if (!habitDueOn(h, d) || (d === today() && !log[h.id])) continue; due++; if (log[h.id]) done++; }
  }
  return due ? { done, due, pct: done / due } : null;
}

function statsOf(P) {
  const ck = P.start + P.end; if (STATS.has(ck)) return STATS.get(ck);
  const days = pastDays(P), inP = (d) => d && d >= P.start && d <= P.end, ws = workouts().filter((w) => inP(w.date));
  let pages = 0, full = 0; for (const d of days) { pages += readingOn(d); if (store.doc('habitlog/' + d)?.full) full++; }
  const s = { treinos: ws.length, min: ws.reduce((a, w) => a + (Number(w.min) || 0), 0), pages, full, days: days.length,
    livros: books().filter((b) => b.status === 'lido' && inP(b.finished)).length, hab: habitRate(habits(), days) };
  STATS.set(ck, s); return s;
}

const KINDS = {
  treinos: { label: 'Treinos', unit: 'treinos', val: (s) => s.treinos },
  paginas: { label: 'Páginas lidas', unit: 'páginas', val: (s) => s.pages },
  livros: { label: 'Livros terminados', unit: 'livros', val: (s) => s.livros },
  habitos: { label: '% de todos os hábitos', pct: true, val: (s) => (s.hab ? Math.round(s.hab.pct * 100) : 0) },
  habito: { label: '% de um hábito', pct: true, val: (s, g, P) => { const h = store.doc('habits/' + g.habitId), r = h && habitRate([{ id: g.habitId, ...h }], pastDays(P)); return r ? Math.round(r.pct * 100) : 0; } },
  dias: { label: 'Dias com a missão cumprida', unit: 'dias perfeitos', val: (s) => s.full },
  manual: { label: 'Outra (eu conto)', unit: '', val: (s, g, P) => (g.progress || {})[P.key] || 0 },
};
const PERIODOS = { semana: 'por semana', mes: 'por mês', ano: 'no ano' };

function goalTitle(g) {
  if (g.kind === 'manual') return g.title || 'Meta';
  const k = KINDS[g.kind];
  if (g.kind === 'habito') return `${g.target}% em ${store.doc('habits/' + g.habitId)?.name || 'hábito apagado'}`;
  return k.pct ? `${g.target}% dos hábitos` : `${fmt(g.target)} ${k.unit}`;
}

/* situação de uma meta num período */
function goalStatus(g, P = periodOf(g.period)) {
  const k = KINDS[g.kind] || KINDS.manual, v = k.val(statsOf(P), g, P), ended = P.end < today();
  const total = daysBetween(P.start, P.end).length, elapsed = ended ? 1 : Math.max(0, pastDays(P).length - 1) / total; // o dia de hoje ainda não acabou
  const hit = k.pct ? ended && v >= g.target : v >= g.target;
  const onPace = k.pct ? v >= g.target : v >= g.target * elapsed - 0.001;
  return { v, pct: clamp(v / g.target, 0, 1), hit, onPace, ended, falta: Math.max(0, g.target - v), P };
}

/* quantos períodos batidos, de quando a meta foi criada até hoje */
function goalsHit() {
  let n = 0;
  for (const g of goals()) {
    let iso = g.created || today(), guard = 0;
    while (iso <= today() && guard++ < 400) { const P = periodOf(g.period, iso); if (goalStatus(g, P).hit) n++; iso = addDays(P.end, 1); }
  }
  return n;
}

function goalCard(g) {
  const st = goalStatus(g), k = KINDS[g.kind] || KINDS.manual;
  const chip = st.hit ? `<span class="tag ok">${ic('check', 14)} batida · +${XP.meta} XP</span>`
    : st.onPace ? '<span class="tag">no ritmo</span>' : '<span class="tag warn">atrás do ritmo</span>';
  const falta = st.hit ? '' : k.pct ? `alvo ${g.target}%` : `faltam ${fmt(st.falta)}`;
  return `<section class="card goal ${st.hit ? 'hit' : ''}"><div class="row-between"><div class="grow"><strong class="serif lg">${esc(goalTitle(g))}</strong>
    <span class="tiny muted">${PERIODOS[g.period]} · ${g.period === 'mes' ? MESES_L[Number(st.P.key.slice(5)) - 1] : g.period === 'ano' ? st.P.key : 'desde ' + shortDate(st.P.start)}</span></div>
    ${g.kind === 'manual' ? `<button class="btn-sm" data-act="metaMais" data-id="${g.id}" aria-label="Somar 1 em ${esc(goalTitle(g))}">+1</button>` : ''}
    <button class="icon-btn" data-act="editarMeta" data-id="${g.id}" aria-label="Editar meta ${esc(goalTitle(g))}">${ic('edit', 18)}</button></div>
    <div class="goal-num serif"><b>${fmt(st.v)}${k.pct ? '%' : ''}</b><span>/ ${fmt(g.target)}${k.pct ? '%' : ''}</span></div>
    ${progressBar(st.pct, st.hit ? 'green' : 'gold')}<div class="row-between tiny muted">${chip}<span>${falta}</span></div></section>`;
}

const SUG_METAS = [['treinos', 16, 'mes'], ['treinos', 4, 'semana'], ['habitos', 80, 'mes'], ['paginas', 600, 'mes'], ['livros', 2, 'mes']];

/* relatório de um mês, comparado com o anterior */
function monthReport(k) {
  const P = periodOf('mes', k + '-01'), s = statsOf(P), a = statsOf(periodOf('mes', shiftMonth(k, -1) + '-01'));
  const pctH = (x) => (x.hab ? Math.round(x.hab.pct * 100) : null);
  const delta = (v, w, suf = '') => { if (v == null || w == null || v === w) return ''; const d = v - w; return `<small class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${fmt(Math.abs(d))}${suf}</small>`; };
  const cell = (val, lbl, prev, suf = '') => `<div><b class="serif">${val == null ? '—' : fmt(val) + suf}</b><span>${lbl}</span>${delta(val, prev, suf)}</div>`;
  const hs = habits().map((h) => ({ h, r: habitRate([h], pastDays(P)) })).filter((x) => x.r);
  const metas = goals().filter((g) => g.period === 'mes' && (g.created || '') <= P.end), hit = metas.filter((g) => goalStatus(g, P).hit).length;
  return `<div class="mnav"><button class="icon-btn" data-act="mes" data-id="-1" aria-label="Mês anterior">‹</button><strong class="serif lg">${monthLabel(k)}</strong>
      <button class="icon-btn" data-act="mes" data-id="1" aria-label="Próximo mês" ${k >= today().slice(0, 7) ? 'disabled' : ''}>›</button></div>
    <div class="stats three">${cell(s.treinos, 'treinos', a.treinos)}${cell(pctH(s), 'dos hábitos', pctH(a), '%')}${cell(s.pages, 'páginas', a.pages)}
      ${cell(s.livros, 'livros', a.livros)}${cell(s.full, 'dias perfeitos', a.full)}${cell(metas.length ? hit : null, `de ${metas.length} metas`, null)}</div>
    ${hs.length ? `<h4 class="eyebrow">Cada hábito no mês</h4>${hs.map(({ h, r }) => `<div class="hrate"><span>${esc(h.name)}</span><b>${Math.round(r.pct * 100)}%</b><span class="tiny muted">${r.done}/${r.due}</span>${progressBar(r.pct, r.pct >= 0.8 ? 'green' : '')}</div>`).join('')}` : ''}`;
}

/* barras dos últimos 6 meses */
function monthBars(label, fn, suf = '') {
  const ks = Array.from({ length: 6 }, (_, i) => shiftMonth(today().slice(0, 7), i - 5)), vals = ks.map((k) => fn(statsOf(periodOf('mes', k + '-01'))) ?? 0);
  const max = Math.max(1, ...vals);
  return `<div class="mbars" aria-label="${esc(label)} nos últimos 6 meses">${ks.map((k, i) => `<div class="mcol ${i === 5 ? 'today' : ''}"><b>${fmt(vals[i])}${suf}</b><i style="height:${(vals[i] / max) * 100}%"></i><span>${MESES[Number(k.slice(5)) - 1]}</span></div>`).join('')}</div>`;
}

VIEWS.metas = () => {
  const gs = goals(), k = S.month || today().slice(0, 7);
  return `<header class="top"><h1 class="serif">Metas</h1><button class="btn-sm" data-act="novaMeta">${ic('plus', 16)} Meta</button></header>
    ${gs.length ? gs.map(goalCard).join('') : `<div class="card empty"><em class="serif lg">Nenhuma meta ainda.</em><p class="muted">Cada meta batida vale ${XP.meta} XP. Comece com uma:</p>
      <div class="hab-chips">${SUG_METAS.map(([kd, t, p], i) => `<button class="chip" data-act="sugestaoMeta" data-id="${i}">${ic('plus', 14)}${esc(goalTitle({ kind: kd, target: t }))} ${PERIODOS[p]}</button>`).join('')}</div></div>`}
    <h3 class="eyebrow sec">Mês a mês</h3><section class="card">${monthReport(k)}</section>
    <h3 class="eyebrow sec">Últimos 6 meses</h3><section class="card"><span class="eyebrow">Treinos</span>${monthBars('Treinos', (s) => s.treinos)}
      <span class="eyebrow">Hábitos cumpridos</span>${monthBars('Hábitos', (s) => (s.hab ? Math.round(s.hab.pct * 100) : 0), '%')}</section>`;
};

function formMeta(g = {}) {
  const kinds = Object.entries(KINDS).map(([v, x]) => `<option value="${v}" ${(g.kind || 'treinos') === v ? 'selected' : ''}>${x.label}</option>`).join('');
  const hs = habits().map((h) => `<option value="${h.id}" ${g.habitId === h.id ? 'selected' : ''}>${esc(h.name)}</option>`).join('');
  const per = Object.entries(PERIODOS).map(([v, x]) => `<option value="${v}" ${(g.period || 'mes') === v ? 'selected' : ''}>${x}</option>`).join('');
  return `<form data-form="meta" data-id="${g.id || ''}">
    <label>O que medir<select name="kind">${kinds}</select></label>
    <label class="only-habito">Qual hábito<select name="habitId">${hs || '<option value="">Crie um hábito primeiro</option>'}</select></label>
    <label class="only-manual">Nome da meta<input name="title" value="${esc(g.title || '')}" placeholder="Ex.: Dias sem açúcar"></label>
    <div class="grid2"><label>Alvo<input name="target" type="number" min="1" inputmode="numeric" required value="${g.target || ''}" placeholder="Ex.: 16 ou 80 (%)"></label>
    <label>Período<select name="period">${per}</select></label></div>
    <div class="form-actions">${g.id ? `<button type="button" class="btn ghost danger" data-act="apagarMeta" data-id="${g.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}

Object.assign(ACT, {
  novaMeta: () => openModal('Nova meta', formMeta()),
  editarMeta: (id) => openModal('Editar meta', formMeta({ id, ...store.doc('goals/' + id) })),
  apagarMeta: (id) => { if (confirm('Apagar esta meta? O XP das vezes que você bateu sai junto.')) { store.del('goals/' + id); closeModal(); } },
  sugestaoMeta: (i) => { const [kind, target, period] = SUG_METAS[i]; store.set('goals/' + uid(), { kind, target, period, created: periodOf(period).start }); },
  metaMais: (id) => { const g = store.doc('goals/' + id), key = periodOf(g.period).key, pr = g.progress || {}; store.set('goals/' + id, { ...g, progress: { ...pr, [key]: (pr[key] || 0) + 1 } }); },
  mes: (n) => { const k = shiftMonth(S.month || today().slice(0, 7), Number(n)); if (k <= today().slice(0, 7)) { S.month = k; render(); } },
});

FORMS.meta = (v, f) => {
  if (v.kind === 'habito' && !v.habitId) { toast('Crie um hábito primeiro'); return; }
  if (v.kind === 'manual' && !v.title.trim()) { toast('Dê um nome para a meta'); return; }
  const id = f.dataset.id || uid(), old = store.doc('goals/' + id) || {};
  store.set('goals/' + id, { ...old, kind: v.kind, target: Number(v.target), period: v.period, habitId: v.kind === 'habito' ? v.habitId : '', title: v.title.trim(), created: old.created || periodOf(v.period).start });
  closeModal();
};
