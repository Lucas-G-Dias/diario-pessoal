/* ============ Treino ao vivo: séries, descanso, recordes; fichas; atividade rápida ============
   A sessão fica em session/treino (sincroniza: dá para continuar em outro aparelho). */
const sess = () => store.doc('session/treino');
const saveSess = (s, silent) => store.set('session/treino', s, silent);
const blankSet = (prev) => ({ kg: prev?.kg ?? '', reps: prev?.reps ?? '', done: false });

VIEWS.sessao = () => {
  const s = sess();
  if (!s) { S.page = 'treino'; return VIEWS.treino(); }
  const vol = s.ex.reduce((a, x) => a + x.sets.filter((z) => z.done).reduce((b, z) => b + (+z.kg || 0) * (+z.reps || 0), 0), 0);
  const feitas = s.ex.reduce((a, x) => a + x.sets.filter((z) => z.done).length, 0);
  const blocos = s.ex.map((x, ei) => { const prev = lastSets(x.id);
    return `<section class="card exb"><div class="row-between"><button class="ex-name serif" data-act="verExercicio" data-id="${x.id}">${esc(exById(x.id).n)}</button>
      <button class="icon-btn" data-act="tirarExercicio" data-id="${ei}" aria-label="Tirar ${esc(exById(x.id).n)} do treino">${ic('trash', 16)}</button></div>
      <div class="sets"><div class="set head"><span>Série</span><span>Anterior</span><span>kg</span><span>Reps</span><span>${ic('check', 14)}</span></div>
      ${x.sets.map((z, si) => `<div class="set ${z.done ? 'done' : ''}"><span class="sn">${si + 1}</span><span class="prev">${prev[si] ? `${fmt(prev[si].kg || 0)}×${prev[si].reps}` : '—'}</span>
        <input inputmode="decimal" aria-label="Carga da série ${si + 1}" placeholder="${prev[si]?.kg ?? 'kg'}" value="${esc(z.kg)}" data-chg="setVal" data-id="${ei}:${si}:kg">
        <input inputmode="numeric" aria-label="Repetições da série ${si + 1}" placeholder="${prev[si]?.reps ?? '0'}" value="${esc(z.reps)}" data-chg="setVal" data-id="${ei}:${si}:reps">
        <button class="sdone" data-act="feitoSerie" data-id="${ei}:${si}" aria-pressed="${z.done}" aria-label="Série ${si + 1} feita">${ic('check', 16)}</button></div>`).join('')}</div>
      <div class="row-between"><button class="link" data-act="maisSerie" data-id="${ei}">+ Série</button>${x.sets.length > 1 ? `<button class="link muted-l" data-act="menosSerie" data-id="${ei}">− Série</button>` : ''}</div></section>`; }).join('');
  return `<header class="top sess-top"><div><span class="eyebrow">${esc(s.name || 'Treino')}</span><h1 class="serif tick" data-since="${s.start}">${mmss(Date.now() - s.start)}</h1></div>
    <button class="btn" data-act="finalizarTreino">Finalizar</button></header>
    <div class="stats three sess-stats"><div><b class="serif">${s.ex.length}</b><span>exercícios</span></div><div><b class="serif">${feitas}</b><span>séries feitas</span></div><div><b class="serif">${fmt(vol)}</b><span>kg de volume</span></div></div>
    ${blocos || '<div class="card empty"><p class="muted">Adicione o primeiro exercício.</p></div>'}
    <button class="btn wide ghost" data-act="addExercicio">${ic('plus', 16)} Exercício</button>
    <button class="link danger-l" data-act="descartarTreino">Descartar treino</button>${restBar()}`;
};

function restBar() {
  if (!S.rest) return '';
  const left = S.rest.end - Date.now();
  return `<div class="restbar" role="timer"><span>Descanso</span><b class="rest-left">${mmss(left)}</b>
    <div class="bar rest"><i class="rest-fill" style="width:${clamp(left / S.rest.total, 0, 1) * 100}%"></i></div>
    <button class="btn-sm" data-act="descanso" data-id="-15">−15</button><button class="btn-sm" data-act="descanso" data-id="15">+15</button><button class="btn-sm" data-act="descanso" data-id="0">Pular</button></div>`;
}
/* chamado a cada segundo por 16-boot.js */
function tickRest() {
  if (!S.rest) return;
  const left = S.rest.end - Date.now(), el = $('.rest-left'), f = $('.rest-fill');
  if (el) el.textContent = mmss(left);
  if (f) f.style.width = clamp(left / S.rest.total, 0, 1) * 100 + '%';
  if (left <= 0) { S.rest = null; beep(); haptic([200, 100, 200]); toast('Descanso acabou. Próxima série!'); render(); }
}

function startSession(r) {
  const ex = (r?.ex || []).map((id) => { const p = lastSets(id); return { id, sets: (p.length ? p : [{}, {}, {}]).map((z) => blankSet(z)) }; });
  saveSess({ start: Date.now(), name: r?.name || 'Treino livre', routineId: r?.id || '', ex });
  S.page = 'sessao'; render(); scrollTo(0, 0); haptic(20);
}

