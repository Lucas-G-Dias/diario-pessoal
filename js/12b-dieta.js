/* ============ Dieta: plano de refeições com horário; marcar no plano, fora do plano ou pulei; água; adesão ============
   config/dieta   { refeicoes: [{ id, nome, hora, dias: 'todos'|'uteis'|'fds' }], agua: <meta de copos> }
   dietalog/<dia> { r: { <id>: 'ok'|'fora'|'pulei' }, notas: { <id>: texto }, agua: n }
   Pontos: no plano = 1 · fora do plano = 0,5 (comeu no horário) · pulei = 0. Dia na dieta = adesão de 80% ou mais. */
const DIETA_PADRAO = [['cafe', 'Café da manhã', '07:00'], ['lanche1', 'Lanche da manhã', '10:00'], ['almoco', 'Almoço', '12:30'], ['lanche2', 'Lanche da tarde', '16:00'], ['jantar', 'Jantar', '19:30']];
const PONTO = { ok: 1, fora: 0.5, pulei: 0 };
const ST_DIETA = { ok: ['No plano', 'check', '#30b158'], fora: ['Fora do plano', 'minus', '#ff9f0a'], pulei: ['Pulei', 'x', '#ff3b30'] };
const dietaCfg = () => { const c = store.doc('config/dieta'); return { agua: 8, ...(c || {}), refeicoes: c?.refeicoes || DIETA_PADRAO.map(([id, nome, hora]) => ({ id, nome, hora, dias: 'todos' })) }; };
const dietaLog = (d) => store.doc('dietalog/' + d) || { r: {}, notas: {}, agua: 0 };
const refDueOn = (r, d) => { const w = dow(d); if (r.desde && d < r.desde) return false; return r.dias === 'uteis' ? w > 0 && w < 6 : r.dias === 'fds' ? w === 0 || w === 6 : true; };
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
  const top = Object.entries(cont).sort((a, b) => b[1] - a[1])[0]; if (!top || top[1] < 3) return null;
  const r = dietaCfg().refeicoes.find((x) => x.id === top[0]); return r ? { nome: r.nome, n: top[1] } : null;
}
/* próxima refeição sem marcar (já passou da hora ou vem na próxima hora) */
function proximaRefeicao() { const t = today(), L = dietaLog(t), now = agoraMin(); return refsDoDia(t).find((r) => !L.r[r.id] && hm(r.hora) <= now + 60) || null; }

