/* ============ Dieta: plano de refeições com horário; marcar no plano, fora do plano ou pulei; água; adesão ============
   config/dieta   { refeicoes: [{ id, nome, hora, dias: 'todos'|'uteis'|'fds', icon, desde, ate }], desde } (água: ver 12d-agua.js)
   Refeição apagada ganha 'ate' (some do plano, mas o histórico dos dias anteriores continua contando).
   dietalog/<dia> { r: { <id>: 'ok'|'fora'|'pulei' }, notas: { <id>: texto }, ml, goles }
   Pontos: no plano = 1 · fora do plano = 0,5 (comeu no horário) · pulei = 0. Dia na dieta = adesão de 80% ou mais. */
const DIETA_PADRAO = [['cafe', 'Café da manhã', '07:00', 'cup'], ['lanche1', 'Lanche da manhã', '10:00', 'apple'], ['almoco', 'Almoço', '12:30', 'food'], ['lanche2', 'Lanche da tarde', '16:00', 'apple'], ['jantar', 'Jantar', '19:30', 'food']];
const REF_ICONS = ['cup', 'apple', 'food', 'sun', 'moon', 'drop', 'gym', 'heart'];
const PONTO = { ok: 1, fora: 0.5, pulei: 0 };
const ST_DIETA = { ok: ['No plano', 'check', '#30b158'], fora: ['Fora do plano', 'minus', '#ff9f0a'], pulei: ['Pulei', 'x', '#ff3b30'] };
const dietaCfg = () => { const c = store.doc('config/dieta'); return { ...(c || {}), refeicoes: c?.refeicoes || DIETA_PADRAO.map(([id, nome, hora, icon]) => ({ id, nome, hora, icon, dias: 'todos' })) }; };
const refsAtivas = () => dietaCfg().refeicoes.filter((r) => !r.ate || r.ate > today()).sort((a, b) => a.hora.localeCompare(b.hora));
const refIcon = (r) => r.icon || (hm(r.hora) < 600 ? 'cup' : hm(r.hora) < 1080 && !/almo|jant/i.test(r.nome) ? 'apple' : 'food');
const dietaLog = (d) => store.doc('dietalog/' + d) || { r: {}, notas: {}, ml: 0, goles: [] };
const refDueOn = (r, d) => { const w = dow(d); if ((r.desde && d < r.desde) || (r.ate && d >= r.ate)) return false; return r.dias === 'uteis' ? w > 0 && w < 6 : r.dias === 'fds' ? w === 0 || w === 6 : true; };
const refsDoDia = (d) => dietaCfg().refeicoes.filter((r) => refDueOn(r, d)).sort((a, b) => a.hora.localeCompare(b.hora));
const agoraMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const hm = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };

/* adesão de um dia: hoje só conta o que já foi marcado ou já passou do horário */
function adesaoDia(d) {
  const desde = store.doc('config/dieta')?.desde; if (!desde || d < desde) return null;
  const L = dietaLog(d), rs = refsDoDia(d).filter((r) => d < today() || L.r[r.id] || hm(r.hora) <= agoraMin());
  if (!rs.length) return null;
  return { pontos: rs.reduce((a, r) => a + (PONTO[L.r[r.id]] || 0), 0), total: rs.length, pct: rs.reduce((a, r) => a + (PONTO[L.r[r.id]] || 0), 0) / rs.length };
}
function adesaoPeriodo(dias) {
  const desde = store.doc('config/dieta')?.desde || '9999'; let p = 0, t = 0;
  dias.forEach((d) => { if (d < desde) return; const a = adesaoDia(d); if (a) { p += a.pontos; t += a.total; } });
  return t ? p / t : null;
}
function dietaStreak() {
  let d = today(), n = 0, g = 0; const ok = (x) => { const a = adesaoDia(x); return a && a.pct >= 0.8 && (x < today() || a.total === refsDoDia(x).length); };
  if (!ok(d)) d = addDays(d, -1);
  while (ok(d) && g++ < 800) { n++; d = addDays(d, -1); }
  return n;
}
/* refeição que mais escapa (fora do plano ou pulada) nos últimos 30 dias */
function maisEscapa() {
  const cont = {}; lastDays(30).forEach((d) => { const L = dietaLog(d); Object.entries(L.r || {}).forEach(([id, s]) => { if (s !== 'ok') cont[id] = (cont[id] || 0) + 1; }); });
  const ativas = refsAtivas(), top = Object.entries(cont).filter(([id]) => ativas.some((x) => x.id === id)).sort((a, b) => b[1] - a[1])[0]; if (!top || top[1] < 3) return null;
  const r = ativas.find((x) => x.id === top[0]); return r ? { nome: r.nome, n: top[1] } : null;
}
/* próxima refeição sem marcar (já passou da hora ou vem na próxima hora) */
function proximaRefeicao() { const t = today(), L = dietaLog(t), now = agoraMin(); return refsDoDia(t).find((r) => !L.r[r.id] && hm(r.hora) <= now + 60) || null; }

