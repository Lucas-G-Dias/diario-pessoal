/* ============ Dieta: folha de cada refeição (marcar, anotar, editar, apagar), criar refeição, ajustes ============ */
const DIAS_REF = [['todos', 'Todo dia'], ['uteis', 'Dias úteis'], ['fds', 'Fim de semana']];
const salvarRefeicoes = (lista, extra = {}) => { const c = dietaCfg(); store.set('config/dieta', { ...c, desde: store.doc('config/dieta')?.desde || today(), ...extra, refeicoes: lista }, true); };

function formRefeicao(r = {}, semApagar) {
  const ico = r.icon || refIcon({ hora: r.hora || '12:00', nome: r.nome || '' });
  return `<form data-form="refeicao" data-id="${r.id || ''}" class="ref-form">
    <div class="grid2"><label>Nome<input name="nome" value="${esc(r.nome || '')}" placeholder="Ex.: Pré-treino" required autocomplete="off"></label>
    <label>Horário<input type="time" name="hora" value="${r.hora || ''}" required></label></div>
    <fieldset><legend>Em quais dias</legend><div class="seg">${DIAS_REF.map(([k, n]) => `<label class="seg-op"><input type="radio" name="dias" value="${k}" ${(r.dias || 'todos') === k ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div></fieldset>
    <fieldset><legend>Ícone</legend><div class="ref-icons">${REF_ICONS.map((i) => `<label class="ref-ico"><input type="radio" name="icon" value="${i}" ${ico === i ? 'checked' : ''}><span>${ic(i, 20)}</span></label>`).join('')}</div></fieldset>
    <div class="form-actions">${r.id && !semApagar ? `<button type="button" class="btn ghost danger" data-act="refApagar" data-id="${r.id}">${ic('trash', 16)} Apagar refeição</button>` : ''}<button class="btn">${r.id ? 'Salvar' : 'Adicionar'}</button></div></form>`;
}

/* folha da refeição: marcar grande, anotação e edição no mesmo lugar */
ACT.refAbrir = (id) => {
  const r = dietaCfg().refeicoes.find((x) => x.id === id); if (!r) return;
  const L = dietaLog(today()), s = L.r[id]; S.refAberta = id;
  openModal(r.nome, `<div class="ref-sheet"><div class="ref-sheet-top"><span class="tl-ic big">${ic(refIcon(r), 26)}</span><div><b>${r.hora}</b><span class="tiny muted">${DIAS_REF.find((d) => d[0] === (r.dias || 'todos'))[1]}</span></div></div>
    <div class="ref-grandes">${Object.entries(ST_DIETA).map(([k, [n, ico, cor]]) => `<button class="${s === k ? 'on' : ''}" style="--bc:${cor}" data-act="dietaMarcar" data-id="${id}:${k}" aria-pressed="${s === k}"><span>${ic(ico, 22)}</span>${n}<small>${k === 'ok' ? '1 ponto' : k === 'fora' ? 'meio ponto' : '0 ponto'}</small></button>`).join('')}</div>
    <label>Anotação de hoje<textarea rows="2" data-inp="refNota" data-id="${id}" placeholder="Ex.: pizza no aniversário, comi menos arroz">${esc(L.notas?.[id] || '')}</textarea></label>
    <details class="ref-editar"><summary>${ic('edit', 14)} Editar nome, horário, dias e ícone</summary>${formRefeicao(r, true)}</details>
    <button class="btn ghost danger wide" data-act="refApagar" data-id="${id}">${ic('trash', 16)} Apagar ${esc(r.nome)} do plano</button></div>`);
};
ACT.refNova = () => {
  const now = new Date(), h = `${pad(Math.min(23, now.getHours() + 1))}:00`;
  S.refAberta = null; openModal('Nova refeição', formRefeicao({ hora: h }));
};
ACT.refApagar = (id) => {
  const r = dietaCfg().refeicoes.find((x) => x.id === id); if (!r || !confirm(`Apagar "${r.nome}" do plano? Os dias anteriores continuam no seu histórico.`)) return;
  salvarRefeicoes(dietaCfg().refeicoes.map((x) => (x.id === id ? { ...x, ate: today() } : x)).filter((x) => !(x.id === id && (!x.desde || x.desde >= today()) && x.desde === today())));
  closeModal(); render(); toast(`${r.nome} saiu do plano`);
};
CHG.refNota = (el) => { const id = el.dataset.id, L = dietaLog(today()); store.set('dietalog/' + today(), { ...L, notas: { ...(L.notas || {}), [id]: el.value } }, true); };

FORMS.refeicao = (v, f) => {
  const lista = [...dietaCfg().refeicoes], id = f.dataset.id, dado = { nome: v.nome.trim(), hora: v.hora, dias: v.dias || 'todos', icon: v.icon };
  if (!dado.nome || !dado.hora) { toast('Dê um nome e um horário'); return; }
  if (id) { const i = lista.findIndex((x) => x.id === id); lista[i] = { ...lista[i], ...dado }; }
  else lista.push({ id: 'r' + uid().slice(-6), ...dado, desde: today() });
  salvarRefeicoes(lista); closeModal(); render(); toast(id ? 'Refeição atualizada' : `${dado.nome} entrou no plano às ${dado.hora}`); haptic(12);
};

/* ajustes: meta de água, lista do plano, voltar ao modelo */
ACT.dietaAjustes = () => {
  const c = dietaCfg(), rs = refsAtivas();
  openModal('Ajustes da dieta', `<button class="pr-row" data-act="aguaAjustes"><span class="tl-ic agua-ic">${ic('drop', 16)}</span><span class="grow">Água<span class="tiny muted">meta de ${litros(aguaMeta())} por dia · botões rápidos</span></span>${ic('chev', 14)}</button>
    <span class="eyebrow">Seu plano · ${rs.length} ${rs.length === 1 ? 'refeição' : 'refeições'}</span>
    ${rs.map((r) => `<button class="pr-row" data-act="refAbrir" data-id="${r.id}"><span class="tl-ic">${ic(refIcon(r), 16)}</span><span class="grow">${esc(r.nome)}<span class="tiny muted">${r.hora} · ${DIAS_REF.find((d) => d[0] === (r.dias || 'todos'))[1]}</span></span>${ic('chev', 14)}</button>`).join('')}
    <div class="form-actions start"><button class="btn ghost" data-act="refNova">${ic('plus', 14)} Refeição</button><button class="btn ghost" data-act="dietaModelo">Voltar ao modelo</button></div>`);
};
ACT.dietaModelo = () => {
  if (!confirm('Trocar seu plano pelo modelo (café, lanches, almoço e jantar)? O histórico continua.')) return;
  const hoje = today(), velhas = dietaCfg().refeicoes.map((x) => (x.ate ? x : { ...x, ate: hoje }));
  salvarRefeicoes([...velhas, ...DIETA_PADRAO.map(([id, nome, hora, icon]) => ({ id: id + '-' + uid().slice(-4), nome, hora, icon, dias: 'todos', desde: hoje }))]); closeModal(); render();
};

/* ---- editar o plano na própria tela: nome, horário e dias na linha, lixeira à vista, modelos prontos ---- */
const MODELOS_DIETA = {
  3: [['Café da manhã', '07:30', 'cup'], ['Almoço', '12:30', 'food'], ['Jantar', '19:30', 'food']],
  4: [['Café da manhã', '07:30', 'cup'], ['Almoço', '12:30', 'food'], ['Lanche da tarde', '16:00', 'apple'], ['Jantar', '19:30', 'food']],
  5: [['Café da manhã', '07:00', 'cup'], ['Lanche da manhã', '10:00', 'apple'], ['Almoço', '12:30', 'food'], ['Lanche da tarde', '16:00', 'apple'], ['Jantar', '19:30', 'food']],
  6: [['Café da manhã', '07:00', 'cup'], ['Lanche da manhã', '10:00', 'apple'], ['Almoço', '12:30', 'food'], ['Lanche da tarde', '16:00', 'apple'], ['Jantar', '19:30', 'food'], ['Ceia', '22:00', 'moon']],
};
function planoEditor() {
  const rs = refsAtivas();
  return `<section class="card refs editando"><div class="row-between"><span class="eyebrow">Editar plano · ${rs.length} ${rs.length === 1 ? 'refeição' : 'refeições'}</span><button class="btn-sm" data-act="dietaEditar">${ic('check', 14)} Pronto</button></div>
    <p class="tiny muted">Quantas refeições você faz por dia? Escolha um modelo e ajuste do seu jeito.</p>
    <div class="seg modelos">${[3, 4, 5, 6].map((n) => `<button class="${rs.length === n ? 'on' : ''}" data-act="dietaModeloN" data-id="${n}">${n} refeições</button>`).join('')}</div>
    <div class="pe-lista">${rs.map((r) => `<div class="pe-row"><span class="tl-ic">${ic(refIcon(r), 16)}</span>
      <input value="${esc(r.nome)}" data-chg="peCampo" data-id="${r.id}:nome" aria-label="Nome da refeição">
      <input type="time" value="${r.hora}" data-chg="peCampo" data-id="${r.id}:hora" aria-label="Horário de ${esc(r.nome)}">
      <select data-chg="peCampo" data-id="${r.id}:dias" aria-label="Dias de ${esc(r.nome)}">${DIAS_REF.map(([k, n]) => `<option value="${k}" ${(r.dias || 'todos') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="pe-del" data-act="refApagar" data-id="${r.id}" aria-label="Apagar ${esc(r.nome)}">${ic('trash', 16)}</button></div>`).join('') || '<p class="tiny muted">Nenhuma refeição. Escolha um modelo acima ou adicione.</p>'}</div>
    <button class="btn ghost wide" data-act="refNova">${ic('plus', 14)} Adicionar refeição</button>
    <p class="tiny muted">Apagar tira a refeição do plano a partir de hoje; os dias anteriores continuam no histórico.</p></section>`;
}
CHG.peCampo = (el) => {
  const [id, campo] = el.dataset.id.split(':'), v = el.value.trim(); if (!v) { toast('Esse campo não pode ficar vazio'); render(); return; }
  salvarRefeicoes(dietaCfg().refeicoes.map((x) => (x.id === id ? { ...x, [campo]: v } : x))); haptic(8);
  if (campo === 'hora') render();
};
ACT.dietaEditar = () => { S.dietaEdit = !S.dietaEdit; closeModal(); S.lastPage = ''; render(); };
/* troca pelo modelo de N refeições: aproveita as que já existem com o mesmo nome (mantém o que foi marcado hoje) */
ACT.dietaModeloN = (n) => {
  const m = MODELOS_DIETA[n], hoje = today(), ativas = refsAtivas(), norm = (x) => semAcento(x).trim();
  if (ativas.length && !confirm(`Usar o modelo de ${n} refeições? O que não estiver no modelo sai do plano a partir de hoje (o histórico continua).`)) return;
  const usadas = new Set(), lista = dietaCfg().refeicoes.map((x) => ({ ...x }));
  const novas = m.map(([nome, hora, icon]) => { const ja = lista.find((x) => !x.ate && !usadas.has(x.id) && norm(x.nome) === norm(nome)); if (ja) { usadas.add(ja.id); return null; } return { id: 'r' + uid().slice(-6), nome, hora, icon, dias: 'todos', desde: hoje }; }).filter(Boolean);
  const final = lista.map((x) => (x.ate || usadas.has(x.id) ? x : { ...x, ate: hoje })).filter((x) => !(x.ate === hoje && x.desde === hoje));
  salvarRefeicoes([...final, ...novas]); render(); toast(`Plano com ${n} refeições. Ajuste nomes e horários se quiser.`);
};
