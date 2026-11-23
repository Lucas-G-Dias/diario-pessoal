/* ============ Hábitos: lista, marcação do dia, grade de 4 semanas ============ */
function habitStreak(h) {
  let d = today(), n = 0, guard = 0;
  if (habitDueOn(h, d) && !habitsDone(d)[h.id]) d = addDays(d, -1); // hoje ainda está em aberto
  while (guard++ < 400) {
    if (!habitDueOn(h, d)) { d = addDays(d, -1); continue; }
    if (!habitsDone(d)[h.id]) break;
    n++; d = addDays(d, -1);
  }
  return n;
}

VIEWS.habitos = () => {
  const hs = habits(), dias = lastDays(28), done = habitsDone(today());
  const linha = (h) => {
    const due = habitDueOn(h, today()), s = habitStreak(h);
    const grade = dias.map((d) => `<i class="${habitsDone(d)[h.id] ? 'on' : habitDueOn(h, d) ? '' : 'off'} ${d === today() ? 'today' : ''}" title="${shortDate(d)}"></i>`).join('');
    return `<section class="card habit">
      <div class="row-between"><button class="hcheck ${done[h.id] ? 'on' : ''}" data-act="marcarHabito" data-id="${h.id}" ${due ? '' : 'disabled'} aria-pressed="${!!done[h.id]}" aria-label="${done[h.id] ? 'Desmarcar' : 'Marcar'} ${esc(h.name)} hoje">${done[h.id] ? ic('check', 20) : ''}</button>
      <div class="grow"><strong class="serif lg">${esc(h.name)}</strong><span class="tiny muted">${diasTexto(h.days)}${h.time ? ' · lembrete às ' + h.time : ''}${due ? '' : ' · hoje é folga'}</span></div>
      <div class="hstreak" aria-label="Sequência de ${s} dias">${ic('flame', 16)}<b>${s}</b></div>
      <button class="icon-btn" data-act="editarHabito" data-id="${h.id}" aria-label="Editar hábito ${esc(h.name)}">${ic('edit', 18)}</button></div>
      <div class="hgrid" aria-hidden="true">${grade}</div></section>`;
  };
  return `<header class="top"><h1 class="serif">Hábitos</h1><button class="btn-sm" data-act="novoHabito">${ic('plus', 16)} Hábito</button></header>
    ${hs.length ? hs.map(linha).join('') : `<div class="card empty"><em class="serif lg">Nenhum hábito ainda.</em><p class="muted">Sugestões para começar:</p>
      <div class="hab-chips">${SUGESTOES.map((s, i) => `<button class="chip" data-act="sugestaoHabito" data-id="${i}">${ic('plus', 14)}${esc(s[0])}</button>`).join('')}</div></div>`}`;
};

const SUGESTOES = [['Beber 2 L de água', [], '10:00'], ['Meditar 10 min', [], '07:00'], ['Sem celular na cama', [], '22:30'], ['Orar / devocional', [], '06:30'], ['Dormir antes das 23h', [], '22:45'], ['Estudar 30 min', [1, 2, 3, 4, 5], '19:00']];
const diasTexto = (days) => !days || !days.length || days.length === 7 ? 'todo dia' : days.length === 5 && !days.includes(0) && !days.includes(6) ? 'dias úteis' : days.map((d) => DIAS[d].slice(0, 3)).join(', ');

function formHabito(h = {}) {
  const days = h.days && h.days.length ? h.days : [0, 1, 2, 3, 4, 5, 6];
  return `<form data-form="habito" data-id="${h.id || ''}">
    <label>Nome do hábito<input name="name" required value="${esc(h.name)}" placeholder="Ex.: Beber 2 L de água" autocomplete="off"></label>
    <fieldset><legend>Em quais dias</legend><div class="days">${DIAS.map((d, i) => `<label class="day"><input type="checkbox" name="d${i}" ${days.includes(i) ? 'checked' : ''}><span>${d.slice(0, 3)}</span></label>`).join('')}</div></fieldset>
    <label>Lembrete (opcional)<input name="time" type="time" value="${esc(h.time || '')}"></label>
    <div class="form-actions">${h.id ? `<button type="button" class="btn ghost danger" data-act="apagarHabito" data-id="${h.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}

Object.assign(ACT, {
  novoHabito: () => openModal('Novo hábito', formHabito()),
  editarHabito: (id) => openModal('Editar hábito', formHabito({ id, ...store.doc('habits/' + id) })),
  apagarHabito: (id) => { if (confirm('Apagar este hábito? O histórico de XP continua.')) { store.del('habits/' + id); closeModal(); } },
  sugestaoHabito: (i) => { const [name, days, time] = SUGESTOES[i]; store.set('habits/' + uid(), { name, days, time, created: today() }); toast('Hábito criado'); },
  marcarHabito: (id) => {
    const p = 'habitlog/' + today(), cur = store.doc(p) || { ids: {} }, on = !cur.ids[id];
    store.set(p, { ...cur, ids: { ...cur.ids, [id]: on } });
    if (on) { toast(`+${XP.habito} XP`); checkFullDay(); }
  },
});

FORMS.habito = (v, f) => {
  const id = f.dataset.id || uid(), days = DIAS.map((_, i) => (v['d' + i] ? i : -1)).filter((i) => i >= 0);
  if (!days.length) { toast('Escolha pelo menos um dia'); return; }
  store.set('habits/' + id, { ...(store.doc('habits/' + id) || { created: today() }), name: v.name.trim(), days: days.length === 7 ? [] : days, time: v.time || '' });
  closeModal();
};
