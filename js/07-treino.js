/* ============ Treino: biblioteca de exercícios, recordes, estatísticas e histórico ============ */
const GRUPOS = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Panturrilha', 'Abdômen'];
const EXS = [
  ['supino-reto', 'Supino reto (barra)', 0], ['supino-inclinado', 'Supino inclinado (barra)', 0], ['supino-halter', 'Supino reto (halteres)', 0], ['supino-inc-halter', 'Supino inclinado (halteres)', 0],
  ['crucifixo', 'Crucifixo', 0], ['crossover', 'Crossover', 0], ['peck-deck', 'Peck deck', 0], ['flexao', 'Flexão de braço', 0], ['paralelas', 'Paralelas', 0],
  ['barra-fixa', 'Barra fixa', 1], ['puxada', 'Puxada frontal', 1], ['remada-curvada', 'Remada curvada', 1], ['remada-baixa', 'Remada baixa', 1], ['remada-unilateral', 'Remada unilateral', 1],
  ['terra', 'Levantamento terra', 1], ['pulldown', 'Pulldown braços estendidos', 1],
  ['desenvolvimento', 'Desenvolvimento (barra)', 2], ['desenv-halter', 'Desenvolvimento (halteres)', 2], ['elev-lateral', 'Elevação lateral', 2], ['elev-frontal', 'Elevação frontal', 2],
  ['crucifixo-inverso', 'Crucifixo inverso', 2], ['encolhimento', 'Encolhimento', 2],
  ['rosca-direta', 'Rosca direta', 3], ['rosca-alternada', 'Rosca alternada', 3], ['rosca-martelo', 'Rosca martelo', 3], ['rosca-scott', 'Rosca Scott', 3],
  ['triceps-pulley', 'Tríceps pulley', 4], ['triceps-testa', 'Tríceps testa', 4], ['triceps-frances', 'Tríceps francês', 4], ['mergulho-banco', 'Mergulho no banco', 4],
  ['agachamento', 'Agachamento livre', 5], ['leg-press', 'Leg press', 5], ['hack', 'Agachamento hack', 5], ['extensora', 'Cadeira extensora', 5], ['flexora', 'Mesa flexora', 5],
  ['stiff', 'Stiff', 5], ['afundo', 'Afundo', 5], ['bulgaro', 'Agachamento búlgaro', 5],
  ['elev-pelvica', 'Elevação pélvica', 6], ['abdutora', 'Cadeira abdutora', 6], ['gluteo-cabo', 'Glúteo no cabo', 6],
  ['pant-pe', 'Panturrilha em pé', 7], ['pant-sentado', 'Panturrilha sentado', 7],
  ['abdominal', 'Abdominal', 8], ['prancha', 'Prancha (segundos)', 8], ['elev-pernas', 'Elevação de pernas', 8], ['abd-cabo', 'Abdominal no cabo', 8],
].map(([id, n, g]) => ({ id, n, g: GRUPOS[g] }));
const allExs = () => [...EXS, ...store.col('exercises')];
const exById = (id) => allExs().find((e) => e.id === id) || { id, n: id, g: '' };
const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? kg * (1 + Math.min(reps, 15) / 30) : 0); // fórmula de Epley
const doneSets = (x) => (x.sets || []).filter((s) => s.done !== false && Number(s.reps) > 0 && !s.w);

/* histórico de um exercício: melhor série de cada treino, do mais antigo ao mais novo */
function exHistory(exId) {
  return workouts().filter((w) => (w.ex || []).some((x) => x.id === exId)).reverse().map((w) => {
    const sets = doneSets(w.ex.find((x) => x.id === exId));
    return { date: w.date, wid: w.id, sets, best: Math.max(0, ...sets.map((s) => e1rm(+s.kg, +s.reps))), maxKg: Math.max(0, ...sets.map((s) => +s.kg || 0)), vol: sets.reduce((a, s) => a + (+s.kg || 0) * (+s.reps || 0), 0) };
  });
}
const lastSets = (exId) => { const w = workouts().find((x) => (x.ex || []).some((e) => e.id === exId)); return w ? doneSets(w.ex.find((e) => e.id === exId)) : []; };

/* séries por grupo muscular nos últimos 7 dias */
function setsByGroup() {
  const dias = lastDays(7), out = Object.fromEntries(GRUPOS.map((g) => [g, 0]));
  workouts().filter((w) => dias.includes(w.date)).forEach((w) => (w.ex || []).forEach((x) => { const g = exById(x.id).g; if (g) out[g] += doneSets(x).length; }));
  return out;
}

