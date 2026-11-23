/* ============ Hábitos: marcar o dia, % de cumprimento, pausar e retomar ============ */
function habitStreak(h) {
  let d = today(), n = 0, guard = 0;
  if (habitDueOn(h, d) && !habitsDone(d)[h.id]) d = addDays(d, -1); // hoje ainda está em aberto
  while (guard++ < 400) {
    if (h.created && d < h.created) break;
    if (!habitDueOn(h, d)) { d = addDays(d, -1); continue; }
    if (!habitsDone(d)[h.id]) break;
    n++; d = addDays(d, -1);
  }
  return n;
}
const pctTxt = (r) => (r ? Math.round(r.pct * 100) + '%' : '—');

function habitResumo() {
  const hs = activeHabits(), due = hs.filter((h) => habitDueOn(h, today())), done = habitsDone(today());
  const feitos = due.filter((h) => done[h.id]).length;
  const sem = habitRate(habits(), lastDays(7)), mes = habitRate(habits(), pastDays(periodOf('mes')));
  return `<section class="card"><div class="stats three">
    <div><b class="serif">${feitos}/${due.length}</b><span>hoje</span></div>
    <div><b class="serif">${pctTxt(sem)}</b><span>últimos 7 dias</span></div>
    <div><b class="serif">${pctTxt(mes)}</b><span>em ${MESES_L[new Date().getMonth()]}</span></div></div>
    ${progressBar(due.length ? feitos / due.length : 0, 'green')}</section>`;
}

function habitCard(h) {
  const done = habitsDone(today()), due = habitDueOn(h, today()), s = habitStreak(h), dias = lastDays(28);
  const mes = habitRate([h], pastDays(periodOf('mes')));
  const grade = dias.map((d) => `<i class="${habitsDone(d)[h.id] ? 'on' : habitDueOn(h, d) ? '' : 'off'} ${d === today() ? 'today' : ''}" title="${shortDate(d)}"></i>`).join('');
  return `<section class="card habit">
    <div class="row-between"><button class="hcheck ${done[h.id] ? 'on' : ''}" data-act="marcarHabito" data-id="${h.id}" ${due ? '' : 'disabled'} aria-pressed="${!!done[h.id]}" aria-label="${done[h.id] ? 'Desmarcar' : 'Marcar'} ${esc(h.name)} hoje">${done[h.id] ? ic('check', 20) : ''}</button>
    <div class="grow"><strong class="serif lg">${esc(h.name)}</strong><span class="tiny muted">${diasTexto(h.days)}${h.time ? ' · ' + h.time : ''}${due ? '' : ' · hoje é folga'}</span></div>
    <div class="hnums"><span class="hstreak" title="Sequência">${ic('flame', 15)}<b>${s}</b></span><span class="tiny muted">${pctTxt(mes)} no mês</span></div>
    <button class="icon-btn" data-act="editarHabito" data-id="${h.id}" aria-label="Editar hábito ${esc(h.name)}">${ic('edit', 18)}</button></div>
    <div class="hgrid" aria-hidden="true">${grade}</div></section>`;
}

VIEWS.habitos = () => {
  const ativos = activeHabits(), pausados = habits().filter((h) => h.paused);
  const vazio = `<div class="card empty"><em class="serif lg">Nenhum hábito ativo.</em><p class="muted">Toque para adicionar:</p>
    <div class="hab-chips">${SUGESTOES.map((s, i) => `<button class="chip" data-act="sugestaoHabito" data-id="${i}">${ic('plus', 14)}${esc(s[0])}</button>`).join('')}</div></div>`;
  return `<header class="top"><h1 class="serif">Hábitos</h1><button class="btn-sm" data-act="novoHabito">${ic('plus', 16)} Hábito</button></header>
    ${ativos.length ? habitResumo() + ativos.map(habitCard).join('') : vazio}
    ${pausados.length ? `<h3 class="eyebrow sec">Pausados · ${pausados.length}</h3><section class="card list">${pausados.map((h) => `<div class="w-row"><div class="grow"><strong>${esc(h.name)}</strong>
      <span class="tiny muted">pausado desde ${shortDate(h.pauses[h.pauses.length - 1].from)} · o histórico continua guardado</span></div>
      <button class="btn-sm" data-act="retomarHabito" data-id="${h.id}">Retomar</button>
      <button class="icon-btn" data-act="editarHabito" data-id="${h.id}" aria-label="Editar hábito ${esc(h.name)}">${ic('edit', 18)}</button></div>`).join('')}</section>` : ''}`;
};

const SUGESTOES = [['Beber 2 L de água', [], '10:00'], ['Meditar 10 min', [], '07:00'], ['Sem celular na cama', [], '22:30'], ['Orar / devocional', [], '06:30'], ['Dormir antes das 23h', [], '22:45'], ['Estudar 30 min', [1, 2, 3, 4, 5], '19:00']];
const diasTexto = (days) => !days || !days.length || days.length === 7 ? 'todo dia' : days.length === 5 && !days.includes(0) && !days.includes(6) ? 'dias úteis' : days.map((d) => DIAS[d].slice(0, 3)).join(', ');

function formHabito(h = {}) {
  const days = h.days && h.days.length ? h.days : [0, 1, 2, 3, 4, 5, 6];
  const acoes = !h.id ? '' : h.paused
    ? `<button type="button" class="btn ghost" data-act="retomarHabito" data-id="${h.id}">Retomar</button>`
    : `<button type="button" class="btn ghost" data-act="pausarHabito" data-id="${h.id}">Pausar</button>`;
  return `<form data-form="habito" data-id="${h.id || ''}">
    <label>Nome do hábito<input name="name" required value="${esc(h.name)}" placeholder="Ex.: Beber 2 L de água" autocomplete="off"></label>
    <fieldset><legend>Em quais dias</legend><div class="days">${DIAS.map((d, i) => `<label class="day"><input type="checkbox" name="d${i}" ${days.includes(i) ? 'checked' : ''}><span>${d.slice(0, 3)}</span></label>`).join('')}</div></fieldset>
    <label>Lembrete (opcional)<input name="time" type="time" value="${esc(h.time || '')}"></label>
    ${h.id ? '<p class="tiny muted">Pausar tira o hábito do dia a dia sem perder o histórico nem baixar sua porcentagem. Apagar remove de vez.</p>' : ''}
    <div class="form-actions">${h.id ? `<button type="button" class="btn ghost danger" data-act="apagarHabito" data-id="${h.id}">${ic('trash', 16)} Apagar</button>` : ''}${acoes}<button class="btn">Salvar</button></div></form>`;
}

Object.assign(ACT, {
  novoHabito: () => openModal('Novo hábito', formHabito()),
  editarHabito: (id) => openModal('Editar hábito', formHabito({ id, ...store.doc('habits/' + id) })),
  apagarHabito: (id) => { if (confirm('Apagar este hábito de vez? Se só quer parar por um tempo, use Pausar.')) { store.del('habits/' + id); closeModal(); } },
  pausarHabito: (id) => { const h = store.doc('habits/' + id); store.set('habits/' + id, { ...h, paused: true, pauses: [...(h.pauses || []), { from: today() }] }); closeModal(); toast('Hábito pausado'); },
  retomarHabito: (id) => {
    const h = store.doc('habits/' + id), ps = [...(h.pauses || [])], last = ps[ps.length - 1];
    if (last && !last.to) ps[ps.length - 1] = { ...last, to: today() };
    store.set('habits/' + id, { ...h, paused: false, pauses: ps }); closeModal(); toast('Hábito de volta');
  },
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
