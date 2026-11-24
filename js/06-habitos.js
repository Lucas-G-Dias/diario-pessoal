/* ============ Hábitos: marcar, contagem, força, % de cumprimento, pausar e retomar ============ */
function habitStreak(h) {
  let d = today(), n = 0, guard = 0;
  if (habitDueOn(h, d) && !hDone(h, habitsDone(d))) d = addDays(d, -1); // hoje ainda está em aberto
  while (guard++ < 800) {
    if (h.created && d < h.created) break;
    if (!habitDueOn(h, d)) { d = addDays(d, -1); continue; }
    if (!hDone(h, habitsDone(d))) break;
    n++; d = addDays(d, -1);
  }
  return n;
}

/* força do hábito (como no Loop): sobe com cada dia feito e cai aos poucos quando falha; não zera de uma vez */
function habitStrength(h) {
  let s = 0; const start = h.created || addDays(today(), -60), a = 0.08;
  for (let d = start, g = 0; d < today() && g < 800; d = addDays(d, 1), g++) if (habitDueOn(h, d)) s = s * (1 - a) + (hDone(h, habitsDone(d)) ? a : 0);
  if (hDone(h, habitsDone(today()))) s = s * (1 - a) + a;
  return s;
}
const pctTxt = (r) => (r ? Math.round(r.pct * 100) + '%' : '—');

function habitResumo() {
  const due = activeHabits().filter((h) => habitDueOn(h, today())), log = habitsDone(today());
  const feitos = due.filter((h) => hDone(h, log)).length;
  const sem = habitRate(habits(), lastDays(7)), mes = habitRate(habits(), pastDays(periodOf('mes')));
  return `<section class="card resumo">${ring(due.length ? feitos / due.length : 0, 'var(--green)', 76, `<b class="serif">${feitos}/${due.length}</b><small>hoje</small>`)}
    <div class="stats two"><div><b class="serif">${pctTxt(sem)}</b><span>últimos 7 dias</span></div><div><b class="serif">${pctTxt(mes)}</b><span>em ${MESES_L[new Date().getMonth()]}</span></div></div></section>`;
}

function habitCard(h, i) {
  const log = habitsDone(today()), due = habitDueOn(h, today()), t = h.target || 1, v = hVal(h, log), ok = v >= t;
  const s = habitStreak(h), forca = habitStrength(h), mes = habitRate([h], pastDays(periodOf('mes'))), cor = h.color || 'var(--green)';
  const grade = lastDays(28).map((d) => `<i class="${hDone(h, habitsDone(d)) ? 'on' : habitDueOn(h, d) ? '' : 'off'} ${d === today() ? 'today' : ''}" title="${shortDate(d)}"></i>`).join('');
  const btn = t > 1
    ? `<button class="hcount ${ok ? 'on' : ''}" data-act="marcarHabito" data-id="${h.id}" ${due ? '' : 'disabled'} aria-label="Somar 1 em ${esc(h.name)}: ${v} de ${t}">${ring(v / t, cor, 46, ok ? ic('check', 18) : `<b>${v}</b>`)}</button>`
    : `<button class="hcheck ${ok ? 'on' : ''}" data-act="marcarHabito" data-id="${h.id}" ${due ? '' : 'disabled'} aria-pressed="${ok}" aria-label="${ok ? 'Desmarcar' : 'Marcar'} ${esc(h.name)} hoje">${ok ? ic('check', 20) : ''}</button>`;
  return `<section class="card habit" style="--hc:${cor};--i:${i}">
    <div class="row-between">${btn}
    <div class="grow"><strong class="serif lg">${esc(h.name)}</strong><span class="tiny muted">${diasTexto(h.days)}${t > 1 ? ` · ${t}× ao dia` : ''}${h.time ? ' · ' + h.time : ''}${due ? '' : ' · folga hoje'}</span></div>
    <div class="hnums"><span class="hstreak" title="Sequência">${ic('flame', 15)}<b>${s}</b></span><span class="tiny muted">${pctTxt(mes)} no mês</span></div>
    <button class="icon-btn" data-act="editarHabito" data-id="${h.id}" aria-label="Editar hábito ${esc(h.name)}">${ic('edit', 18)}</button></div>
    <div class="hgrid" aria-hidden="true">${grade}</div>
    <div class="forca"><span class="tiny muted">Força do hábito</span>${progressBar(forca, 'habit')}<b class="tiny">${Math.round(forca * 100)}%</b></div></section>`;
}