function treinoStats() {
  const ws = workouts(), c = cfg(), sem = lastDays(7), semW = ws.filter((w) => sem.includes(w.date)), mes = today().slice(0, 7);
  const vol = semW.reduce((a, w) => a + (w.volume || 0), 0);
  return `<section class="card"><div class="stats three"><div><b class="serif">${semW.length}/${c.goalWorkouts}</b><span>nesta semana</span></div>
    <div><b class="serif">${ws.filter((w) => w.date.startsWith(mes)).length}</b><span>no mês</span></div><div><b class="serif">${fmt(vol / 1000)} t</b><span>volume na semana</span></div></div>
    <div class="week">${sem.map((d) => `<div class="wd ${ws.some((w) => w.date === d) ? 'on' : ''} ${d === today() ? 'today' : ''}"><span>${DIAS_C[dow(d)]}</span><i></i></div>`).join('')}</div></section>`;
}

function musculosCard() {
  const sg = setsByGroup(), max = Math.max(10, ...Object.values(sg));
  if (!Object.values(sg).some(Boolean)) return '';
  return `<section class="card"><span class="eyebrow">Séries por músculo · 7 dias</span><p class="tiny muted">De 10 a 20 séries por semana costuma ser uma boa faixa para crescer.</p>
    ${GRUPOS.filter((g) => sg[g]).map((g) => `<div class="hrate"><span>${g}</span><b>${sg[g]}</b><span></span>${progressBar(sg[g] / max, sg[g] >= 10 ? 'green' : '')}</div>`).join('')}</section>`;
}

function recordesCard() {
  const prs = workouts().flatMap((w) => (w.prs || []).map((p) => ({ ...p, date: w.date }))).slice(0, 5);
  if (!prs.length) return '';
  return `<section class="card"><div class="row-between"><span class="eyebrow">Recordes recentes</span><button class="link" data-act="verExercicios">Exercícios</button></div>
    ${prs.map((p) => `<button class="pr-row" data-act="verExercicio" data-id="${p.ex}">${ic('trophy', 18)}<span class="grow">${esc(exById(p.ex).n)}<span class="tiny muted">${shortDate(p.date)} · ${p.kind === 'peso' ? 'maior carga' : '1RM estimado'}</span></span><b class="serif">${fmt(p.val)} kg</b></button>`).join('')}</section>`;
}

function workoutRow(w) {
  const sub = w.ex?.length ? `${w.ex.length} exercícios · ${fmt((w.volume || 0))} kg` : `${w.min ? w.min + ' min' : ''}${w.effort ? ' · esforço ' + w.effort + '/5' : ''}`;
  return `<button class="w-row" data-act="verTreino" data-id="${w.id}"><div class="w-date serif"><b>${Number(w.date.slice(8))}</b><span>${MESES[Number(w.date.slice(5, 7)) - 1]}</span></div>
    <div class="grow"><strong>${esc(w.name || w.type)}</strong><span class="tiny muted">${sub}${w.min && w.ex?.length ? ' · ' + w.min + ' min' : ''}</span></div>
    ${(w.prs || []).length ? `<span class="tag ok">${ic('trophy', 13)} ${w.prs.length}</span>` : ''}${ic('chev', 16)}</button>`;
}

VIEWS.treino = () => {
  const ws = workouts(), rs = routines(), sess = store.doc('session/treino');
  return `<header class="top"><h1 class="serif">Treino</h1><button class="btn-sm" data-act="treinoRapido">${ic('plus', 16)} Atividade</button></header>
    ${sess ? `<button class="live big-live" data-page="sessao">${ic('gym', 20)}<span>Continuar treino</span><b class="tick" data-since="${sess.start}">${mmss(Date.now() - sess.start)}</b>${ic('chev', 16)}</button>`
    : `<button class="btn wide start" data-act="iniciarTreino">${ic('play', 18)} Começar treino vazio</button>`}
    <div class="row-between sec"><h3 class="eyebrow">Fichas</h3><button class="link" data-act="novaFicha">+ Ficha</button></div>
    ${rs.length ? `<div class="fichas" data-sort="routines">${rs.map((r) => `<div class="ficha" data-sid="${r.id}" style="--hc:${r.color || 'var(--red)'}">${dragHandle(r.name)}<strong class="serif">${esc(r.name)}</strong>
      <span class="tiny muted">${r.ex.slice(0, 4).map((e) => esc(exById(e).n)).join(' · ')}${r.ex.length > 4 ? ` +${r.ex.length - 4}` : ''}</span>
      <div class="ficha-btns"><button class="btn-sm" data-act="iniciarTreino" data-id="${r.id}" ${sess ? 'disabled' : ''}>${ic('play', 13)} Iniciar</button>
      <button class="icon-btn" data-act="editarFicha" data-id="${r.id}" aria-label="Editar ficha ${esc(r.name)}">${ic('edit', 16)}</button></div></div>`).join('')}</div>`
    : `<div class="card empty"><p class="muted">Monte suas fichas uma vez e comece o treino com um toque.</p><button class="btn ghost" data-act="fichasSugeridas">Criar fichas A, B e C sugeridas</button></div>`}
    ${treinoStats()}${recordesCard()}${musculosCard()}
    <section class="card"><span class="eyebrow">Treinos por mês</span>${monthBars('Treinos', (x) => x.treinos)}</section>
    ${ws.length ? `<h3 class="eyebrow sec">Histórico</h3><section class="card list">${ws.slice(0, 12).map(workoutRow).join('')}</section>` : ''}`;
};

