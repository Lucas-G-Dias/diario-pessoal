/* ============ Devocional: abas Calendário, Progresso, Livros, Diário e Oração (como no plano "Um ano na Palavra") ============ */
const DEV_VIEWS = {};
const fmtMin = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? pad(m % 60) : ''}`);
const semPlano = (txt) => `<div class="card empty"><p class="muted">${txt}</p><button class="btn" data-act="escolherAno">${ic('play', 14)} Começar a Bíblia em um ano</button></div>`;

/* capítulos lidos por livro (todas as formas de leitura contam) */
function leituraBiblia() {
  const read = bibleRead(), por = {}; let nt = 0, at = 0;
  BIBLIA.forEach(([ab, , n], k) => { let c = 0; for (let i = 1; i <= n; i++) if (read[capKey(ab, i)]) c++; por[ab] = c; if (k >= NT_START) nt += c; else at += c; });
  return { por, nt, at, tot: nt + at };
}

DEV_VIEWS.calendario = () => {
  if (!anoCfg()) return semPlano('O calendário mostra cada dia do plano anual: o que já foi lido, o que ficou em aberto e os domingos de revisão.');
  const k = S.anoMes || today().slice(0, 7), ds = anoDates();
  let dev = 0, caps = 0, min = 0;
  ds.forEach((d, i) => { if (d.slice(0, 7) !== k) return; const L = anoLog(i); if (L.p) caps += ANO.plan[i].reduce((a, s) => a + s[2] - s[1] + 1, 0); if (L.c) { dev++; min += L.min || 0; } });
  store.col('anodom').forEach((x) => { if (x.id.slice(0, 7) === k && x.c) { dev++; min += x.min || 0; } });
  const pend = anoPending();
  return `<section class="card">${anoCalHTML()}</section>
    <section class="card"><div class="stats three"><div><b>${dev}</b><span>devocionais no mês</span></div><div><b>${caps}</b><span>capítulos lidos</span></div><div><b>${fmtMin(min)}</b><span>com Deus</span></div></div>
    ${pend.length ? `<p class="tiny muted">${pend.length} ${pend.length === 1 ? 'leitura ficou' : 'leituras ficaram'} em aberto. Sem pressa: dá para fazer no domingo ou quando sobrar um tempo.</p><button class="link" data-act="anoReorganizar">Reorganizar a partir de hoje</button>` : ''}</section>`;
};

DEV_VIEWS.progresso = () => {
  const p = leituraBiblia(), logs = store.col('anolog'), doms = store.col('anodom'), t = today();
  const feitos = logs.filter((x) => x.c), mins = [...feitos, ...doms.filter((x) => x.c)].map((x) => x.min || 0), total = mins.reduce((a, b) => a + b, 0);
  const dias = new Set([...devos().map((d) => d.date), ...Object.values(bibleRead())]);
  const livros = BIBLIA.filter(([ab, , n]) => p.por[ab] >= n).length, estudos = logs.filter((x) => x.observo || x.entendo || x.aplico).length;
  const versos = logs.filter((x) => x.versiculo).length + doms.filter((x) => x.versiculo).length, pedidos = prayers();
  let ritmo = '';
  if (anoCfg()) { const ds = anoDates(), passados = ds.filter((d) => d <= t).length, lidos = logs.filter((x) => x.p).length;
    if (passados >= 12 && lidos) { let d = nextReading(t); for (let k = 0; k < Math.ceil((ANO_N - lidos) / Math.max(lidos / passados, 0.05)); k++) d = nextReading(addDays(d, 1));
      ritmo = `<p class="tiny muted">No ritmo das últimas semanas, você termina a Bíblia por volta de ${MESES_L[Number(d.slice(5, 7)) - 1]} de ${d.slice(0, 4)}. Qualquer data serve: o que importa é continuar.</p>`; } }
  const w0 = addDays(t, -((dow(t) + 6) % 7)), semanas = Array.from({ length: 12 }, (_, k) => { const ws = addDays(w0, -7 * (11 - k)); let n = 0; for (let j = 0; j < 7; j++) if (dias.has(addDays(ws, j))) n++; return { ws, n }; });
  const estante = (lista) => `<div class="b-shelf">${lista.map(([ab, nome, n]) => `<button style="flex-grow:${n}" data-act="anoLivro" data-id="${ab === 'Êx' ? 'Ex' : ab}" aria-label="${nome}: ${p.por[ab]} de ${n} capítulos" title="${nome} · ${p.por[ab]}/${n}"><i style="height:${(p.por[ab] / n) * 100}%"></i></button>`).join('')}</div>`;
  return `<section class="card"><div class="big">${fmt(p.tot)} <small class="muted">de 1.189 capítulos</small></div><p class="muted">${fmt(Math.round((p.tot / 1189) * 1000) / 10)}% da Bíblia lida.</p>${ritmo}
      <div class="hrate"><span>Novo Testamento</span><b>${p.nt}/260</b><span></span>${progressBar(p.nt / 260, 'indigo')}</div><div class="hrate"><span>Antigo Testamento</span><b>${p.at}/929</b><span></span>${progressBar(p.at / 929, 'indigo')}</div></section>
    <section class="card"><span class="eyebrow">Constância</span><div class="stats three" style="margin-top:12px"><div><b>${devos().length}</b><span>devocionais</span></div><div><b>${fmtMin(total)}</b><span>de tempo com Deus</span></div>
      <div><b>${mins.length ? Math.round(total / mins.length) + ' min' : '—'}</b><span>em média</span></div><div><b>${devoStreak()}</b><span>dias seguidos agora</span></div><div><b>${dias.size}</b><span>dias com Deus</span></div><div><b>${feitos.length}/${ANO_N}</b><span>dias do plano</span></div></div>
      <span class="tiny muted">Dias com devocional nas últimas 12 semanas</span><div class="mbars weeks">${semanas.map((w, i) => `<div class="mcol ${i === 11 ? 'today' : ''}" style="--i:${i}" title="Semana de ${shortDate(w.ws)}: ${w.n} dias"><b>${w.n}</b><i style="height:${(w.n / 7) * 100}%"></i><span>${Number(w.ws.slice(8))}/${Number(w.ws.slice(5, 7))}</span></div>`).join('')}</div></section>
    <section class="card"><span class="eyebrow">Palavra e oração</span><div class="stats three" style="margin-top:12px"><div><b>${livros}</b><span>de 66 livros concluídos</span></div><div><b>${estudos}</b><span>estudos escritos</span></div><div><b>${versos}</b><span>versículos guardados</span></div>
      <div><b>${pedidos.filter((x) => !x.answered).length}</b><span>pedidos em oração</span></div><div><b>${pedidos.filter((x) => x.answered).length}</b><span>orações respondidas</span></div><div><b>${doms.filter((x) => x.c).length}</b><span>domingos de revisão</span></div></div></section>
    <section class="card"><span class="eyebrow">Sua estante</span><p class="tiny muted">Cada lombada é um livro, na ordem das Bíblias impressas. Toque para abrir o resumo.</p>
      <span class="tiny">Antigo Testamento · 39 livros</span>${estante(BIBLIA.slice(0, NT_START))}<span class="tiny">Novo Testamento · 27 livros</span>${estante(BIBLIA.slice(NT_START))}</section>`;
};

DEV_VIEWS.livros = () => {
  const p = leituraBiblia(), ds = anoDates(), ordem = []; ANO.plan.forEach((d) => d.forEach(([b]) => { if (!ordem.includes(b)) ordem.push(b); }));
  const linha = (b) => { const [nome, n] = ANO.books[b], r = Math.min(n, p.por[capCode(b)] || 0);
    const st = b === 'Sl' || b === 'Pv' ? 'Um por dia' : r >= n ? 'Concluído' : r ? 'Em leitura' : anoCfg() && ds[firstApp[b]] ? `Começa ${shortDate(ds[firstApp[b]])}` : '';
    return `<details class="bk-l"><summary><span class="grow"><b>${esc(nome)}</b><span class="tiny muted">${n} ${n === 1 ? 'capítulo' : 'capítulos'} · ${st}</span></span><span class="mini-bar"><i style="width:${(r / n) * 100}%"></i></span></summary>${livroDL(b)}</details>`; };
  return `<p class="tiny muted">Todos os livros na ordem em que você vai ler no plano anual. Toque em um livro para ver o resumo completo.</p>
    <h3 class="eyebrow sec">Novo Testamento</h3><section class="card list">${ordem.filter((b) => ANO.books[b][2] === 'NT').map(linha).join('')}</section>
    <h3 class="eyebrow sec">Antigo Testamento, em ordem cronológica</h3><section class="card list">${ordem.filter((b) => ANO.books[b][2] === 'AT').map(linha).join('')}</section>
    <h3 class="eyebrow sec">Leitura diária</h3><section class="card list">${['Sl', 'Pv'].map(linha).join('')}</section>`;
};

DEV_VIEWS.diario = () => {
  const ds = anoDates(), itens = [];
  store.col('anolog').forEach((L) => { if (['trecho', 'observo', 'entendo', 'aplico', 'versiculo', 'mensagem'].some((k) => (L[k] || '').trim())) itens.push({ d: ds[L.id] || L.c || '', h: diarioAno(Number(L.id), L) }); });
  store.col('anodom').forEach((D) => { if (['aprendi', 'culto', 'versiculo'].some((k) => (D[k] || '').trim())) itens.push({ d: D.id, h: `<div class="entry"><span class="eyebrow">Domingo, ${shortDate(D.id)} · revisão da semana</span>
    ${D.versiculo ? `<b>Versículo da semana: ${esc(D.versiculo)}</b>` : ''}${D.aprendi ? `<p class="reflex">${esc(D.aprendi)}</p>` : ''}${D.culto ? `<p class="tiny muted">Culto: ${esc(D.culto)}</p>` : ''}
    <button class="link" data-act="anoDomingo" data-id="${D.id}">Abrir o domingo</button></div>` }); });
  devos().filter((x) => !String(x.id).startsWith('ano-') && !String(x.id).startsWith('dom-')).forEach((x) => itens.push({ d: x.date, h: `<div class="entry"><span class="eyebrow">${shortDate(x.date)} · devocional livre</span><b>${esc(x.passage)}</b>
    ${x.app ? `<p class="reflex">${esc(x.app)}</p>` : ''}<button class="link" data-act="editarDevocional" data-id="${x.id}">Abrir</button></div>` }));
  itens.sort((a, b) => b.d.localeCompare(a.d));
  return itens.length ? `<p class="tiny muted">${itens.length} ${itens.length === 1 ? 'registro' : 'registros'}</p><section class="card list">${itens.map((x) => x.h).join('')}</section>`
    : '<div class="card empty"><p class="muted">Seu diário começa no primeiro devocional. O que você escrever no estudo, no registro e nos domingos aparece aqui.</p></div>';
};
function diarioAno(i, L) {
  const est = [['trecho', 'Trecho estudado'], ['observo', 'Observar'], ['entendo', 'Interpretar'], ['aplico', 'Aplicar']].filter(([k]) => (L[k] || '').trim());
  return `<div class="entry"><span class="eyebrow">${anoDates()[i] ? shortDate(anoDates()[i]) + ' · ' : ''}${esc(anoRefs(i))}</span>${L.versiculo ? `<b>${esc(L.versiculo)}</b>` : ''}${L.mensagem ? `<p class="reflex">${esc(L.mensagem)}</p>` : ''}
    ${est.length ? `<details class="more"><summary class="link">Estudo</summary><dl class="dl-s">${est.map(([k, l]) => `<dt>${l}</dt><dd>${esc(L[k])}</dd>`).join('')}</dl></details>` : ''}<button class="link" data-act="anoAbrir" data-id="${i}">Abrir o dia</button></div>`;
}

DEV_VIEWS.oracao = () => {
  const ps = prayers(), abertos = ps.filter((x) => !x.answered), resp = ps.filter((x) => x.answered).sort((a, b) => b.answered.localeCompare(a.answered));
  return `<section class="card"><span class="eyebrow">Caderno de oração</span><p class="tiny muted">Anote os pedidos pelos quais você está orando. Quando forem respondidos, marque: eles ficam guardados aqui embaixo como memória do que Deus fez.</p>
    <form class="add-row" data-form="oracao"><input name="text" placeholder="Novo pedido de oração" aria-label="Novo pedido de oração" maxlength="300" required><button class="btn-sm">${ic('plus', 14)}</button></form>
    <h4 class="eyebrow">Orando agora (${abertos.length})</h4>${abertos.length ? abertos.map((x) => `<div class="prayer"><span class="grow">${esc(x.text)}<span class="tiny muted">desde ${shortDate(x.date)}</span></span>
      <button class="btn-sm" data-act="oracaoRespondida" data-id="${x.id}">Respondida</button><button class="icon-btn" data-act="apagarOracao" data-id="${x.id}" aria-label="Apagar pedido">${ic('x', 14)}</button></div>`).join('') : '<p class="tiny muted">Nenhum pedido no momento.</p>'}</section>
    ${resp.length ? `<section class="card"><h4 class="eyebrow">Respondidas (${resp.length})</h4>${resp.map((x) => `<div class="prayer done">${ic('heart', 16)}<span class="grow">${esc(x.text)}<span class="tiny muted">de ${shortDate(x.date)} a ${shortDate(x.answered)}</span></span></div>`).join('')}</section>` : ''}`;
};
