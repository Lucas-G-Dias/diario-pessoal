/* ============ Leitura: livros, registro de páginas, estante ============ */
const STATUS = { lendo: 'Lendo', quero: 'Quero ler', lido: 'Lidos', pausado: 'Pausados' };

VIEWS.leitura = () => {
  const bs = books(), y = today().slice(0, 4);
  const hist = lastDays(14).map((d) => ({ d, p: readingOn(d) })), max = Math.max(cfg().goalPages, ...hist.map((h) => h.p));
  const grupo = (st) => {
    const list = bs.filter((b) => b.status === st); if (!list.length) return '';
    return `<h3 class="eyebrow sec">${STATUS[st]} · ${list.length}</h3><div class="book-list">${list.map(bookRow).join('')}</div>`;
  };
  return `<header class="top"><h1 class="serif">Leitura</h1><button class="btn-sm" data-act="novoLivro">${ic('plus', 16)} Livro</button></header>
    <section class="card"><span class="eyebrow">Páginas · 14 dias</span>
      <div class="bars">${hist.map((h) => `<div class="bcol ${h.d === today() ? 'today' : ''}" title="${shortDate(h.d)}: ${h.p} pág."><i style="height:${(h.p / max) * 100}%"></i><span>${DIAS_C[dow(h.d)]}</span></div>`).join('')}</div>
      <div class="tiny muted">Meta diária: ${cfg().goalPages} páginas · ${bs.filter((b) => b.status === 'lido' && (b.finished || '').startsWith(y)).length} livros lidos em ${y}</div></section>
    ${bs.length ? Object.keys(STATUS).map(grupo).join('') : '<div class="card empty"><em class="serif lg">Sua estante está vazia.</em><p class="muted">Cadastre o livro que está lendo e registre as páginas todo dia.</p></div>'}`;
};

function bookRow(b) {
  const pct = b.pages ? (b.page || 0) / b.pages : 0;
  return `<div class="book-row">${bookCover(b, 'sm')}<div class="grow"><strong class="serif">${esc(b.title)}</strong><em class="muted tiny">${esc(b.author)}</em>
    ${b.status === 'lendo' || b.status === 'pausado' ? progressBar(pct) + `<span class="tiny muted">pág. ${fmt(b.page || 0)} de ${fmt(b.pages)}</span>` : ''}
    ${b.status === 'lido' ? `<span class="tiny muted">terminado em ${shortDate(b.finished)}${b.rating ? ' · ' + '★'.repeat(b.rating) : ''}</span>` : ''}</div>
    <div class="row-actions">${b.status === 'lendo' ? `<button class="btn-sm" data-act="registrarLeitura" data-id="${b.id}" aria-label="Registrar páginas de ${esc(b.title)}">${ic('plus', 16)}</button>` : ''}
    <button class="icon-btn" data-act="editarLivro" data-id="${b.id}" aria-label="Editar ${esc(b.title)}">${ic('edit', 18)}</button></div></div>`;
}

function formLivro(b = {}) {
  const st = Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(b.status || 'lendo') === k ? 'selected' : ''}>${v.replace('Lidos', 'Lido').replace('Pausados', 'Pausado')}</option>`).join('');
  const cores = SPINES.map((c, i) => `<label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}" ${(b.color || SPINES[books().length % SPINES.length]) === c ? 'checked' : ''} aria-label="Cor ${i + 1}"></label>`).join('');
  return `<form data-form="livro" data-id="${b.id || ''}">
    <label>Título<input name="title" required value="${esc(b.title)}" autocomplete="off"></label>
    <label>Autor<input name="author" value="${esc(b.author)}" autocomplete="off"></label>
    <div class="grid2"><label>Total de páginas<input name="pages" type="number" min="1" inputmode="numeric" required value="${b.pages || ''}"></label>
    <label>Situação<select name="status">${st}</select></label></div>
    <fieldset><legend>Cor da lombada</legend><div class="swatches">${cores}</div></fieldset>
    ${b.id && b.status === 'lido' ? `<label>Nota (1 a 5)<input name="rating" type="number" min="1" max="5" value="${b.rating || ''}"></label>` : ''}
    <div class="form-actions">${b.id ? `<button type="button" class="btn ghost danger" data-act="apagarLivro" data-id="${b.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}

function formLeitura(b) {
  return `<form data-form="leitura" data-id="${b.id}"><p class="muted">${esc(b.title)} · você estava na página <b>${fmt(b.page || 0)}</b> de ${fmt(b.pages)}.</p>
    <label>Parei na página<input name="page" type="number" min="0" max="${b.pages}" inputmode="numeric" required autofocus value=""></label>
    <div class="quick">${[10, 20, 30, 50].map((n) => `<button type="button" class="chip" data-act="somarPaginas" data-id="${n}">+${n}</button>`).join('')}</div>
    <div class="form-actions"><button class="btn">Registrar</button></div></form>`;
}

Object.assign(ACT, {
  novoLivro: () => openModal('Novo livro', formLivro()),
  editarLivro: (id) => openModal('Editar livro', formLivro({ id, ...store.doc('books/' + id) })),
  apagarLivro: (id) => { if (confirm('Apagar este livro? As páginas já registradas continuam contando.')) { store.del('books/' + id); closeModal(); } },
  registrarLeitura: (id) => { const b = store.doc('books/' + id); if (b) openModal('Registrar leitura', formLeitura({ id, ...b })); },
  somarPaginas: (n, el) => { const f = el.form, b = store.doc('books/' + f.dataset.id); f.page.value = Math.min(b.pages, (Number(f.page.value) || b.page || 0) + Number(n)); },
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
    const id = f.dataset.id, b = store.doc('books/' + id), page = clamp(Number(v.page), 0, b.pages), diff = page - (b.page || 0);
    const p = 'reading/' + today(), day = store.doc(p) || { pages: 0, byBook: {} };
    if (diff > 0) store.set(p, { pages: day.pages + diff, byBook: { ...day.byBook, [id]: (day.byBook?.[id] || 0) + diff } });
    const fim = page >= b.pages;
    store.set('books/' + id, { ...b, page, updated: Date.now(), ...(fim ? { status: 'lido', finished: today() } : {}) });
    closeModal();
    toast(fim ? `Livro terminado! +${XP.livro} XP` : diff > 0 ? `+${diff} páginas · +${diff * XP.pagina} XP` : 'Página atualizada');
    checkFullDay();
  },
});
