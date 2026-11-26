/* ============ Treino: preferências por exercício, sugestão de carga, aquecimento, editar treino salvo ============
   config/exprefs { <exId>: { rest, note, lo, hi } } — o app lembra o descanso, a faixa de repetições e a anotação de cada exercício. */
const exPrefs = () => store.doc('config/exprefs') || {};
const exPref = (id) => ({ rest: cfg().rest, lo: 8, hi: 12, note: '', ...(exPrefs()[id] || {}) });
const setExPref = (id, patch) => { const all = exPrefs(); store.set('config/exprefs', { ...all, [id]: { ...(all[id] || {}), ...patch } }, true); };
const DESCANSOS = [45, 60, 90, 120, 150, 180, 240];
const isoladores = ['eleva', 'crucifixo', 'rosca', 'triceps', 'extensora', 'flexora', 'perna', 'panturrilha'];

/* progressão dupla: bateu o topo da faixa em todas as séries de trabalho? sobe a carga; senão, mesma carga e +1 repetição */
function sugestao(exId) {
  const ult = lastSets(exId).filter((z) => !z.w), p = exPref(exId);
  if (!ult.length || ['prancha'].includes(EX_MOV[exId])) return null;
  const top = Math.max(...ult.map((z) => +z.kg || 0)), daCarga = ult.filter((z) => (+z.kg || 0) === top);
  if (!top) return { kg: 0, reps: Math.max(...ult.map((z) => +z.reps)) + 1, txt: `Tente ${Math.max(...ult.map((z) => +z.reps)) + 1} repetições por série` };
  const passo = isoladores.includes(EX_MOV[exId]) ? (top < 20 ? 1 : 2) : top < 100 ? 2.5 : 5;
  if (daCarga.every((z) => +z.reps >= p.hi)) return { kg: top + passo, reps: p.lo, up: true, txt: `Subir para ${fmt(top + passo)} kg × ${p.lo}–${p.hi}` };
  const menor = Math.min(...daCarga.map((z) => +z.reps));
  return { kg: top, reps: Math.min(p.hi, menor + 1), txt: `Manter ${fmt(top)} kg e buscar ${Math.min(p.hi, menor + 1)}+ repetições (faixa ${p.lo}–${p.hi})` };
}

Object.assign(ACT, {
  exRest: (ei) => { const s = sess(), x = s.ex[ei], cur = x.rest || exPref(x.id).rest, nx = DESCANSOS[(DESCANSOS.indexOf(cur) + 1) % DESCANSOS.length] || 90;
    x.rest = nx; setExPref(x.id, { rest: nx }); saveSess(s); },
  tipoSerie: (k) => { const [ei, si] = k.split(':').map(Number), s = sess(), z = s.ex[ei].sets[si]; z.w = !z.w; saveSess(s); toast(z.w ? 'Série de aquecimento: não conta no volume nem em recorde' : 'Série de trabalho'); },
  usarSugestao: (ei) => { const s = sess(), x = s.ex[ei], g = sugestao(x.id); if (!g) return;
    x.sets.forEach((z) => { if (!z.done && !z.w) { z.kg = g.kg || z.kg; z.reps = g.reps; } }); saveSess(s); haptic(10); },
  faixaEx: (ei) => { const s = sess(), x = s.ex[ei], p = exPref(x.id), opts = [[5, 8], [6, 10], [8, 12], [10, 15], [12, 20]], i = opts.findIndex((o) => o[0] === p.lo && o[1] === p.hi);
    const [lo, hi] = opts[(i + 1) % opts.length]; setExPref(x.id, { lo, hi }); render(); },
  /* abrir um treino de musculação já salvo no editor de séries (a mesma tela do treino ao vivo) */
  editarTreinoMus: (id) => {
    if (sess()) { toast('Termine ou descarte o treino em andamento primeiro'); return; }
    const w = store.doc('workouts/' + id);
    saveSess({ start: w.start || Date.parse(w.date + 'T12:00:00'), end: w.end, name: w.name, routineId: w.routineId || '', editId: id,
      ex: (w.ex || []).map((x) => ({ id: x.id, rest: x.rest, note: x.note || '', sets: x.sets.map((z) => ({ kg: z.kg, reps: z.reps, w: !!z.w, done: true })) })) });
    closeModal(); S.page = 'sessao'; render();
  },
});
CHG.exNota = (el) => { const ei = Number(el.dataset.id), s = sess(); s.ex[ei].note = el.value; saveSess(s, true); setExPref(s.ex[ei].id, { note: el.value }); };

/* cabeçalho de cada exercício no treino ao vivo */
function exHead(x, ei) {
  const e = exById(x.id), p = exPref(x.id), rest = x.rest || p.rest, g = sugestao(x.id);
  return `<div class="exh"><button class="exh-anim" data-act="verExercicio" data-id="${x.id}" aria-label="Ver como fazer ${esc(e.n)}">${exAnim(x.id, 54)}</button>
    <div class="grow"><button class="ex-name" data-act="verExercicio" data-id="${x.id}">${esc(e.n)}</button><span class="tiny muted">${e.g}</span>
      <div class="exh-chips"><button class="chip sm" data-act="exRest" data-id="${ei}" aria-label="Descanso deste exercício: ${mmss(rest * 1000)}. Trocar">${ic('clock', 13)} ${mmss(rest * 1000)}</button>
      <button class="chip sm" data-act="faixaEx" data-id="${ei}" aria-label="Faixa de repetições ${p.lo} a ${p.hi}. Trocar">${p.lo}–${p.hi} reps</button></div></div>
    <button class="icon-btn" data-act="tirarExercicio" data-id="${ei}" aria-label="Tirar ${esc(e.n)} do treino">${ic('trash', 16)}</button></div>
    ${g ? `<div class="sugere ${g.up ? 'up' : ''}">${ic(g.up ? 'trophy' : 'chart', 14)}<span class="grow">${g.txt}</span><button class="link" data-act="usarSugestao" data-id="${ei}">Usar</button></div>` : ''}
    <details class="nota" ${x.note || p.note ? 'open' : ''}><summary class="tiny muted">Anotação</summary><textarea rows="2" data-inp="exNota" data-id="${ei}" placeholder="Ex.: banco no furo 3, pegada fechada">${esc(x.note ?? p.note)}</textarea></details>`;
}
