/* ============ Apagar com escolha: um dia ou um período, só as áreas marcadas; marcar ou desmarcar um dia passado do hábito ============ */
const APAGAR_AREAS = [['habitos', 'Hábitos marcados', 'habit'], ['leitura', 'Páginas lidas', 'book'], ['treino', 'Treinos', 'gym'],
  ['devocional', 'Devocionais e capítulos', 'cross'], ['escrita', 'Diário', 'pen'], ['dieta', 'Refeições e água', 'food'], ['saude', 'Medidas e exames', 'pulse']];
const entreDatas = (d, de, ate) => !!d && d >= de && d <= ate;

/* tudo o que existe no período, nas áreas escolhidas: [{ area, path, txt, keys? }] */
function registrosEntre(de, ate, areas) {
  const out = [], A = new Set(areas), docs = Object.entries(store.docs).filter(([, x]) => !x.deleted);
  const porDia = (pre, area, txt) => { for (const [p, x] of docs) { const d = p.slice(pre.length + 1); if (p.startsWith(pre + '/') && entreDatas(d, de, ate)) out.push({ area, path: p, txt: `${shortDate(d)} · ${txt(x.data)}` }); } };
  const porCampo = (pre, area, txt, campo = 'date') => { for (const [p, x] of docs) if (p.startsWith(pre + '/') && entreDatas(x.data[campo], de, ate)) out.push({ area, path: p, txt: `${shortDate(x.data[campo])} · ${txt(x.data)}` }); };
  if (A.has('habitos')) porDia('habitlog', 'habitos', (d) => plural(Object.values(d.ids || {}).filter(Boolean).length, 'hábito marcado', 'hábitos marcados'));
  if (A.has('leitura')) porDia('reading', 'leitura', (d) => `${d.pages || 0} páginas`);
  if (A.has('treino')) porCampo('workouts', 'treino', (d) => esc(d.name || d.type || 'Treino'));
  if (A.has('devocional')) {
    porCampo('devos', 'devocional', (d) => esc(d.ref || d.title || 'Devocional'));
    porCampo('anolog', 'devocional', () => 'dia do plano anual concluído', 'c');
    porDia('anodom', 'devocional', () => 'domingo de revisão');
    const keys = Object.entries(bibleRead()).filter(([, d]) => entreDatas(d, de, ate)).map(([k]) => k);
    if (keys.length) out.push({ area: 'devocional', path: 'bible/main', keys, txt: plural(keys.length, 'capítulo lido', 'capítulos lidos') });
  }
  if (A.has('escrita')) porCampo('journal', 'escrita', (d) => plural(d.words || 0, 'palavra', 'palavras'));
  if (A.has('dieta')) porDia('dietalog', 'dieta', (d) => { const n = Object.keys(d.r || {}).length, ml = d.ml ?? (d.agua || 0) * 250; return [n ? plural(n, 'refeição', 'refeições') : '', ml ? litros(ml) + ' de água' : ''].filter(Boolean).join(' · ') || 'registro vazio'; });
  if (A.has('saude')) { porCampo('medidas', 'saude', (d) => (d.peso ? `peso ${fmt(d.peso)} kg` : 'medidas')); porCampo('exames', 'saude', (d) => esc(d.lab || 'exame')); }
  return out;
}
function apagarRegistros(lista) {
  for (const r of lista) {
    if (r.keys) { const b = store.doc('bible/main') || {}, read = { ...(b.read || {}) }; r.keys.forEach((k) => delete read[k]); store.write('bible/main', { ...b, read }, false, true); }
    else store.write(r.path, {}, true, true);
  }
  STATS.clear(); GAME = null; S.prevGame = null; render();
}

const lerApagar = () => { const f = $('form[data-form="apagarDias"]'); if (!f) return null;
  let de = f.de.value || today(), ate = f.ate.value || de; if (de > ate) [de, ate] = [ate, de];
  return { de, ate, areas: APAGAR_AREAS.map(([k]) => k).filter((k) => f['a_' + k]?.checked) }; };
const periodoTxt = (de, ate) => (de === ate ? `do dia ${shortDate(de)}` : `de ${shortDate(de)} a ${shortDate(ate)}`);

