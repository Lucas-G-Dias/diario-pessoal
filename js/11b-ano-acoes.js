/* ============ Bíblia em um ano: ações, calendário, livros ============ */
function anoAbrir(i) { S.anoDom = null; S.anoDia = clamp(Number(i), 0, ANO_N - 1); closeModal(); S.page = 'ano'; history.replaceState(null, '', '#ano'); render(); }

/* marca os capítulos lidos em bible/main (conta nas conquistas e no plano livre) */
function marcarCaps(caps, data) {
  const b = store.doc('bible/main') || {}, read = { ...(b.read || {}) };
  caps.forEach((k) => { if (!read[k]) read[k] = data; });
  store.set('bible/main', { ...b, read }, true);
}
function capsDoDia(i, d) {
  const out = []; ANO.plan[i].forEach(([b, a, z]) => { for (let n = a; n <= z; n++) out.push(`${capCode(b)}:${n}`); });
  const ps = psOf(i); if (ps.length === 1 || ps[2] === 176) out.push(`Sl:${ps[0]}`);
  if ((anoCfg().pv || {})[d]) pvOf(d).forEach((n) => out.push(`Pv:${n}`));
  return out;
}
function tempoSessao(key, padrao) {
  const s = store.doc('session/ano');
  if (s && String(s.key) === String(key)) { store.del('session/ano'); return clamp(Math.round((Date.now() - s.start) / 60000), 1, 240); }
  return padrao;
}

/* calendário do mês */
function anoCalHTML() {
  const ds = anoDates(), byDate = Object.fromEntries(ds.map((d, i) => [d, i])), k = S.anoMes || today().slice(0, 7);
  const [y, m] = k.split('-').map(Number), first = `${k}-01`, last = new Date(y, m, 0).getDate(), cells = [];
  for (let b = 0; b < dow(first); b++) cells.push('<span></span>');
  for (let n = 1; n <= last; n++) {
    const d = `${k}-${pad(n)}`, i = byDate[d], dom = dow(d) === 0 && d >= ds[0] && d <= addDays(ds[ANO_N - 1], 7);
    let cls = 'fora', act = '';
    if (i !== undefined) { cls = anoDone(i) ? 'feito' : d < today() ? 'pend' : 'futuro'; act = `data-act="anoAbrir" data-id="${i}" aria-label="${shortDate(d)}: ${esc(anoRefs(i))}"`; }
    else if (dom) { cls = store.doc('anodom/' + d)?.c ? 'feito dom' : 'dom'; act = `data-act="anoDomingo" data-id="${d}" aria-label="Domingo ${shortDate(d)}: revisão"`; }
    cells.push(`<button class="cd ${cls} ${d === today() ? 'hoje' : ''}" ${act || 'disabled'}>${n}</button>`);
  }
  return `<div class="mnav"><button class="icon-btn" data-act="anoMes" data-id="-1" aria-label="Mês anterior">‹</button><strong>${monthLabel(k)}</strong><button class="icon-btn" data-act="anoMes" data-id="1" aria-label="Próximo mês">›</button></div>
    <div class="cal">${DIAS_C.map((x) => `<span class="cw">${x}</span>`).join('')}${cells.join('')}</div>
    <div class="cal-leg tiny muted"><span><i class="feito"></i>feito</span><span><i class="pend"></i>em aberto</span><span><i class="futuro"></i>a fazer</span><span><i class="dom"></i>domingo</span></div>`;
}

/* livros na ordem do plano, com quanto já foi lido de cada um */
function anoLivrosHTML() {
  const ordem = []; ANO.plan.forEach((d) => d.forEach(([b]) => { if (!ordem.includes(b)) ordem.push(b); }));
  const lido = {}; ANO.plan.forEach((d, i) => { if (anoDone(i)) d.forEach(([b, a, z]) => { lido[b] = (lido[b] || 0) + z - a + 1; }); });
  const linha = (b) => { const [n, caps, t] = ANO.books[b], v = Math.min(caps, lido[b] || 0);
    return `<button class="pr-row" data-act="anoLivro" data-id="${b}"><span class="grow">${esc(n)}<span class="tiny muted">${t === 'NT' ? 'Novo' : 'Antigo'} Testamento · ${v}/${caps} capítulos</span></span>${v >= caps ? `<span class="tag ok">${ic('check', 12)}</span>` : ''}${ic('chev', 14)}</button>`; };
  return `<p class="tiny muted">Na ordem em que aparecem no plano. Salmos e Provérbios são lidos aos poucos, todos os dias.</p>${ordem.map(linha).join('')}${['Sl', 'Pv'].filter((b) => !ordem.includes(b)).map(linha).join('')}`;
}

function formAno() {
  const c = anoCfg(), amanha = addDays(today(), 1);
  return `<form data-form="anoIniciar"><p>312 dias de leitura, de segunda a sábado, com a Bíblia inteira: Antigo e Novo Testamento intercalados, um Salmo e um capítulo de Provérbios por dia.
    O domingo é para revisar a semana, anotar o culto e orar.</p>
    <label>Começar em<input type="date" name="start" required value="${c?.start || amanha}"></label>
    ${c ? '<p class="tiny muted">Você já tem este plano. Mudar a data recomeça a contagem; as leituras marcadas continuam salvas.</p>' : ''}
    <div class="form-actions"><button class="btn">${c ? 'Usar este plano' : 'Começar o plano'}</button></div></form>`;
}