function finishSession() {
  const s = sess(), end = Date.now(), ex = s.ex.map((x) => ({ id: x.id, sets: x.sets.filter((z) => z.done && +z.reps > 0).map((z) => ({ kg: +z.kg || 0, reps: +z.reps })) })).filter((x) => x.sets.length);
  if (!ex.length) { toast('Marque pelo menos uma série como feita'); return; }
  const prs = [];
  for (const x of ex) {
    const h = exHistory(x.id); if (!h.length) continue; // primeira vez não conta como recorde
    const best = Math.max(...h.map((p) => p.best)), maxKg = Math.max(...h.map((p) => p.maxKg));
    const nb = Math.max(...x.sets.map((z) => e1rm(z.kg, z.reps))), nk = Math.max(...x.sets.map((z) => z.kg));
    if (nk > maxKg) prs.push({ ex: x.id, kind: 'peso', val: nk }); else if (nb > best + 0.01) prs.push({ ex: x.id, kind: '1rm', val: Math.round(nb) });
  }
  const volume = ex.reduce((a, x) => a + x.sets.reduce((b, z) => b + z.kg * z.reps, 0), 0), min = Math.max(1, Math.round((end - s.start) / 60000));
  const id = uid(), xp = XP.treino + prs.length * XP.pr;
  store.set('workouts/' + id, { date: isoOf(new Date(s.start)), start: s.start, end, min, name: s.name, type: 'Musculação', routineId: s.routineId, ex, volume, prs });
  store.del('session/treino'); S.rest = null; S.page = 'treino'; render(); confetti();
  openModal('Treino concluído', `<div class="unlock"><div class="big-num serif">+${xp} XP</div>
    <div class="stats three"><div><b class="serif">${min}</b><span>minutos</span></div><div><b class="serif">${ex.reduce((a, x) => a + x.sets.length, 0)}</b><span>séries</span></div><div><b class="serif">${fmt(volume)}</b><span>kg de volume</span></div></div>
    ${prs.length ? `<span class="eyebrow red">Recordes pessoais</span>${prs.map((p) => `<div class="pr-row static">${ic('trophy', 18)}<span class="grow">${esc(exById(p.ex).n)}</span><b class="serif">${fmt(p.val)} kg</b></div>`).join('')}` : ''}
    <button class="btn wide" data-act="fechar">Fechar</button></div>`);
  checkFullDay();
}

/* escolher exercício: lista por grupo com busca */
function pickerHTML(selected = []) {
  return `<input class="ex-search" type="search" placeholder="Buscar exercício" data-inp="filtroEx" aria-label="Buscar exercício">
    <div class="ex-list">${GRUPOS.map((g) => `<div class="ex-g"><span class="eyebrow">${g}</span>${allExs().filter((e) => e.g === g).map((e) => `<label class="ex-item" data-n="${esc(e.n.toLowerCase())}">
      <input type="checkbox" name="ex" value="${e.id}" ${selected.includes(e.id) ? 'checked' : ''}><span>${esc(e.n)}</span></label>`).join('')}</div>`).join('')}</div>
    <details class="novo-ex"><summary class="link">Exercício que não está na lista</summary><div class="grid2"><label>Nome<input name="exNome"></label><label>Grupo<select name="exGrupo">${GRUPOS.map((g) => `<option>${g}</option>`).join('')}</select></label></div></details>`;
}
const pickedExs = (v, f) => {
  const ids = [...f.querySelectorAll('input[name=ex]:checked')].map((i) => i.value);
  if (v.exNome && v.exNome.trim()) { const id = 'c-' + uid(); store.set('exercises/' + id, { n: v.exNome.trim(), g: v.exGrupo }, true); ids.push(id); }
  return ids;
};

const FICHAS_SUG = [['Ficha A · Peito e tríceps', ['supino-reto', 'supino-inc-halter', 'crucifixo', 'triceps-pulley', 'triceps-testa', 'paralelas']],
  ['Ficha B · Costas e bíceps', ['puxada', 'remada-curvada', 'remada-baixa', 'rosca-direta', 'rosca-martelo', 'crucifixo-inverso']],
  ['Ficha C · Pernas e ombros', ['agachamento', 'leg-press', 'extensora', 'flexora', 'desenvolvimento', 'elev-lateral', 'pant-pe']]];

