/* ============ Leitura: livros, cronômetro de leitura, velocidade, previsão, citações, estante ============ */
const STATUS = { lendo: 'Lendo', quero: 'Quero ler', pausado: 'Pausados', lido: 'Lidos' };

function bookCover(b, size = '') {
  const c = b.color || SPINES[0];
  return `<div class="cover ${size} ${lightSpine(c) ? 'light' : ''}" style="--c:${c}"><span class="cover-t">${esc(b.title)}</span><span class="cover-a">${esc((b.author || '').split(' ').pop())}</span></div>`;
}

/* páginas por dia (média dos dias com leitura nos últimos 14) e velocidade (páginas por hora) */
function readingPace() {
  let pages = 0, dias = 0, min = 0, pMin = 0;
  for (const d of lastDays(14)) { const r = store.doc('reading/' + d); if (r?.pages) { pages += r.pages; dias++; if (r.min) { min += r.min; pMin += r.pages; } } }
  return { porDia: dias ? pages / dias : 0, porHora: min ? (pMin / min) * 60 : 0 };
}
function etaTxt(b) {
  const falta = (b.pages || 0) - (b.page || 0), p = readingPace();
  if (falta <= 0 || !p.porDia) return falta > 0 ? `${fmt(falta)} páginas restantes` : '';
  const dias = Math.ceil(falta / p.porDia);
  return `termina em ~${dias} ${dias === 1 ? 'dia' : 'dias'} (${shortDate(addDays(today(), dias))})`;
}

function estante() {
  const c = cfg(), y = today().slice(0, 4), lidos = books().filter((b) => b.status === 'lido' && (b.finished || '').startsWith(y));
  let pagesYear = 0; for (const [p, d] of Object.entries(store.docs)) if (!d.deleted && p.startsWith('reading/' + y)) pagesYear += d.data.pages || 0;
  const slots = Math.max(c.goalBooks, lidos.length), rows = [];
  for (let r = 0; r < Math.ceil(slots / 10); r++) {
    const cells = [];
    for (let i = r * 10; i < Math.min(slots, (r + 1) * 10); i++) { const b = lidos[i];
      cells.push(b ? `<button class="spine ${lightSpine(b.color) ? 'light' : ''}" style="--c:${b.color};--h:${80 + (b.pages || 300) % 30}%;--i:${i}" data-act="verLivro" data-id="${b.id}" aria-label="${esc(b.title)}"><span>${esc(b.title)}</span></button>` : '<span class="spine slot"></span>'); }
    rows.push(`<div class="shelf">${cells.join('')}</div>`);
  }
  const dia = dayOfYear() || 1, prev = lidos.length ? Math.round(lidos.length / dia * 365) : 0;
  return `<section class="card"><div class="row-between"><div><span class="eyebrow">Estante de ${y}</span><div class="serif xl">${lidos.length} <em class="muted-i">de ${c.goalBooks} livros</em></div></div>
    <div class="right"><div class="serif xl red">${fmt(pagesYear)}</div><span class="tiny muted">páginas no ano</span></div></div>${rows.join('')}
    <em class="tiny muted foot">${dia < 14 || !lidos.length ? 'A previsão aparece com o primeiro livro terminado.' : prev >= c.goalBooks ? `No ritmo atual, ~${prev} livros no ano. Meta batida.` : `No ritmo atual, ~${prev} livros no ano. Faltam ${c.goalBooks - prev} para a meta.`}</em></section>`;
}

function bookRow(b) {
  const pct = b.pages ? (b.page || 0) / b.pages : 0, em = b.status === 'lendo' || b.status === 'pausado';
  return `<button class="book-row" data-act="verLivro" data-id="${b.id}">${bookCover(b, 'sm')}<div class="grow"><strong class="serif">${esc(b.title)}</strong><em class="muted tiny">${esc(b.author)}</em>
    ${em ? progressBar(pct) + `<span class="tiny muted">pág. ${fmt(b.page || 0)} de ${fmt(b.pages)}</span>` : ''}
    ${b.status === 'lido' ? `<span class="tiny muted">terminado em ${shortDate(b.finished)}${b.rating ? ' · ' + '★'.repeat(b.rating) : ''}</span>` : ''}</div>${ic('chev', 16)}</button>`;
}

