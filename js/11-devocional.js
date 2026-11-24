/* ============ Devocional: versículo do dia, devocional (método SOAP), plano de leitura bíblica, oração ============ */
function devoStreak() {
  const set = new Set([...devos().map((d) => d.date), ...Object.values(bibleRead())]);
  let d = set.has(today()) ? today() : addDays(today(), -1), n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

const SOAP = [['passage', 'Escritura', 'Qual passagem você leu?'], ['obs', 'Observação', 'O que o texto diz? O que chamou sua atenção?'],
  ['app', 'Aplicação', 'Como isso muda algo no seu dia, hoje?'], ['prayer', 'Oração', 'Escreva uma oração curta a partir do texto.']];

function devoHoje() {
  const d = devos().find((x) => x.date === today());
  if (!d) return `<button class="card cta" data-act="novoDevocional">${ic('pen', 22)}<div class="grow"><strong class="serif lg">Fazer o devocional de hoje</strong>
    <span class="tiny muted">Escritura, observação, aplicação e oração · +${XP.devocional} XP</span></div>${ic('chev', 18)}</button>`;
  return `<section class="card devo-done"><div class="row-between"><span class="eyebrow green-t">${ic('check', 14)} Devocional de hoje</span><button class="icon-btn" data-act="editarDevocional" data-id="${d.id}" aria-label="Editar devocional de hoje">${ic('edit', 16)}</button></div>
    <strong class="serif lg">${esc(d.passage)}</strong>${d.app ? `<p class="devo-txt">${esc(d.app)}</p>` : ''}</section>`;
}

function planoCard() {
  const p = planInfo();
  return `<section class="card plano">${ring(p.lidos / p.total, 'var(--gold)', 84, `<b class="serif">${Math.round((p.lidos / p.total) * 100)}%</b>`)}
    <div class="grow"><span class="eyebrow">Plano de leitura</span><strong class="serif lg">${p.nome}</strong><span class="tiny muted">${p.lidos} de ${p.total} capítulos</span>
    ${p.next ? `<button class="btn-sm" data-act="lerCapitulo" data-id="${p.next}">${ic('check', 14)} Li ${capLabel(p.next)}</button>` : '<span class="tag ok">Plano concluído!</span>'}
    <div class="row-gap"><button class="link" data-act="abrirBiblia">Ver capítulos</button><button class="link" data-act="trocarPlano">Trocar plano</button></div></div></section>`;
}

function oracaoCard() {
  const ps = prayers(), abertos = ps.filter((x) => !x.answered), resp = ps.filter((x) => x.answered);
  return `<section class="card"><div class="row-between"><span class="eyebrow">Pedidos de oração</span><span class="tiny muted">${resp.length} respondidas</span></div>
    <form class="add-row" data-form="oracao"><input name="text" placeholder="Novo pedido…" aria-label="Novo pedido de oração" required><button class="btn-sm">${ic('plus', 14)}</button></form>
    ${abertos.map((x) => `<div class="prayer"><span class="grow">${esc(x.text)}<span class="tiny muted">desde ${shortDate(x.date)}</span></span>
      <button class="btn-sm" data-act="oracaoRespondida" data-id="${x.id}">Respondida</button><button class="icon-btn" data-act="apagarOracao" data-id="${x.id}" aria-label="Apagar pedido">${ic('x', 14)}</button></div>`).join('')}
    ${resp.slice(0, 3).map((x) => `<div class="prayer done">${ic('heart', 16)}<span class="grow">${esc(x.text)}<span class="tiny muted">respondida em ${shortDate(x.answered)}</span></span></div>`).join('')}</section>`;
}

VIEWS.devocional = () => {
  const v = verseOfDay(), n = devoStreak(), hist = devos().filter((d) => d.date !== today()).slice(0, 8);
  return `<header class="top"><h1 class="serif">Devocional</h1><span class="tag gold">${ic('flame', 13)} ${n} ${n === 1 ? 'dia' : 'dias'}</span></header>
    <section class="card verse big-verse"><span class="eyebrow">Versículo do dia</span><blockquote class="serif">“${esc(v[1])}”</blockquote><span class="ref">${esc(v[0])}</span></section>
    ${devoHoje()}${planoCard()}${oracaoCard()}
    ${hist.length ? `<h3 class="eyebrow sec">Devocionais anteriores</h3><section class="card list">${hist.map((d) => `<button class="w-row" data-act="editarDevocional" data-id="${d.id}">
      <div class="w-date serif"><b>${Number(d.date.slice(8))}</b><span>${MESES[Number(d.date.slice(5, 7)) - 1]}</span></div><div class="grow"><strong>${esc(d.passage)}</strong><span class="tiny muted clamp1">${esc(d.app || d.obs || '')}</span></div>${ic('chev', 16)}</button>`).join('')}</section>` : ''}`;
};

function formDevo(d = {}) {
  const v = verseOfDay();
  return `<form data-form="devocional" data-id="${d.id || ''}">
    ${SOAP.map(([k, t, ph]) => k === 'passage' ? `<label>${t}<input name="${k}" required value="${esc(d[k] ?? v[0])}" placeholder="${ph}"></label>`
      : `<label>${t}<textarea name="${k}" rows="3" placeholder="${ph}">${esc(d[k] || '')}</textarea></label>`).join('')}
    <div class="form-actions">${d.id ? `<button type="button" class="btn ghost danger" data-act="apagarDevocional" data-id="${d.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}

/* Bíblia: grade de capítulos por livro (toque marca/desmarca, sem redesenhar a lista) */
function bibliaHTML() {
  const read = bibleRead(), sec = (titulo, lista) => `<h4 class="eyebrow">${titulo}</h4>${lista.map(([ab, nome, n]) => { const l = Array.from({ length: n }, (_, i) => read[capKey(ab, i + 1)]).filter(Boolean).length;
    return `<details class="bk"><summary><span>${nome}</span><span class="tiny muted">${l}/${n}</span></summary><div class="caps">${Array.from({ length: n }, (_, i) => { const k = capKey(ab, i + 1);
      return `<button class="cap ${read[k] ? 'on' : ''}" data-act="marcarCap" data-id="${k}" aria-pressed="${!!read[k]}" aria-label="${nome} ${i + 1}">${i + 1}</button>`; }).join('')}</div></details>`; }).join('')}`;
  return `<p class="tiny muted">${Object.keys(read).length} de 1.189 capítulos lidos.</p>${sec('Antigo Testamento', BIBLIA.slice(0, NT_START))}${sec('Novo Testamento', BIBLIA.slice(NT_START))}`;
}

Object.assign(ACT, {
  novoDevocional: () => openModal('Devocional de hoje', formDevo()),
  editarDevocional: (id) => openModal('Devocional', formDevo({ id, ...store.doc('devos/' + id) })),
  apagarDevocional: (id) => { if (confirm('Apagar este devocional?')) { store.del('devos/' + id); closeModal(); } },
  lerCapitulo: (k) => { const b = store.doc('bible/main') || {}; store.set('bible/main', { ...b, read: { ...(b.read || {}), [k]: today() } }); floatXP(`+${XP.capitulo} XP`); checkFullDay(); },
  marcarCap: (k, el) => {
    const b = store.doc('bible/main') || {}, read = { ...(b.read || {}) };
    if (read[k]) delete read[k]; else { read[k] = today(); haptic(8); }
    store.set('bible/main', { ...b, read }, true); el.classList.toggle('on', !!read[k]); el.setAttribute('aria-pressed', !!read[k]);
  },
  abrirBiblia: () => { openModal('Bíblia', bibliaHTML()); $('#modal').addEventListener('close', () => render(), { once: true }); },
  trocarPlano: () => openModal('Plano de leitura', `<div class="quick-grid one">${Object.entries(PLANOS).map(([id, [nome]]) => { const caps = planCaps(id), l = caps.filter((k) => bibleRead()[k]).length;
    return `<button class="qbtn row" data-act="escolherPlano" data-id="${id}"><b>${nome}</b><span class="tiny muted">${l}/${caps.length} capítulos</span></button>`; }).join('')}</div>`),
  escolherPlano: (id) => { store.merge('bible/main', { plan: id }); closeModal(); },
  oracaoRespondida: (id) => { const x = store.doc('prayers/' + id); store.set('prayers/' + id, { ...x, answered: today() }); confetti(60); toast(`Oração respondida · +${XP.oracao} XP`); },
  apagarOracao: (id) => { if (confirm('Apagar este pedido?')) store.del('prayers/' + id); },
});

Object.assign(FORMS, {
  devocional: (v, f) => {
    const id = f.dataset.id || uid(), novo = !f.dataset.id, old = store.doc('devos/' + id) || { date: today() };
    store.set('devos/' + id, { ...old, passage: v.passage.trim(), obs: v.obs.trim(), app: v.app.trim(), prayer: v.prayer.trim() });
    closeModal(); if (novo) { floatXP(`+${XP.devocional} XP`); toast(`Devocional feito · +${XP.devocional} XP`); } checkFullDay();
  },
  oracao: (v) => { if (!v.text.trim()) return; store.set('prayers/' + uid(), { text: v.text.trim(), date: today() }); },
});