/* linha do tempo das refeições de hoje (usada na Dieta e no Início) */
function refsTimeline(t = today()) {
  const L = dietaLog(t), rs = refsDoDia(t), now = agoraMin(), prox = rs.find((r) => !L.r[r.id] && hm(r.hora) >= now - 90);
  let agoraPos = rs.findIndex((r) => hm(r.hora) > now); if (agoraPos < 0) agoraPos = rs.length;
  const agora = `<div class="tl-now"><span>agora · ${pad(Math.floor(now / 60))}:${pad(now % 60)}</span></div>`;
  const item = (r, i) => { const s = L.r[r.id], st = ST_DIETA[s];
    return `<div class="tl-i ${s ? 'feito ' + s : hm(r.hora) <= now ? 'atras' : ''} ${prox === r ? 'agora' : ''}" style="--rc:${st ? st[2] : 'var(--faint)'};--i:${i}">
      <div class="tl-hora">${r.hora}</div><div class="tl-dot">${st ? ic(st[1], 12) : ''}</div>
      <div class="tl-card"><button class="tl-main" data-act="refAbrir" data-id="${r.id}" aria-label="${esc(r.nome)}: abrir"><span class="tl-ic">${ic(refIcon(r), 18)}</span>
        <span class="grow"><b>${esc(r.nome)}</b><span class="tiny muted">${st ? st[0] : prox === r ? (hm(r.hora) <= now ? 'Agora' : 'Próxima') : hm(r.hora) <= now ? 'Sem marcar' : 'Mais tarde'}${L.notas?.[r.id] ? ' · ' + esc(L.notas[r.id]) : ''}</span></span></button>
        <div class="tl-bts" role="group" aria-label="Como foi ${esc(r.nome)}">${Object.entries(ST_DIETA).map(([k, [n, ico, cor]]) => `<button class="${s === k ? 'on' : ''}" style="--bc:${cor}" data-act="dietaMarcar" data-id="${r.id}:${k}" aria-pressed="${s === k}" title="${n}" aria-label="${n}">${ic(ico, 16)}</button>`).join('')}</div></div></div>`; };
  return rs.map((r, i) => (i === agoraPos ? agora : '') + item(r, i)).join('') + (agoraPos === rs.length && rs.length ? agora : '');
}

/* cartão do Início: marcar as refeições sem sair da tela */
function dietaHoje() {
  const t = today(), rs = refsDoDia(t), L = dietaLog(t), feitas = rs.filter((r) => L.r[r.id]).length;
  if (!rs.length) return '';
  return `<section class="card refs dieta-inicio"><div class="row-between"><span class="eyebrow">Refeições de hoje · ${feitas}/${rs.length}</span><button class="link" data-page="dieta">Dieta ${ic('chev', 12)}</button></div>
    ${progressBar(feitas / rs.length, 'dieta')}<div class="tl">${refsTimeline(t)}</div></section>`;
}