VIEWS.dieta = () => {
  const t = today(), L = dietaLog(t), rs = refsDoDia(t), c = dietaCfg(), now = agoraMin(), a = adesaoDia(t), prox = rs.find((r) => !L.r[r.id] && hm(r.hora) >= now - 90);
  const sem = adesaoPeriodo(lastDays(7)), mes = adesaoPeriodo(pastDays(periodOf('mes'))), escapa = maisEscapa(), copos = L.agua || 0;
  const linha = (r) => { const s = L.r[r.id], st = ST_DIETA[s], passou = hm(r.hora) <= now;
    return `<div class="ref ${s ? 'marcada ' + s : ''} ${prox === r ? 'agora' : ''}" style="--rc:${st ? st[2] : 'var(--faint)'}"><div class="ref-h"><b class="ref-hora">${r.hora}</b><span class="grow"><strong>${esc(r.nome)}</strong>
      <span class="tiny muted">${st ? st[0] : prox === r ? (passou ? 'Agora' : 'Próxima') : passou ? 'Ainda sem marcar' : 'Mais tarde'}${L.notas?.[r.id] ? ' · ' + esc(L.notas[r.id]) : ''}</span></span>
      <button class="icon-btn" data-act="dietaNota" data-id="${r.id}" aria-label="Anotar sobre ${esc(r.nome)}">${ic('edit', 15)}</button></div>
      <div class="ref-bts">${Object.entries(ST_DIETA).map(([k, [n, i]]) => `<button class="${s === k ? 'on' : ''}" style="--bc:${ST_DIETA[k][2]}" data-act="dietaMarcar" data-id="${r.id}:${k}" aria-pressed="${s === k}">${ic(i, 14)} ${n}</button>`).join('')}</div></div>`; };
  const grade = lastDays(28).map((d) => { const x = adesaoDia(d); return `<i class="${!x ? 'vazio' : x.pct >= 0.8 ? 'l4' : x.pct >= 0.5 ? 'l2' : 'l1'} ${d === t ? 'today' : ''}" title="${shortDate(d)}: ${x ? Math.round(x.pct * 100) + '%' : 'sem registro'}"></i>`; }).join('');
  const pct = (v) => (v == null ? '—' : Math.round(v * 100) + '%');
  return `<header class="top"><div><span class="eyebrow">${longDate(t)}</span><h1>Dieta</h1></div><button class="btn-sm" data-act="dietaPlano">${ic('edit', 14)} Plano</button></header>
    <section class="card dieta-hero">${ring(a ? a.pct : 0, AREAS.dieta[2], 92, `<b>${a ? Math.round(a.pct * 100) + '%' : '—'}</b><small>hoje</small>`)}
      <div class="stats three"><div><b>${pct(sem)}</b><span>últimos 7 dias</span></div><div><b>${pct(mes)}</b><span>no mês</span></div><div><b>${dietaStreak()}</b><span>dias seguidos na dieta</span></div></div></section>
    <section class="card refs"><span class="eyebrow">Refeições de hoje · ${rs.filter((r) => L.r[r.id]).length} de ${rs.length} marcadas</span>${rs.length ? rs.map(linha).join('') : '<p class="tiny muted">Nenhuma refeição para hoje no seu plano.</p>'}</section>
    <section class="card agua"><div class="row-between"><span class="eyebrow">Água · ${copos} de ${c.agua} copos</span><span class="tiny muted">${fmt(copos * 0.25)} L</span></div>
      <div class="copos">${Array.from({ length: Math.max(c.agua, copos) }, (_, i) => `<button class="copo ${i < copos ? 'on' : ''}" data-act="dietaAgua" data-id="${i < copos ? i : i + 1}" aria-label="${i + 1} copos">${ic('drop', 20)}</button>`).join('')}</div></section>
    <section class="card"><span class="eyebrow">Últimas 4 semanas</span><div class="hgrid dieta-g" aria-hidden="true">${grade}</div>
      <div class="cal-leg tiny muted"><span><i class="l4"></i>80% ou mais</span><span><i class="l2"></i>50–79%</span><span><i class="l1"></i>menos de 50%</span></div>
      ${escapa ? `<p class="sugere">${ic('chart', 14)}<span class="grow">A refeição que mais escapa é <b>${esc(escapa.nome)}</b> (${escapa.n} vezes em 30 dias). Vale planejar melhor esse horário.</span></p>` : ''}</section>
    <section class="card"><span class="eyebrow">Adesão por semana · toque nos pontos</span>${lineChart(Array.from({ length: 12 }, (_, k) => { const seg = addDays(segundaDe(t), -7 * (11 - k)), v = adesaoPeriodo(Array.from({ length: 7 }, (_, j) => addDays(seg, j)).filter((d) => d <= t)); return v == null ? null : { d: seg, v: Math.round(v * 100) }; }).filter(Boolean), { cor: AREAS.dieta[2], unid: '%', alvo: 80 })}
      ${areaOn('saude') && serie('peso').length ? `<span class="eyebrow">Peso no mesmo período</span>${lineChart(serie('peso').filter((p) => p.d >= addDays(t, -84)), { cor: '#30b0c7', unid: ' kg', alvo: cfg().metaPeso || null })}` : ''}</section>`;
};