/* detalhe de um treino feito */
ACT.verTreino = (id) => {
  const w = { id, ...store.doc('workouts/' + id) };
  const ex = (w.ex || []).map((x) => `<div class="tw-ex"><strong>${esc(exById(x.id).n)}</strong>${(w.prs || []).some((p) => p.ex === x.id) ? ` <span class="tag ok">${ic('trophy', 12)} recorde</span>` : ''}
    <div class="tw-sets">${doneSets(x).map((s, i) => `<span><i>${i + 1}</i>${fmt(s.kg || 0)} kg × ${s.reps}</span>`).join('')}</div></div>`).join('');
  openModal(w.name || w.type, `<p class="muted">${longDate(w.date)}${w.min ? ' · ' + w.min + ' min' : ''}${w.volume ? ' · ' + fmt(w.volume) + ' kg de volume' : ''}</p>
    ${ex || (w.notes ? `<p class="w-notes">${esc(w.notes)}</p>` : '')}
    <div class="form-actions"><button class="btn ghost danger" data-act="apagarTreino" data-id="${id}">${ic('trash', 16)} Apagar</button>${w.ex?.length ? `<button class="btn" data-act="editarTreinoMus" data-id="${id}">${ic('edit', 14)} Editar séries</button>` : `<button class="btn ghost" data-act="editarTreino" data-id="${id}">Editar</button>`}</div>`);
};

/* evolução de um exercício: gráfico do 1RM estimado */
ACT.verExercicio = (id) => {
  const h = exHistory(id), e = exById(id), m = movDe(id), p = exPref(id), g = sugestao(id);
  const topo = `<div class="ex-hero">${exAnim(id, 150)}<div class="grow"><span class="eyebrow">${e.g} · ${m.nome}</span><p>${m.dica}</p>
    <span class="tiny muted">Descanso ${mmss(p.rest * 1000)} · faixa ${p.lo}–${p.hi} repetições${p.note ? ' · ' + esc(p.note) : ''}</span></div></div>${g ? `<div class="sugere ${g.up ? 'up' : ''}">${ic(g.up ? 'trophy' : 'chart', 14)}<span class="grow">Próximo treino: ${g.txt}</span></div>` : ''}`;
  if (!h.length) { openModal(e.n, topo + '<p class="muted">Ainda sem registros deste exercício. Faça o primeiro treino e a evolução aparece aqui.</p>'); return; }
  const melhor = h.reduce((a, q) => (q.best > a.best ? q : a), h[0]), maxKg = Math.max(...h.map((q) => q.maxKg));
  openModal(e.n, `${topo}<div class="stats three"><div><b class="serif">${fmt(Math.round(melhor.best))} kg</b><span>1RM estimado</span></div><div><b class="serif">${fmt(maxKg)} kg</b><span>maior carga</span></div><div><b class="serif">${h.length}</b><span>treinos</span></div></div>
    <span class="eyebrow">1RM estimado · toque nos pontos</span>${lineChart(h.map((q) => ({ d: q.date, v: Math.round(q.best * 10) / 10 })), { unid: ' kg' })}
    <span class="eyebrow">Últimas vezes</span>${h.slice(-5).reverse().map((q) => `<div class="hrate"><span>${shortDate(q.date)}</span><b>${q.sets.map((z) => `${fmt(z.kg || 0)}×${z.reps}`).join('  ')}</b><span></span></div>`).join('')}`);
};

ACT.verExercicios = () => {
  const feitos = allExs().map((e) => ({ e, h: exHistory(e.id) })).filter((x) => x.h.length);
  openModal('Exercícios', feitos.length ? feitos.map(({ e, h }) => `<button class="pr-row" data-act="verExercicio" data-id="${e.id}"><span class="grow">${esc(e.n)}<span class="tiny muted">${e.g} · ${h.length} treinos</span></span><b class="serif">${fmt(Math.round(Math.max(...h.map((p) => p.best))))} kg</b>${ic('chev', 14)}</button>`).join('')
    : '<p class="muted">Nenhum exercício registrado ainda.</p>');
};