VIEWS.leitura = () => {
  const bs = books(), hist = lastDays(14).map((d) => ({ d, p: readingOn(d) })), max = Math.max(cfg().goalPages, ...hist.map((h) => h.p)), pace = readingPace(), sess = store.doc('session/leitura');
  const grupo = (st) => { const list = bs.filter((b) => b.status === st); return list.length ? `<h3 class="eyebrow sec">${STATUS[st]} · ${list.length}</h3><div class="book-list">${list.map(bookRow).join('')}</div>` : ''; };
  const qs = quotes();
  return `<header class="top"><h1 class="serif">Leitura</h1><button class="btn-sm" data-act="novoLivro">${ic('plus', 16)} Livro</button></header>
    ${sess ? `<button class="live big-live" data-act="pararLeitura">${ic('book', 20)}<span>Lendo agora</span><b class="tick" data-since="${sess.start}">${mmss(Date.now() - sess.start)}</b>${ic('stop', 16)}</button>` : ''}
    <section class="card"><div class="stats three"><div><b class="serif">${readingOn(today())}</b><span>páginas hoje</span></div><div><b class="serif">${fmt(Math.round(pace.porDia))}</b><span>pág./dia (14 d)</span></div><div><b class="serif">${pace.porHora ? fmt(Math.round(pace.porHora)) : '—'}</b><span>pág./hora</span></div></div>
      <div class="bars">${hist.map((h, i) => `<div class="bcol ${h.d === today() ? 'today' : ''}" title="${shortDate(h.d)}: ${h.p} pág."><i style="height:${(h.p / max) * 100}%;--i:${i}"></i><span>${DIAS_C[dow(h.d)]}</span></div>`).join('')}</div>
      <span class="tiny muted">Meta diária: ${cfg().goalPages} páginas</span></section>
    ${bs.length ? Object.keys(STATUS).map(grupo).join('') : '<div class="card empty"><em class="serif lg">Sua estante está vazia.</em><p class="muted">Cadastre o livro que está lendo e registre as páginas todo dia.</p></div>'}
    ${estante()}
    ${qs.length ? `<h3 class="eyebrow sec">Citações · ${qs.length}</h3>${qs.slice(0, 6).map(quoteCard).join('')}` : ''}`;
};

const quoteCard = (q) => { const b = store.doc('books/' + q.bookId); return `<figure class="card quote"><blockquote class="serif">“${esc(q.text)}”</blockquote>
  <figcaption class="tiny muted">${esc(b?.title || '')}${q.page ? ', p. ' + q.page : ''}<button class="icon-btn" data-act="apagarCitacao" data-id="${q.id}" aria-label="Apagar citação">${ic('trash', 14)}</button></figcaption></figure>`; };

/* ficha do livro: progresso, números, citações */
ACT.verLivro = (id) => {
  const b = { id, ...store.doc('books/' + id) }, pct = b.pages ? (b.page || 0) / b.pages : 0, qs = quotes().filter((q) => q.bookId === id);
  let min = 0; for (const [p, d] of Object.entries(store.docs)) if (!d.deleted && p.startsWith('reading/') && d.data.minBy?.[id]) min += d.data.minBy[id];
  openModal(b.title, `<div class="book-head">${bookCover(b, 'md')}<div class="grow"><em class="muted">${esc(b.author)}</em>
    <div class="big serif">${Math.round(pct * 100)}%</div>${progressBar(pct)}<span class="tiny muted">pág. ${fmt(b.page || 0)} de ${fmt(b.pages)}${b.status === 'lendo' ? ' · ' + etaTxt(b) : ''}</span>
    ${b.started ? `<span class="tiny muted">começou em ${shortDate(b.started)}${min ? ` · ${Math.round(min / 60 * 10) / 10} h lendo` : ''}</span>` : ''}</div></div>
    <div class="form-actions start">${b.status === 'lendo' ? `<button class="btn" data-act="iniciarLeitura" data-id="${id}">${ic('play', 14)} Ler agora</button><button class="btn ghost" data-act="registrarLeitura" data-id="${id}">Registrar páginas</button>` : ''}
      <button class="btn ghost" data-act="novaCitacao" data-id="${id}">${ic('quote', 14)} Citação</button><button class="btn ghost" data-act="editarLivro" data-id="${id}">Editar</button></div>
    ${qs.length ? `<span class="eyebrow">Citações</span>${qs.map(quoteCard).join('')}` : ''}`);
};

