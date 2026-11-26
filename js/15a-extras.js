/* ============ Ferramentas: arrastar para reordenar, restaurar backup, busca em tudo ============ */

/* ---- arrastar para reordenar: lista com data-sort="<coleção>", itens com data-sid, alça .drag ---- */
let ARR = null;
document.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('.drag'); if (!h) return;
  const item = h.closest('[data-sid]'), box = item?.parentElement; if (!item || !box?.dataset.sort) return;
  e.preventDefault(); h.setPointerCapture(e.pointerId); haptic(10);
  ARR = { item, box, y0: e.clientY, h }; item.classList.add('arrastando');
});
document.addEventListener('pointermove', (e) => {
  if (!ARR) return;
  const { item, box } = ARR; item.style.transform = `translateY(${e.clientY - ARR.y0}px)`;
  const irmaos = [...box.querySelectorAll(':scope > [data-sid]')].filter((x) => x !== item);
  for (const x of irmaos) {
    const r = x.getBoundingClientRect(), meio = r.top + r.height / 2, antes = item.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_PRECEDING;
    if (antes && e.clientY < meio) { const t = item.getBoundingClientRect().top; box.insertBefore(item, x); ARR.y0 += item.getBoundingClientRect().top - t; haptic(5); break; }
    if (!antes && e.clientY > meio) { const t = item.getBoundingClientRect().top; box.insertBefore(item, x.nextSibling); ARR.y0 += item.getBoundingClientRect().top - t; haptic(5); break; }
  }
  item.style.transform = `translateY(${e.clientY - ARR.y0}px)`;
});
document.addEventListener('pointerup', () => {
  if (!ARR) return;
  const { item, box } = ARR, col = box.dataset.sort; ARR = null; item.classList.remove('arrastando'); item.style.transform = '';
  [...box.querySelectorAll(':scope > [data-sid]')].forEach((x, i) => { const p = `${col}/${x.dataset.sid}`, d = store.doc(p); if (d && d.ord !== i) store.set(p, { ...d, ord: i }, true); });
  render();
});
const dragHandle = (nome) => `<button class="drag" aria-label="Arrastar ${esc(nome)} para mudar a ordem" title="Arrastar para reordenar">${ic('drag', 16)}</button>`;
const porOrdem = (a, b) => (a.ord ?? 1e6) - (b.ord ?? 1e6);

/* ---- restaurar backup (o arquivo baixado em Ajustes) ---- */
CHG.restaurar = (el) => {
  const f = el.files && el.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    let docs; try { docs = JSON.parse(r.result); } catch { toast('Esse arquivo não é um backup do Ritmo'); return; }
    if (!docs || typeof docs !== 'object' || !Object.values(docs).every((d) => d && 'data' in d)) { toast('Esse arquivo não é um backup do Ritmo'); return; }
    const n = Object.keys(docs).length;
    if (!confirm(`Restaurar ${n} registros deste backup? Eles voltam exatamente como estavam no backup. O que você criou depois do backup continua.`)) return;
    let k = 0;
    for (const [p, d] of Object.entries(docs)) {
      const cur = store.docs[p]; if (cur && JSON.stringify(cur.data) === JSON.stringify(d.data) && !!cur.deleted === !!d.deleted) continue;
      store.docs[p] = { data: d.data, t: Date.now(), deleted: !!d.deleted }; k++;
      if (!LOCAL && !store.outbox.includes(p)) store.outbox.push(p);
    }
    STATS.clear(); GAME = null; store.save(); store.flush(); render(); toast(k ? `${k} registros restaurados` : 'Nada a restaurar: o app já estava atualizado');
  };
  r.readAsText(f);
};

/* ---- busca em tudo ---- */
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function fontesBusca() {
  const out = [], add = (tipo, icon, titulo, texto, act, id, data) => out.push({ tipo, icon, titulo, texto: texto || '', act, id, data: data || '' });
  journal().forEach((j) => add('Escrita', 'pen', j.prompt || 'Entrada', [j.text, ...(j.grat || [])].join(' · '), 'editarEntrada', j.id, j.date));
  quotes().forEach((q) => add('Citação', 'quote', store.doc('books/' + q.bookId)?.title || 'Citação', q.text, 'verLivro', q.bookId, q.date));
  devos().forEach((d) => add('Devocional', 'cross', d.passage, [d.obs, d.app, d.prayer].join(' '), String(d.id).startsWith('ano-') ? 'anoAbrir' : 'editarDevocional', String(d.id).startsWith('ano-') ? String(d.id).slice(4) : d.id, d.date));
  store.col('anolog').forEach((L) => { const t = ['trecho', 'observo', 'entendo', 'aplico', 'versiculo', 'mensagem'].map((k) => L[k]).filter(Boolean).join(' · '); if (t) add('Plano anual', 'book', anoRefs(Number(L.id)), t, 'anoAbrir', L.id, anoDates()[L.id]); });
  books().forEach((b) => add('Livro', 'book', b.title, b.author, 'verLivro', b.id));
  habits().forEach((h) => add('Hábito', 'habit', h.name, '', 'editarHabito', h.id));
  workouts().forEach((w) => add('Treino', 'gym', w.name || w.type, [w.notes, ...(w.ex || []).map((x) => exById(x.id).n)].join(' · '), 'verTreino', w.id, w.date));
  prayers().forEach((p) => add('Oração', 'heart', p.text, p.answered ? 'respondida' : 'em oração', 'devTab', 'oracao', p.date));
  store.col('exames').forEach((x) => add('Exame', 'chart', x.lab || 'Exame de sangue', Object.keys(x.itens || {}).map((k) => EXAMES[k]?.[0] || k).join(', '), 'verExame', x.id, x.date));
  return out;
}
function marca(txt, q) {
  const s = String(txt), i = semAcento(s).indexOf(q); if (i < 0) return esc(s.slice(0, 120));
  const ini = Math.max(0, i - 40);
  return (ini ? '…' : '') + esc(s.slice(ini, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length, i + q.length + 80));
}
CHG.buscar = (el) => {
  const q = semAcento(el.value.trim()), box = $('#busca-res'); if (!box) return;
  if (q.length < 2) { box.innerHTML = '<p class="tiny muted">Digite pelo menos 2 letras. A busca olha diário, citações, devocionais, livros, hábitos, treinos, orações e exames.</p>'; return; }
  const res = fontesBusca().filter((x) => semAcento(x.titulo + ' ' + x.texto).includes(q)).sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 40);
  box.innerHTML = res.length ? res.map((x) => `<button class="pr-row" data-act="${x.act}" data-id="${esc(x.id)}">${ic(x.icon, 18)}<span class="grow"><b>${marca(x.titulo, q)}</b>
    <span class="tiny muted">${x.tipo}${x.data ? ' · ' + shortDate(x.data) : ''}${x.texto ? ' · ' + marca(x.texto, q) : ''}</span></span>${ic('chev', 14)}</button>`).join('') : `<p class="tiny muted">Nada encontrado para “${esc(el.value)}”.</p>`;
};
ACT.buscar = () => { openModal('Buscar', `<input type="search" class="busca-in" placeholder="Buscar em tudo…" data-inp="buscar" aria-label="Buscar em tudo" autofocus><div id="busca-res" class="busca-res"></div>`); CHG.buscar($('.busca-in')); };