function formFicha(r = {}) {
  return `<form data-form="ficha" data-id="${r.id || ''}"><label>Nome da ficha<input name="name" required value="${esc(r.name || '')}" placeholder="Ex.: Ficha A · Peito"></label>
    ${pickerHTML(r.ex || [])}<div class="form-actions">${r.id ? `<button type="button" class="btn ghost danger" data-act="apagarFicha" data-id="${r.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}

/* atividade rápida (corrida, bike…) */
const TIPOS = ['Corrida', 'Caminhada', 'Bike', 'Funcional', 'Natação', 'Esporte', 'Alongamento', 'Musculação'];
function formTreino(w = {}) {
  return `<form data-form="treino" data-id="${w.id || ''}">
    <div class="grid2"><label>Data<input name="date" type="date" required value="${w.date || today()}" max="${today()}"></label>
    <label>Tipo<select name="type">${TIPOS.map((t) => `<option ${w.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
    <div class="grid2"><label>Duração (min)<input name="min" type="number" min="1" inputmode="numeric" value="${w.min || ''}"></label>
    <label>Esforço (1 a 5)<input name="effort" type="number" min="1" max="5" value="${w.effort || ''}"></label></div>
    <label>Observações<textarea name="notes" rows="3" placeholder="Ex.: 5 km em 28 min">${esc(w.notes || '')}</textarea></label>
    <div class="form-actions"><button class="btn">Salvar</button></div></form>`;
}

Object.assign(ACT, {
  iniciarTreino: (id) => { if (sess()) { S.page = 'sessao'; render(); return; } startSession(id ? { id, ...store.doc('routines/' + id) } : null); },
  finalizarTreino: () => finishSession(),
  descartarTreino: () => { if (confirm('Descartar este treino? Nada será salvo.')) { store.del('session/treino'); S.rest = null; S.page = 'treino'; render(); } },
  feitoSerie: (k) => {
    const [ei, si] = k.split(':').map(Number), s = sess(), z = s.ex[ei].sets[si];
    if (!z.done) { const p = lastSets(s.ex[ei].id)[si]; if (z.kg === '' && p) z.kg = p.kg; if (z.reps === '' && p) z.reps = p.reps; }
    if (!z.done && !(+z.reps > 0)) { toast('Preencha as repetições'); return; }
    z.done = !z.done; saveSess(s);
    if (z.done) { const t = cfg().rest; S.rest = { end: Date.now() + t * 1000, total: t * 1000 }; haptic(15); render(); }
  },
  maisSerie: (ei) => { const s = sess(), x = s.ex[ei], last = x.sets[x.sets.length - 1]; x.sets.push(blankSet(last)); saveSess(s); },
  menosSerie: (ei) => { const s = sess(); s.ex[ei].sets.pop(); saveSess(s); },
  tirarExercicio: (ei) => { const s = sess(); s.ex.splice(Number(ei), 1); saveSess(s); },
  addExercicio: () => openModal('Adicionar exercícios', `<form data-form="addEx">${pickerHTML()}<div class="form-actions"><button class="btn">Adicionar</button></div></form>`),
  descanso: (n) => { n = Number(n); if (!n || !S.rest) S.rest = null; else S.rest = { end: S.rest.end + n * 1000, total: S.rest.total + n * 1000 }; render(); },
  novaFicha: () => openModal('Nova ficha', formFicha()),
  editarFicha: (id) => openModal('Editar ficha', formFicha({ id, ...store.doc('routines/' + id) })),
  apagarFicha: (id) => { if (confirm('Apagar esta ficha? Os treinos feitos continuam.')) { store.del('routines/' + id); closeModal(); } },
  fichasSugeridas: () => { FICHAS_SUG.forEach(([name, ex], i) => store.set('routines/' + uid(), { name, ex, color: HCORES[i + 1] }, true)); render(); toast('Fichas criadas. Ajuste como quiser.'); },
  treinoRapido: () => openModal('Registrar atividade', formTreino()),
  editarTreino: (id) => openModal('Editar atividade', formTreino({ id, ...store.doc('workouts/' + id) })),
  apagarTreino: (id) => { if (confirm('Apagar este treino?')) { store.del('workouts/' + id); closeModal(); } },
});

CHG.setVal = (el) => { const [ei, si, f] = el.dataset.id.split(':'), s = sess(); s.ex[ei].sets[si][f] = el.value.replace(',', '.'); saveSess(s, true); };
CHG.filtroEx = (el) => { const q = el.value.trim().toLowerCase(); el.form.querySelectorAll('.ex-item').forEach((i) => { i.hidden = q && !i.dataset.n.includes(q); }); };

Object.assign(FORMS, {
  addEx: (v, f) => { const s = sess(), ids = pickedExs(v, f); ids.forEach((id) => { const p = lastSets(id); s.ex.push({ id, sets: (p.length ? p : [{}, {}, {}]).map((z) => blankSet(z)) }); }); closeModal(); saveSess(s); },
  ficha: (v, f) => { const ids = pickedExs(v, f); if (!ids.length) { toast('Escolha os exercícios'); return; } const id = f.dataset.id || uid();
    store.set('routines/' + id, { ...(store.doc('routines/' + id) || { color: HCORES[routines().length % HCORES.length] }), name: v.name.trim(), ex: ids }); closeModal(); },
  treino: (v, f) => {
    const id = f.dataset.id || uid(), novo = !f.dataset.id;
    store.set('workouts/' + id, { ...(store.doc('workouts/' + id) || {}), date: v.date, type: v.type, name: v.type, min: Number(v.min) || 0, effort: Number(v.effort) || 0, notes: v.notes.trim() });
    closeModal(); if (novo) { floatXP(`+${XP.treino} XP`); toast(`Atividade registrada · +${XP.treino} XP`); } checkFullDay();
  },
});