ACT.apagarDias = () => {
  const t = today();
  openModal('Apagar alguns dias', `<form data-form="apagarDias" class="apagar">
    <p class="muted">Escolha o dia, ou um período, e o que apagar. O resto continua como está.</p>
    <div class="ap-rapido">${[['0', 'Hoje'], ['1', 'Ontem'], ['7', 'Últimos 7 dias']].map(([k, n]) => `<button type="button" class="chip" data-act="apagarAtalho" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="grid2"><label>De<input type="date" name="de" value="${t}" max="${t}" data-chg="apagarPrev"></label><label>Até<input type="date" name="ate" value="${t}" max="${t}" data-chg="apagarPrev"></label></div>
    <fieldset><legend>O que apagar</legend><div class="ap-areas">${APAGAR_AREAS.filter(([k]) => k === 'habitos' || areaOn(k)).map(([k, n, i]) => `<label class="check"><input type="checkbox" name="a_${k}" checked data-chg="apagarPrev"><span class="ap-ic">${ic(i, 15)}</span>${n}</label>`).join('')}</div></fieldset>
    <div id="apagar-prev" class="ap-prev" aria-live="polite"></div>
    <p class="tiny muted">Hábitos, metas, fichas e livros continuam cadastrados; só somem os registros desses dias.</p>
    <div class="form-actions"><button class="btn danger-fill" id="apagar-ok">Apagar</button></div></form>`);
  CHG.apagarPrev();
};
ACT.apagarAtalho = (n) => { const f = $('form[data-form="apagarDias"]'), t = today(); n = Number(n);
  f.ate.value = n === 1 ? addDays(t, -1) : t; f.de.value = n === 7 ? addDays(t, -6) : f.ate.value; CHG.apagarPrev(); };
CHG.apagarPrev = () => {
  const q = lerApagar(); if (!q) return; const lista = registrosEntre(q.de, q.ate, q.areas), box = $('#apagar-prev'), bt = $('#apagar-ok');
  const grupos = APAGAR_AREAS.map(([k, n, i]) => [n, i, lista.filter((r) => r.area === k)]).filter(([, , xs]) => xs.length);
  box.innerHTML = grupos.length ? `<b>Vai apagar ${periodoTxt(q.de, q.ate)}:</b>${grupos.map(([n, i, xs]) => `<details><summary>${ic(i, 15)} ${n} <span class="muted">· ${xs.length}</span></summary><ul>${xs.slice(0, 12).map((r) => `<li>${r.txt}</li>`).join('')}${xs.length > 12 ? `<li class="muted">e mais ${xs.length - 12}</li>` : ''}</ul></details>`).join('')}`
    : `<span class="muted">Nada registrado ${periodoTxt(q.de, q.ate)} nas áreas marcadas.</span>`;
  bt.disabled = !lista.length; bt.textContent = lista.length ? `Apagar ${plural(lista.length, 'registro', 'registros')}` : 'Nada para apagar';
};
FORMS.apagarDias = () => {
  const q = lerApagar(), lista = registrosEntre(q.de, q.ate, q.areas); if (!lista.length) return;
  if (!confirm(`Apagar ${plural(lista.length, 'registro', 'registros')} ${periodoTxt(q.de, q.ate)}? Isso não pode ser desfeito.`)) return;
  apagarRegistros(lista); closeModal(); toast(`${plural(lista.length, 'registro apagado', 'registros apagados')}`);
};

/* hábito: tocar num dia da grade marca ou desmarca aquele dia */
ACT.habDia = (k) => {
  const [id, d] = k.split('|'), raw = store.doc('habits/' + id); if (!raw || d > today()) return;
  const h = { id, ...raw }, L = store.doc('habitlog/' + d) || {}, ids = { ...(L.ids || {}) }, feito = hDone(h, ids);
  if (feito) delete ids[id]; else ids[id] = (h.target || 1) > 1 ? h.target : true;
  store.set('habitlog/' + d, { ...L, ids }); haptic(8); toast(`${esc(h.name)}: ${feito ? 'desmarcado' : 'marcado'} em ${shortDate(d)}`);
};
/* hábito: limpar só o histórico (o hábito continua) */
ACT.habLimpar = (id) => {
  const h = store.doc('habits/' + id); if (!h) return;
  const logs = Object.entries(store.docs).filter(([p, x]) => !x.deleted && p.startsWith('habitlog/') && x.data.ids?.[id] != null);
  if (!logs.length) { toast('Este hábito ainda não tem dias marcados'); return; }
  if (!confirm(`Limpar os ${logs.length} dias marcados de "${h.name}"? O hábito continua, começando do zero.`)) return;
  for (const [p, x] of logs) { const ids = { ...x.data.ids }; delete ids[id]; store.write(p, { ...x.data, ids }, false, true); }
  STATS.clear(); GAME = null; closeModal(); render(); toast('Histórico do hábito limpo');
};