VIEWS.habitos = () => {
  const ativos = activeHabits(), pausados = habits().filter((h) => h.paused);
  const vazio = `<div class="card empty"><em class="serif lg">Nenhum hábito ativo.</em><p class="muted">Toque para adicionar:</p>
    <div class="hab-chips center">${SUGESTOES.map((s, i) => `<button class="chip" data-act="sugestaoHabito" data-id="${i}">${ic('plus', 14)}${esc(s[0])}</button>`).join('')}</div></div>`;
  return `<header class="top"><h1 class="serif">Hábitos</h1><button class="btn-sm" data-act="novoHabito">${ic('plus', 16)} Hábito</button></header>
    ${ativos.length ? habitResumo() + ativos.map(habitCard).join('') : vazio}
    ${pausados.length ? `<h3 class="eyebrow sec">Pausados · ${pausados.length}</h3><section class="card list">${pausados.map((h) => `<div class="w-row"><div class="grow"><strong>${esc(h.name)}</strong>
      <span class="tiny muted">pausado desde ${shortDate(h.pauses[h.pauses.length - 1].from)} · o histórico continua guardado</span></div>
      <button class="btn-sm" data-act="retomarHabito" data-id="${h.id}">Retomar</button>
      <button class="icon-btn" data-act="editarHabito" data-id="${h.id}" aria-label="Editar hábito ${esc(h.name)}">${ic('edit', 18)}</button></div>`).join('')}</section>` : ''}`;
};

const SUGESTOES = [['Beber água', [], '10:00', 8], ['Meditar 10 min', [], '07:00'], ['Sem celular na cama', [], '22:30'], ['Orar', [], '06:30'], ['Dormir antes das 23h', [], '22:45'], ['Estudar 30 min', [1, 2, 3, 4, 5], '19:00'], ['Alongar', [], '07:30'], ['Sem açúcar', [], '']];
const diasTexto = (days) => !days || !days.length || days.length === 7 ? 'todo dia' : days.length === 5 && !days.includes(0) && !days.includes(6) ? 'dias úteis' : days.map((d) => DIAS[d].slice(0, 3)).join(', ');

function formHabito(h = {}) {
  const days = h.days && h.days.length ? h.days : [0, 1, 2, 3, 4, 5, 6], cor = h.color || HCORES[habits().length % HCORES.length];
  const acoes = !h.id ? '' : h.paused ? `<button type="button" class="btn ghost" data-act="retomarHabito" data-id="${h.id}">Retomar</button>`
    : `<button type="button" class="btn ghost" data-act="pausarHabito" data-id="${h.id}">Pausar</button>`;
  return `<form data-form="habito" data-id="${h.id || ''}">
    <label>Nome do hábito<input name="name" required value="${esc(h.name)}" placeholder="Ex.: Beber água" autocomplete="off"></label>
    <fieldset><legend>Em quais dias</legend><div class="days">${DIAS.map((d, i) => `<label class="day"><input type="checkbox" name="d${i}" ${days.includes(i) ? 'checked' : ''}><span>${d.slice(0, 3)}</span></label>`).join('')}</div></fieldset>
    <div class="grid2"><label>Vezes por dia<input name="target" type="number" min="1" max="50" inputmode="numeric" value="${h.target || 1}"></label>
    <label>Lembrete<input name="time" type="time" value="${esc(h.time || '')}"></label></div>
    <fieldset><legend>Cor</legend><div class="swatches">${HCORES.map((c, i) => `<label class="swatch round" style="--c:${c}"><input type="radio" name="color" value="${c}" ${cor === c ? 'checked' : ''} aria-label="Cor ${i + 1}"></label>`).join('')}</div></fieldset>
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
  sugestaoHabito: (i) => { const [name, days, time, target] = SUGESTOES[i]; store.set('habits/' + uid(), { name, days, time, target: target || 1, color: HCORES[habits().length % HCORES.length], created: today() }); toast('Hábito criado'); },
  /* simples: liga/desliga; com contagem: +1 até o alvo, depois volta a 0 */
  marcarHabito: (id) => {
    const h = { id, ...store.doc('habits/' + id) }, p = 'habitlog/' + today(), cur = store.doc(p) || { ids: {} }, t = h.target || 1;
    const v = hVal(h, cur.ids), nv = t > 1 ? (v >= t ? 0 : v + 1) : (v ? 0 : 1), done = nv >= t;
    store.set(p, { ...cur, ids: { ...cur.ids, [id]: t > 1 ? nv : !!nv } });
    if (done) { floatXP(`+${XP.habito} XP`); checkFullDay(); } else if (nv) haptic(8);
  },
});

FORMS.habito = (v, f) => {
  const id = f.dataset.id || uid(), days = DIAS.map((_, i) => (v['d' + i] ? i : -1)).filter((i) => i >= 0);
  if (!days.length) { toast('Escolha pelo menos um dia'); return; }
  store.set('habits/' + id, { ...(store.doc('habits/' + id) || { created: today() }), name: v.name.trim(), days: days.length === 7 ? [] : days, time: v.time || '', target: clamp(Number(v.target) || 1, 1, 50), color: v.color || HCORES[0] });
  closeModal();
};
