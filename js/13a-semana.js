/* ============ Resumo da semana: números, destaques, comparação e revisão (o que funcionou, o que ajustar, foco) ============
   semana/<segunda> { funcionou, ajustar, foco, c }   — fazer a revisão vale XP.revisao */
const segundaDe = (iso) => addDays(iso, -((dow(iso) + 6) % 7));
const semanaP = (seg) => ({ key: seg, start: seg, end: addDays(seg, 6) });

function destaquesSemana(P) {
  const dias = pastDays(P), out = [];
  const hs = habits().map((h) => ({ h, r: habitRate([h], dias) })).filter((x) => x.r && x.r.due >= 2).sort((a, b) => b.r.pct - a.r.pct);
  if (hs.length) { out.push(['habit', `Hábito mais firme: <b>${esc(hs[0].h.name)}</b> (${Math.round(hs[0].r.pct * 100)}%)`]);
    const pior = hs[hs.length - 1]; if (hs.length > 1 && pior.r.pct < 0.7) out.push(['flame', `Precisa de atenção: <b>${esc(pior.h.name)}</b> (${Math.round(pior.r.pct * 100)}%)`]); }
  const ws = workouts().filter((w) => w.date >= P.start && w.date <= P.end), prs = ws.flatMap((w) => w.prs || []);
  if (prs.length) out.push(['trophy', `${prs.length === 1 ? 'Um recorde pessoal' : prs.length + ' recordes pessoais'}: ${[...new Set(prs.map((p) => exById(p.ex).n))].slice(0, 3).map(esc).join(', ')}`]);
  const lidos = books().filter((b) => b.status === 'lido' && b.finished >= P.start && b.finished <= P.end);
  if (lidos.length) out.push(['book', `Livro terminado: <b>${lidos.map((b) => esc(b.title)).join(', ')}</b>`]);
  const metas = goals().filter((g) => g.period === 'semana' && goalStatus(g, P).hit);
  if (metas.length) out.push(['target', `Meta da semana batida: ${metas.map((g) => esc(goalTitle(g))).join(', ')}`]);
  const ad = store.doc('config/dieta') ? adesaoPeriodo(pastDays(P)) : null; if (ad != null) out.push(['food', `Dieta: <b>${Math.round(ad * 100)}%</b> de adesão${maisEscapa() ? ` · o que mais escapa: ${esc(maisEscapa().nome)}` : ''}`]);
  const humor = journal().filter((j) => j.date >= P.start && j.date <= P.end && j.mood);
  if (humor.length) { const m = Math.round(humor.reduce((a, j) => a + j.mood, 0) / humor.length); out.push(['pen', `Humor médio: <b>${MOODS[m - 1][0]}</b>`]); }
  return out;
}