VIEWS.dieta = () => {
  const t = today(), L = dietaLog(t), rs = refsDoDia(t), c = dietaCfg(), now = agoraMin(), a = adesaoDia(t);
  const sem = adesaoPeriodo(lastDays(7)), mes = adesaoPeriodo(pastDays(periodOf('mes'))), escapa = maisEscapa();
  const marcadas = rs.filter((r) => L.r[r.id]).length;
  const pct = (v) => (v == null ? '—' : Math.round(v * 100) + '%');
  const grade = lastDays(28).map((d) => { const x = adesaoDia(d); return `<i class="${!x ? 'vazio' : x.pct >= 0.8 ? 'l4' : x.pct >= 0.5 ? 'l2' : 'l1'} ${d === t ? 'today' : ''}" title="${shortDate(d)}: ${x ? Math.round(x.pct * 100) + '%' : 'sem registro'}"></i>`; }).join('');
  return `<header class="top"><div><span class="eyebrow">${longDate(t)}</span><h1>Dieta</h1></div><button class="btn-sm" data-act="dietaAjustes">${ic('gear', 14)} Ajustes</button></header>
    <section class="card dieta-hero">${ring(a ? a.pct : 0, AREAS.dieta[2], 96, `<b>${a ? Math.round(a.pct * 100) + '%' : '—'}</b><small>até agora</small>`)}
      <div class="stats three"><div><b>${pct(sem)}</b><span>últimos 7 dias</span></div><div><b>${pct(mes)}</b><span>no mês</span></div><div><b>${dietaStreak()}</b><span>dias seguidos</span></div></div></section>
    ${S.dietaEdit ? planoEditor() : `<section class="card refs"><div class="row-between"><span class="eyebrow">Refeições de hoje · ${marcadas}/${rs.length}</span>
      <div class="row-gap tight"><button class="btn-sm ghost" data-act="dietaEditar">${ic('edit', 14)} Editar plano</button><button class="btn-sm" data-act="refNova">${ic('plus', 14)}</button></div></div>
      ${progressBar(rs.length ? marcadas / rs.length : 0, 'dieta')}
      <div class="tl">${rs.length ? refsTimeline(t) : '<p class="tiny muted">Nenhuma refeição para hoje. Toque em "Editar plano" para montar o seu.</p>'}</div>
      <p class="tiny muted tl-dica">Toque numa refeição para anotar ou ajustar. Para apagar ou trocar refeições, use "Editar plano".</p></section>`}
    ${aguaCard(true)}
    <section class="card"><span class="eyebrow">Últimas 4 semanas</span><div class="hgrid dieta-g" aria-hidden="true">${grade}</div>
      <div class="cal-leg tiny muted"><span><i class="l4"></i>80% ou mais</span><span><i class="l2"></i>50–79%</span><span><i class="l1"></i>menos de 50%</span></div>
      ${escapa ? `<p class="sugere">${ic('chart', 14)}<span class="grow">A refeição que mais escapa é <b>${esc(escapa.nome)}</b> (${escapa.n} vezes em 30 dias). Vale planejar melhor esse horário.</span></p>` : ''}</section>
    <section class="card"><span class="eyebrow">Adesão por semana · toque nos pontos</span>${lineChart(Array.from({ length: 12 }, (_, k) => { const seg = addDays(segundaDe(t), -7 * (11 - k)), v = adesaoPeriodo(Array.from({ length: 7 }, (_, j) => addDays(seg, j)).filter((d) => d <= t)); return v == null ? null : { d: seg, v: Math.round(v * 100) }; }).filter(Boolean), { cor: AREAS.dieta[2], unid: '%', alvo: 80 })}
      ${areaOn('saude') && serie('peso').length ? `<span class="eyebrow">Peso no mesmo período</span>${lineChart(serie('peso').filter((p) => p.d >= addDays(t, -84)), { cor: '#30b0c7', unid: ' kg', alvo: cfg().metaPeso || null })}` : ''}</section>`;
};

Object.assign(ACT, {
  dietaMarcar: (k) => {
    const [id, s] = k.split(':'), t = today(), L = dietaLog(t), novo = L.r[id] === s ? undefined : s, r = { ...L.r }; if (novo) r[id] = novo; else delete r[id];
    if (!store.doc('config/dieta')) store.set('config/dieta', { ...dietaCfg(), desde: t }, true);
    store.set('dietalog/' + t, { ...L, r }); if (novo === 'ok') floatXP(`+${XP.refeicao} XP`); else if (novo) haptic(10);
    if (novo && refsDoDia(t).every((x) => r[x.id])) { const a = adesaoDia(t); if (a.pct >= 0.8) { confetti(60); toast(`Dia na dieta! ${Math.round(a.pct * 100)}% de adesão`); } }
    if ($('#modal').open && S.refAberta === id) ACT.refAbrir(id);
    checkFullDay();
  },
});