function formPlano() {
  const c = dietaCfg(), dias = [['todos', 'Todo dia'], ['uteis', 'Dias úteis'], ['fds', 'Fim de semana']];
  return `<form data-form="dietaPlano"><p class="tiny muted">Suas refeições e horários. Os lembretes chegam no horário de cada uma, se ainda não estiver marcada.</p>
    <div class="ref-edit">${c.refeicoes.map((r, i) => `<div class="ref-e"><input name="n${i}" value="${esc(r.nome)}" aria-label="Nome da refeição ${i + 1}" required><input type="time" name="h${i}" value="${r.hora}" aria-label="Horário" required>
      <select name="d${i}" aria-label="Dias">${dias.map(([k, n]) => `<option value="${k}" ${r.dias === k ? 'selected' : ''}>${n}</option>`).join('')}</select><input type="hidden" name="i${i}" value="${r.id}">
      <button type="button" class="icon-btn" data-act="dietaTirar" data-id="${i}" aria-label="Tirar ${esc(r.nome)}">${ic('trash', 15)}</button></div>`).join('')}</div>
    <button type="button" class="btn ghost wide" data-act="dietaMais">${ic('plus', 14)} Refeição</button>
    <label>Meta de água (copos de 250 ml)<input type="number" name="agua" min="1" max="20" value="${c.agua}"></label>
    <div class="form-actions"><button class="btn">Salvar plano</button></div></form>`;
}
function lerPlano(f) { const v = Object.fromEntries(new FormData(f)), out = [], antes = Object.fromEntries(dietaCfg().refeicoes.map((r) => [r.id, r.desde]));
  for (let i = 0; v['n' + i] !== undefined; i++) out.push({ id: v['i' + i], nome: v['n' + i].trim(), hora: v['h' + i], dias: v['d' + i], ...(antes[v['i' + i]] ? { desde: antes[v['i' + i]] } : {}) }); return { refeicoes: out, agua: Number(v.agua) || 8 }; }

Object.assign(ACT, {
  dietaMarcar: (k) => {
    const [id, s] = k.split(':'), t = today(), L = dietaLog(t), novo = L.r[id] === s ? undefined : s, r = { ...L.r }; if (novo) r[id] = novo; else delete r[id];
    if (!store.doc('config/dieta')) store.set('config/dieta', { ...dietaCfg(), desde: t }, true);
    store.set('dietalog/' + t, { ...L, r }); if (novo === 'ok') floatXP(`+${XP.refeicao} XP`); else if (novo) haptic(10);
    if (novo && refsDoDia(t).every((x) => r[x.id])) { const a = adesaoDia(t); if (a.pct >= 0.8) { confetti(60); toast(`Dia na dieta! ${Math.round(a.pct * 100)}% de adesão`); } }
    checkFullDay();
  },
  dietaNota: (id) => { const L = dietaLog(today()), n = prompt('Anotação sobre esta refeição (ex.: pizza no aniversário):', L.notas?.[id] || ''); if (n === null) return;
    store.set('dietalog/' + today(), { ...L, notas: { ...(L.notas || {}), [id]: n.trim() } }); },
  dietaAgua: (n) => { const L = dietaLog(today()), v = Number(n) === (L.agua || 0) ? Number(n) - 1 : Number(n); store.set('dietalog/' + today(), { ...L, agua: Math.max(0, v) }); haptic(8); },
  dietaPlano: () => openModal('Plano de refeições', formPlano()),
  dietaMais: (_, el) => { const p = lerPlano(el.form); p.refeicoes.push({ id: 'r' + uid().slice(-5), nome: 'Nova refeição', hora: '15:00', dias: 'todos', desde: today() }); store.set('config/dieta', { ...dietaCfg(), ...p }, true); openModal('Plano de refeições', formPlano()); },
  dietaTirar: (i, el) => { const p = lerPlano(el.form); p.refeicoes.splice(Number(i), 1); store.set('config/dieta', { ...dietaCfg(), ...p }, true); openModal('Plano de refeições', formPlano()); },
});
FORMS.dietaPlano = (v, f) => { const p = lerPlano(f); if (!p.refeicoes.length) { toast('Deixe pelo menos uma refeição'); return; } store.set('config/dieta', { ...(store.doc('config/dieta') || { desde: today() }), ...p }); closeModal(); toast('Plano salvo'); };