VIEWS.semana = () => {
  const seg = addDays(segundaDe(today()), 7 * (S.semanaOff || 0)), P = semanaP(seg), A = semanaP(addDays(seg, -7)), s = statsOf(P), a = statsOf(A), R = store.doc('semana/' + seg) || {};
  const pct = (x) => (x.hab ? Math.round(x.hab.pct * 100) : null);
  const delta = (v, w, suf = '') => (v == null || w == null || v === w ? '<small class="muted">=</small>' : `<small class="${v > w ? 'up' : 'down'}">${v > w ? '▲' : '▼'} ${fmt(Math.abs(v - w))}${suf}</small>`);
  const cel = (v, lbl, w, suf = '') => `<div><b>${v == null ? '—' : fmt(v) + suf}</b><span>${lbl}</span>${delta(v, w, suf)}</div>`;
  const dias = Array.from({ length: 7 }, (_, i) => addDays(seg, i)), act = game().act;
  const m = dias.filter((d) => d <= today()).map((d) => mission(d).pct), nota = m.length ? Math.round(m.reduce((x, y) => x + y, 0) / m.length) : 0;
  const dest = destaquesSemana(P), atual = (S.semanaOff || 0) === 0;
  return `<header class="top"><div><span class="eyebrow">${shortDate(seg)} a ${shortDate(addDays(seg, 6))}</span><h1>${atual ? 'Sua semana' : 'Semana passada'}</h1></div>
      <div class="mnav-sm"><button class="icon-btn" data-act="semanaNav" data-id="-1" aria-label="Semana anterior">‹</button><button class="icon-btn" data-act="semanaNav" data-id="1" aria-label="Próxima semana" ${atual ? 'disabled' : ''}>›</button></div></header>
    <section class="card semana-hero">${ring(nota / 100, 'var(--brand)', 110, `<b>${nota}%</b><small>da missão</small>`)}<div class="grow">
      <div class="sem-dias">${dias.map((d) => { const n = act.get(d)?.size || 0; return `<div class="${d === today() ? 'hoje' : ''} ${d > today() ? 'futuro' : ''}"><span>${DIAS_C[dow(d)]}</span><i class="l${Math.min(4, n)}"></i></div>`; }).join('')}</div>
      <p class="tiny muted">${nota >= 80 ? 'Semana forte. Constância é isso.' : nota >= 50 ? 'Boa semana. Dá para ajustar uma coisa ou outra.' : 'Semana difícil acontece. O que importa é a próxima.'}</p></div></section>
    <section class="card"><span class="eyebrow">Comparado à semana anterior</span><div class="stats three" style="margin-top:12px">${cel(pct(s), 'dos hábitos', pct(a), '%')}${areaOn('treino') ? cel(s.treinos, 'treinos', a.treinos) : ''}
      ${areaOn('leitura') ? cel(s.pages, 'páginas', a.pages) : ''}${areaOn('devocional') ? cel(s.devos, 'devocionais', a.devos) : ''}${areaOn('escrita') ? cel(s.entradas, 'entradas no diário', a.entradas) : ''}${areaOn('dieta') && store.doc('config/dieta') ? cel(s.dieta == null ? null : Math.round(s.dieta * 100), 'de adesão à dieta', a.dieta == null ? null : Math.round(a.dieta * 100), '%') : ''}${cel(s.full, 'dias perfeitos', a.full)}</div></section>
    ${dest.length ? `<section class="card"><span class="eyebrow">Destaques</span>${dest.map(([i, t]) => `<div class="pr-row static">${ic(i, 18)}<span class="grow">${t}</span></div>`).join('')}</section>` : ''}
    <form class="card" data-form="revisao" data-id="${seg}"><span class="eyebrow">Revisão da semana${R.c ? ' · feita' : ` · +${XP.revisao} XP`}</span>
      <label>O que funcionou?<textarea name="funcionou" rows="2" placeholder="Ex.: treinar de manhã cedo">${esc(R.funcionou || '')}</textarea></label>
      <label>O que ajustar?<textarea name="ajustar" rows="2" placeholder="Ex.: dormir mais cedo na quarta">${esc(R.ajustar || '')}</textarea></label>
      <label>Foco da próxima semana<input name="foco" value="${esc(R.foco || '')}" placeholder="Uma coisa só"></label>
      <div class="form-actions"><button class="btn">${R.c ? 'Salvar' : 'Concluir revisão'}</button></div></form>`;
};
const focoDaSemana = () => store.doc('semana/' + addDays(segundaDe(today()), -7))?.foco || store.doc('semana/' + segundaDe(today()))?.foco || '';

ACT.semanaNav = (n) => { S.semanaOff = Math.min(0, (S.semanaOff || 0) + Number(n)); S.lastPage = ''; render(); };
FORMS.revisao = (v, f) => {
  const k = 'semana/' + f.dataset.id, R = store.doc(k) || {}, novo = !R.c;
  store.set(k, { ...R, funcionou: v.funcionou.trim(), ajustar: v.ajustar.trim(), foco: v.foco.trim(), c: R.c || today() });
  if (novo) { confetti(80); toast(`Revisão feita · +${XP.revisao} XP`); } else toast('Revisão salva');
};