Object.assign(ACT, {
  anoAbrir: (i) => anoAbrir(i),
  anoDomingo: (d) => { S.anoDom = d; closeModal(); S.page = 'ano'; render(); },
  anoModo: (v) => store.merge('plano/ano', { curto: v === '1' }),
  anoMarca: (k) => { const [i, f] = k.split(':'), L = anoLog(i); store.set('anolog/' + i, { ...L, [f]: !L[f] }); if (!L[f]) haptic(10); },
  anoPv: (d) => { const c = anoCfg(), pv = { ...(c.pv || {}) }; pv[d] = !pv[d]; store.merge('plano/ano', { pv }); },
  anoCronometro: (key) => { store.set('session/ano', { key, start: Date.now() }); toast('Tempo marcando. Bom devocional!'); },
  anoUsarVerso: (d, el) => { const D = store.doc('anodom/' + d) || {}; store.set('anodom/' + d, { ...D, versiculo: el.dataset.v }); },
  anoConcluir: (i) => {
    i = Number(i); const L = anoLog(i), d = anoDates()[i], min = tempoSessao(i, anoCfg().curto ? 20 : 60);
    store.set('anolog/' + i, { ...L, p: true, c: today(), min }, true);
    marcarCaps(capsDoDia(i, d), today());
    store.set('devos/ano-' + i, { date: today(), passage: anoRefs(i), obs: L.observo || L.entendo || '', app: L.aplico || L.mensagem || '', prayer: '', plano: i });
    confetti(); toast(`Dia ${i + 1} concluído · +${XP.devocional} XP`); checkFullDay();
  },
  anoConcluirDom: (d) => {
    const D = store.doc('anodom/' + d) || {}, min = tempoSessao('d' + d, 40);
    store.set('anodom/' + d, { ...D, c: today(), min }, true);
    if ((anoCfg().pv || {})[d]) marcarCaps(pvOf(d).map((n) => `Pv:${n}`), today());
    store.set('devos/dom-' + d, { date: today(), passage: 'Revisão da semana', obs: D.culto || '', app: D.aprendi || '', prayer: '', plano: 'dom' });
    confetti(); toast(`Domingo concluído · +${XP.devocional} XP`); checkFullDay();
  },
  anoReorganizar: () => {
    const p = anoPending(); if (!p.length) return;
    let fim = nextReading(today()); for (let i = p[0]; i < ANO_N - 1; i++) fim = nextReading(addDays(fim, 1));
    if (!confirm(`O dia ${p[0] + 1} passa a ser ${dow(today()) === 0 ? 'amanhã' : 'hoje'} e o plano termina em ${shortDate(fim)} de ${fim.slice(0, 4)}. As leituras feitas continuam marcadas.`)) return;
    const c = anoCfg(); store.merge('plano/ano', { ancoras: [...c.ancoras.filter((a) => a.idx < p[0]), { idx: p[0], data: nextReading(today()) }] }); toast('Plano reorganizado');
  },
  anoCalendario: () => { S.devTab = 'calendario'; S.page = 'devocional'; S.lastPage = ''; render(); },
  anoMes: (n) => { S.anoMes = shiftMonth(S.anoMes || today().slice(0, 7), Number(n)); if ($('#modal').open) openModal('Calendário do plano', anoCalHTML()); else render(); },
  anoLivros: () => { closeModal(); S.devTab = 'livros'; S.page = 'devocional'; S.lastPage = ''; render(); },
  anoLivro: (b) => openModal(ANO.books[b][0], bookCard(b, ANO.books[b][2] === 'NT' ? 'Novo Testamento' : 'Antigo Testamento', true) + `<button class="btn ghost wide" data-act="anoLivros">‹ Todos os livros</button>`),
  escolherAno: () => openModal('Bíblia em um ano', formAno()),
});

CHG.anoCampo = (el) => { const [i, k] = el.dataset.id.split(':'), L = anoLog(i); store.set('anolog/' + i, { ...L, [k]: el.value }, true); };
CHG.anoDomCampo = (el) => { const [d, k] = el.dataset.id.split(':'), D = store.doc('anodom/' + d) || {}; store.set('anodom/' + d, { ...D, [k]: el.value }, true); };

FORMS.anoIniciar = (v) => {
  const c = anoCfg(), start = v.start || addDays(today(), 1);
  store.set('plano/ano', { ...(c || {}), start, ancoras: [{ idx: 0, data: start }], curto: c?.curto || false, pv: c?.pv || {} }, true);
  store.merge('bible/main', { plan: 'ano' }); closeModal(); confetti(60);
  toast(start > today() ? `Plano começa ${start === addDays(today(), 1) ? 'amanhã' : 'em ' + shortDate(start)}. Bora!` : 'Plano começou. Bora!');
};
