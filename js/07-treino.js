/* ============ Treino: registro, semana, histórico ============ */
const TIPOS = ['Musculação', 'Corrida', 'Caminhada', 'Bike', 'Funcional', 'Natação', 'Esporte', 'Alongamento'];

VIEWS.treino = () => {
  const ws = workouts(), c = cfg(), sem = lastDays(7), mes = today().slice(0, 7);
  const nSem = ws.filter((w) => sem.includes(w.date)).length, nMes = ws.filter((w) => w.date.startsWith(mes)).length;
  const minMes = ws.filter((w) => w.date.startsWith(mes)).reduce((a, w) => a + (Number(w.min) || 0), 0);
  const item = (w) => `<div class="w-row"><div class="w-date serif"><b>${new Date(w.date + 'T12:00').getDate()}</b><span>${MESES[Number(w.date.slice(5, 7)) - 1]}</span></div>
    <div class="grow"><strong>${esc(w.type)}</strong><span class="tiny muted">${w.min ? w.min + ' min' : ''}${w.effort ? ' · esforço ' + w.effort + '/5' : ''}</span>${w.notes ? `<p class="w-notes">${esc(w.notes)}</p>` : ''}</div>
    <button class="icon-btn" data-act="editarTreino" data-id="${w.id}" aria-label="Editar treino de ${shortDate(w.date)}">${ic('edit', 18)}</button></div>`;
  return `<header class="top"><h1 class="serif">Treino</h1><button class="btn-sm" data-act="novoTreino">${ic('plus', 16)} Treino</button></header>
    <section class="card"><div class="stats three"><div><b class="serif">${nSem}/${c.goalWorkouts}</b><span>nesta semana</span></div><div><b class="serif">${nMes}</b><span>no mês</span></div><div><b class="serif">${fmt(minMes)}</b><span>minutos no mês</span></div></div>
      <div class="week">${sem.map((d) => `<div class="wd ${ws.some((w) => w.date === d) ? 'on' : ''} ${d === today() ? 'today' : ''}"><span>${DIAS_C[dow(d)]}</span><i></i></div>`).join('')}</div></section>
    ${ws.length ? `<h3 class="eyebrow sec">Histórico</h3><section class="card list">${ws.slice(0, 40).map(item).join('')}</section>`
    : '<div class="card empty"><em class="serif lg">Nenhum treino registrado.</em><p class="muted">Registre o treino logo depois de terminar: tipo, tempo e o que fez.</p></div>'}`;
};

function formTreino(w = {}) {
  const tipos = TIPOS.map((t) => `<option ${w.type === t ? 'selected' : ''}>${t}</option>`).join('');
  return `<form data-form="treino" data-id="${w.id || ''}">
    <div class="grid2"><label>Data<input name="date" type="date" required value="${w.date || today()}" max="${today()}"></label>
    <label>Tipo<select name="type">${tipos}</select></label></div>
    <div class="grid2"><label>Duração (min)<input name="min" type="number" min="1" inputmode="numeric" value="${w.min || ''}"></label>
    <label>Esforço (1 a 5)<input name="effort" type="number" min="1" max="5" value="${w.effort || ''}"></label></div>
    <label>O que fez<textarea name="notes" rows="4" placeholder="Supino 4×10 60 kg&#10;Remada 4×12 40 kg">${esc(w.notes || '')}</textarea></label>
    <div class="form-actions">${w.id ? `<button type="button" class="btn ghost danger" data-act="apagarTreino" data-id="${w.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}

Object.assign(ACT, {
  novoTreino: () => openModal('Registrar treino', formTreino()),
  editarTreino: (id) => openModal('Editar treino', formTreino({ id, ...store.doc('workouts/' + id) })),
  apagarTreino: (id) => { if (confirm('Apagar este treino?')) { store.del('workouts/' + id); closeModal(); } },
});

FORMS.treino = (v, f) => {
  const id = f.dataset.id || uid(), novo = !f.dataset.id;
  store.set('workouts/' + id, { date: v.date, type: v.type, min: Number(v.min) || 0, effort: Number(v.effort) || 0, notes: v.notes.trim() });
  closeModal(); if (novo) toast(`Treino registrado · +${XP.treino} XP`);
  checkFullDay();
};