function formLivro(b = {}) {
  const st = { lendo: 'Lendo', quero: 'Quero ler', pausado: 'Pausado', lido: 'Lido' };
  const cores = SPINES.map((c, i) => `<label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}" ${(b.color || SPINES[books().length % SPINES.length]) === c ? 'checked' : ''} aria-label="Cor ${i + 1}"></label>`).join('');
  return `<form data-form="livro" data-id="${b.id || ''}">
    <label>Título<input name="title" required value="${esc(b.title)}" autocomplete="off"></label><label>Autor<input name="author" value="${esc(b.author)}" autocomplete="off"></label>
    <div class="grid2"><label>Total de páginas<input name="pages" type="number" min="1" inputmode="numeric" required value="${b.pages || ''}"></label>
    <label>Situação<select name="status">${Object.entries(st).map(([k, v]) => `<option value="${k}" ${(b.status || 'lendo') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <fieldset><legend>Cor da lombada</legend><div class="swatches">${cores}</div></fieldset>
    ${b.id && b.status === 'lido' ? `<label>Nota (1 a 5)<input name="rating" type="number" min="1" max="5" value="${b.rating || ''}"></label>` : ''}
    <div class="form-actions">${b.id ? `<button type="button" class="btn ghost danger" data-act="apagarLivro" data-id="${b.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}
function formLeitura(b, min) {
  return `<form data-form="leitura" data-id="${b.id}" data-min="${min || 0}"><p class="muted">${esc(b.title)} · você estava na página <b>${fmt(b.page || 0)}</b> de ${fmt(b.pages)}.${min ? ` Leu por <b>${min} min</b>.` : ''}</p>
    <label>Parei na página<input name="page" type="number" min="0" max="${b.pages}" inputmode="numeric" required autofocus></label>
    <div class="quick">${[5, 10, 20, 30, 50].map((n) => `<button type="button" class="chip" data-act="somarPaginas" data-id="${n}">+${n}</button>`).join('')}</div>
    <div class="form-actions"><button class="btn">Registrar</button></div></form>`;
}

Object.assign(ACT, {
  novoLivro: () => openModal('Novo livro', formLivro()),
  editarLivro: (id) => openModal('Editar livro', formLivro({ id, ...store.doc('books/' + id) })),
  apagarLivro: (id) => { if (confirm('Apagar este livro? As páginas já registradas continuam contando.')) { store.del('books/' + id); closeModal(); } },
  registrarLeitura: (id) => { const b = store.doc('books/' + id); if (b) openModal('Registrar leitura', formLeitura({ id, ...b })); },
  somarPaginas: (n, el) => { const f = el.form, b = store.doc('books/' + f.dataset.id); f.page.value = Math.min(b.pages, (Number(f.page.value) || b.page || 0) + Number(n)); },
  iniciarLeitura: (id) => { closeModal(); store.set('session/leitura', { bookId: id, start: Date.now() }); haptic(20); toast('Cronômetro ligado. Boa leitura!'); },
  pararLeitura: () => { const r = store.doc('session/leitura'); if (!r) return; const b = store.doc('books/' + r.bookId), min = Math.max(1, Math.round((Date.now() - r.start) / 60000));
    if (!b) { store.del('session/leitura'); return; } openModal('Fim da leitura', formLeitura({ id: r.bookId, ...b }, min)); },
  novaCitacao: (id) => openModal('Nova citação', `<form data-form="citacao" data-id="${id}"><label>Trecho<textarea name="text" rows="4" required></textarea></label>
    <label>Página<input name="page" type="number" min="1" inputmode="numeric"></label><div class="form-actions"><button class="btn">Guardar</button></div></form>`),
  apagarCitacao: (id) => { if (confirm('Apagar esta citação?')) { store.del('quotes/' + id); closeModal(); } },
});

Object.assign(FORMS, {
  livro: (v, f) => {
    const id = f.dataset.id || uid(), old = store.doc('books/' + id) || {};
    const b = { ...old, title: v.title.trim(), author: v.author.trim(), pages: Number(v.pages), status: v.status, color: v.color || SPINES[0], updated: Date.now() };
    if (v.rating) b.rating = clamp(Number(v.rating), 1, 5);
    if (b.status === 'lido' && !b.finished) { b.finished = today(); b.page = b.pages; }
    if (b.status === 'lendo' && !b.started) b.started = today();
    store.set('books/' + id, b); closeModal();
  },
  leitura: (v, f) => {
    const id = f.dataset.id, b = store.doc('books/' + id), page = clamp(Number(v.page), 0, b.pages), diff = page - (b.page || 0), min = Number(f.dataset.min) || 0;
    const p = 'reading/' + today(), day = store.doc(p) || { pages: 0, byBook: {} };
    if (diff > 0 || min) store.set(p, { ...day, pages: day.pages + Math.max(0, diff), byBook: { ...day.byBook, [id]: (day.byBook?.[id] || 0) + Math.max(0, diff) },
      min: (day.min || 0) + min, minBy: { ...(day.minBy || {}), [id]: (day.minBy?.[id] || 0) + min } }, true);
    if (min) store.del('session/leitura');
    const fim = page >= b.pages;
    store.set('books/' + id, { ...b, page, updated: Date.now(), ...(fim ? { status: 'lido', finished: today() } : {}) });
    closeModal();
    if (fim) { confetti(); toast(`Livro terminado! +${XP.livro} XP`); } else if (diff > 0) floatXP(`+${diff * XP.pagina} XP`);
    checkFullDay();
  },
  citacao: (v, f) => { store.set('quotes/' + uid(), { bookId: f.dataset.id, text: v.text.trim(), page: Number(v.page) || 0, date: today() }); closeModal(); toast(`Citação guardada · +${XP.citacao} XP`); },
});
