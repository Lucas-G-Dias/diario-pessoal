/* ============ Bíblia em um ano: plano guiado (seg a sáb) com domingo de revisão ============
   plano/ano  { start, ancoras: [{ idx, data }], curto, pv: { <data>: true } }
   anolog/<i> { p, s, c, min, trecho, observo, entendo, aplico, versiculo, mensagem }   (i = dia do plano, 0 a 311)
   anodom/<d> { aprendi, culto, versiculo, c, min }   ·   session/ano { i | d, start }
   Concluir cria devos/ano-<i> (ou devos/dom-<d>) e marca os capítulos em bible/main: conta na missão, no XP e nas conquistas. */
const ANO_N = ANO.plan.length;
const anoCfg = () => store.doc('plano/ano');
const capCode = (b) => (b === 'Ex' ? 'Êx' : b);
const nextReading = (d) => { while (dow(d) === 0) d = addDays(d, 1); return d; };
const anoLog = (i) => store.doc('anolog/' + i) || {};
const anoDone = (i) => !!anoLog(i).p;
const segLabel = ([b, a, z]) => { const [n, c] = ANO.books[b]; return c === 1 ? n : `${n} ${a === z ? a : a + '–' + z}`; };
const anoRefs = (i) => ANO.plan[i].map(segLabel).join(', ');
const psOf = (i) => ANO.ps[i % ANO.ps.length];
const psLabel = (e) => (e.length === 1 ? `Salmo ${e[0]}` : `Salmo 119:${e[1]}–${e[2]}`);
function pvOf(d) { const x = new Date(d + 'T12:00:00'), n = x.getDate(), last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); return n === last && n < 31 ? Array.from({ length: 32 - n }, (_, k) => n + k) : [n]; }
const pvLabel = (c) => `Provérbios ${c.length === 1 ? c[0] : c[0] + '–' + c[c.length - 1]}`;
const firstApp = {}, lastApp = {};
ANO.plan.forEach((d, i) => d.forEach(([b, a, z]) => { if (a === 1 && firstApp[b] === undefined) firstApp[b] = i; if (z === ANO.books[b][1]) lastApp[b] = i; }));

/* datas de cada dia do plano, a partir das âncoras (reorganizar = nova âncora) */
function anoDates() {
  const c = anoCfg(); if (!c) return [];
  const ck = 'ano|' + JSON.stringify(c.ancoras); if (STATS.has(ck)) return STATS.get(ck);
  const anc = [...c.ancoras].sort((a, b) => a.idx - b.idx), out = [];
  anc.forEach((a, k) => { const end = k + 1 < anc.length ? anc[k + 1].idx : ANO_N; let d = nextReading(a.data); for (let i = a.idx; i < end; i++) { out[i] = d; d = nextReading(addDays(d, 1)); } });
  STATS.set(ck, out); return out;
}
const anoIdxOn = (d) => anoDates().indexOf(d);
function anoPending() { const ds = anoDates(), t = today(), out = []; for (let i = 0; i < ANO_N; i++) if (ds[i] < t && !anoDone(i)) out.push(i); return out; }
function anoFeitos() { let n = 0; for (let i = 0; i < ANO_N; i++) if (anoDone(i)) n++; return n; }
function anoInfo() { const f = anoFeitos(); return { id: 'ano', nome: 'Bíblia em um ano', total: ANO_N, lidos: f, next: null }; }
const versoDaSemana = (d = today()) => store.doc('anodom/' + addDays(d, -dow(d)))?.versiculo || store.doc('anodom/' + addDays(d, -dow(d) - 7))?.versiculo || '';

/* resumo de um livro */
function bookCard(b, titulo, aberto) {
  const L = LIVROS[b]; if (!L) return '';
  const linha = (t, v) => `<dt>${t}</dt><dd>${esc(v)}</dd>`;
  return `<details class="bcard" ${aberto ? 'open' : ''}><summary><span class="eyebrow">${esc(titulo || 'Sobre o livro')}</span><strong>${esc(ANO.books[b][0])}</strong><span class="tiny muted">${esc(L.o)}</span></summary>
    <dl>${linha('Quem escreveu', L.a)}${linha('Quando', L.q)}${linha('Para quem', L.p)}${linha('Contexto', L.c)}${linha('Personagens', L.ps)}
    <dt>Grandes temas</dt><dd><ul>${L.t.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></dd>${linha('Onde Jesus aparece', L.j)}${linha('Texto-chave', L.k)}${linha('Dica de leitura', L.d)}</dl>
    <p class="tiny muted">Resumo baseado em introduções de Bíblias de estudo. Panorama em vídeo: <a href="https://bibleproject.com/portugues/" target="_blank" rel="noopener">BibleProject em português</a>.</p></details>`;
}

/* cartão do plano na página Devocional */
function anoCard() {
  const c = anoCfg(), ds = anoDates(), t = today(), f = anoFeitos(), pend = anoPending(), i = anoIdxOn(t), vs = versoDaSemana();
  const ringH = ring(f / ANO_N, '#5e5ce6', 84, `<b>${Math.round((f / ANO_N) * 100)}%</b><small>${f}/${ANO_N}</small>`);
  let corpo;
  if (t < c.start) corpo = `<span class="eyebrow">Começa ${c.start === addDays(t, 1) ? 'amanhã' : 'em ' + shortDate(c.start)}</span><strong class="lg">${anoRefs(0)}</strong><button class="btn-sm" data-act="anoAbrir" data-id="0">Ver o primeiro dia</button>`;
  else if (dow(t) === 0) corpo = `<span class="eyebrow">Domingo · revisão da semana</span><strong class="lg">Revisão, culto e oração</strong>${store.doc('anodom/' + t)?.c ? `<span class="tag ok">${ic('check', 12)} concluído</span>` : ''}<button class="btn-sm" data-act="anoDomingo" data-id="${t}">Abrir o domingo</button>`;
  else if (i >= 0) { const L = anoLog(i); corpo = `<span class="eyebrow">Hoje · dia ${i + 1} de ${ANO_N}</span><strong class="lg">${anoRefs(i)}</strong><span class="tiny muted">${psLabel(psOf(i))} · ${pvLabel(pvOf(t))}</span>
    ${L.c ? `<span class="tag ok">${ic('check', 12)} devocional feito</span>` : `<button class="btn-sm" data-act="anoAbrir" data-id="${i}">${ic('play', 13)} Abrir o devocional de hoje</button>`}`; }
  else corpo = f >= ANO_N ? '<strong class="lg">Você leu a Bíblia inteira!</strong>' : `<strong class="lg">Próxima leitura: ${anoRefs(Math.max(0, ds.findIndex((d) => d > t)))}</strong>`;
  return `<section class="card ano"><div class="ano-top">${ringH}<div class="grow">${corpo}</div></div>
    ${vs ? `<p class="vsem"><span class="eyebrow">Versículo da semana</span>${esc(vs)}</p>` : ''}
    ${pend.length ? `<div class="ano-pend"><b>${pend.length === 1 ? '1 leitura em aberto' : pend.length + ' leituras em aberto'}</b><span class="tiny muted">Faça quando puder, ou reorganize: o plano recomeça de hoje e o fim se ajusta.</span>
      <div class="row-gap"><button class="link" data-act="anoAbrir" data-id="${pend[0]}">Fazer ${shortDate(ds[pend[0]])}</button><button class="link" data-act="anoReorganizar">Reorganizar a partir de hoje</button></div></div>` : ''}
    <div class="row-gap"><button class="link" data-act="anoCalendario">Calendário</button><button class="link" data-act="anoLivros">Livros</button><button class="link" data-act="trocarPlano">Trocar plano</button></div>
    <span class="tiny muted">Termina em ${longDate(ds[ANO_N - 1]).replace(/^[^,]+, /, '')} ${ds[ANO_N - 1].slice(0, 4)}</span></section>`;
}

/* ---- o dia do plano ---- */
const chk = (act, id, on, t, d) => `<button class="chk ${on ? 'on' : ''}" data-act="${act}" data-id="${id}" aria-pressed="${!!on}"><span class="box">${on ? ic('check', 14) : ''}</span><span class="grow"><b>${t}</b>${d ? `<span class="tiny muted">${d}</span>` : ''}</span></button>`;
const campo = (i, k, label, dica, ph, L) => `<label>${label}${dica ? `<span class="tiny muted">${dica}</span>` : ''}<textarea rows="3" data-inp="anoCampo" data-id="${i}:${k}" placeholder="${ph || ''}">${esc(L[k] || '')}</textarea></label>`;
const passo = (n, titulo, min, corpo) => `<li class="passo"><div class="passo-h"><span class="passo-n">${n}</span><h3>${titulo}</h3><span class="tag">${min} min</span></div><div class="passo-b">${corpo}</div></li>`;

function anoTimer(key) {
  const s = store.doc('session/ano');
  if (s && String(s.key) === String(key)) return `<span class="live-sm">${ic('clock', 14)} <b class="tick" data-since="${s.start}">${mmss(Date.now() - s.start)}</b></span>`;
  return `<button class="btn-sm ghost" data-act="anoCronometro" data-id="${key}">${ic('play', 12)} Marcar o tempo</button>`;
}

VIEWS.ano = () => {
  if (S.anoDom) return anoDomingoView(S.anoDom);
  const i = clamp(Number(S.anoDia) || 0, 0, ANO_N - 1), d = anoDates()[i], L = anoLog(i), c = anoCfg(), curto = !!c.curto, segs = ANO.plan[i], pvc = pvOf(d), pv = (c.pv || {})[d];
  const inicios = [...new Set(segs.filter(([b, a]) => a === 1).map((s) => s[0]))], retomadas = segs.filter(([b, a], k) => a > 1 && k === 0 && i > 0 && ANO.plan[i - 1].every((x) => x[0] !== b));
  const fim = [...new Set(segs.filter(([b]) => lastApp[b] === i).map((s) => s[0]))], vs = versoDaSemana(d), pedidos = prayers().filter((x) => !x.answered);
  const leitura = `${chk('anoMarca', i + ':p', L.p, anoRefs(i), (ANO.books[segs[0][0]][2] === 'NT' ? 'Novo' : 'Antigo') + ' Testamento · leitura corrida')}
    ${chk('anoMarca', i + ':s', L.s, psLabel(psOf(i)), 'Leia como oração')}${chk('anoPv', d, pv, pvLabel(pvc), 'Sabedoria para o dia')}
    ${fim.length ? `<p class="tiny muted">Com esta leitura você conclui ${fim.map((b) => ANO.books[b][0]).join(' e ')}.</p>` : ''}`;
  const intro = inicios.map((b) => bookCard(b, 'Antes de começar', !curto)).join('') + retomadas.map(([b, a]) => bookCard(b, `De volta a ${ANO.books[b][0]}, a partir do capítulo ${a}`)).join('');
  const concl = L.c ? `<div class="done-note">${ic('check', 16)} Devocional concluído ${L.c === today() ? 'hoje' : 'em ' + shortDate(L.c)}${L.min ? ` · ${L.min} min` : ''}</div>`
    : `<button class="btn wide" data-act="anoConcluir" data-id="${i}">Concluir devocional · +${XP.devocional} XP</button>`;
  const passos = curto ? [
    passo(1, 'Pare e ore', 2, '<p>Respire, deixe o celular de lado e peça que Deus fale com você pelo texto.</p>'),
    passo(2, 'Leia', 15, intro + leitura),
    passo(3, 'Ore e guarde um versículo', 3, campo(i, 'versiculo', 'Versículo que marcou', '', 'Ex.: Mateus 6:33', L) + concl),
  ] : [
    passo(1, 'Silêncio e oração', 5, '<p>Desligue as notificações e fique um minuto em silêncio. Depois, peça com suas palavras que Deus abra os seus olhos para a Palavra (Salmo 119:18).</p>'),
    passo(2, 'Leitura', 25, intro + '<p class="tiny muted">Leia de forma corrida, para acompanhar a história. Se surgir uma dúvida, anote e siga em frente.</p>' + leitura),
    passo(3, 'Estudo', 15, `<p>Escolha um trecho de poucos versículos e estude com calma, usando as notas da sua Bíblia de estudo.</p>
      ${campo(i, 'trecho', 'Trecho estudado', '', 'Ex.: Mateus 5:1-12', L)}${campo(i, 'observo', 'Observar', 'O que o texto diz? Quem fala, para quem, em que situação? O que se repete?', '', L)}
      ${campo(i, 'entendo', 'Interpretar', 'O que significava para os primeiros leitores? O que revela sobre Deus? Como aponta para Jesus?', '', L)}${campo(i, 'aplico', 'Aplicar', 'O que preciso crer, mudar ou obedecer? Seja concreto.', '', L)}`),
    passo(4, 'Oração', 10, `<p>Use o Salmo de hoje como ponto de partida:</p><ul class="acts"><li><b>Adoração.</b> Louve a Deus por quem Ele é, a partir do que leu.</li><li><b>Confissão.</b> Reconheça o que precisa ser tratado.</li>
      <li><b>Gratidão.</b> Agradeça por coisas concretas de ontem e de hoje.</li><li><b>Súplica.</b> Apresente seus pedidos e os de outras pessoas.</li></ul>
      ${pedidos.length ? `<details class="more"><summary>Seus pedidos de oração (${pedidos.length})</summary><ul class="acts">${pedidos.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ul></details>` : ''}`),
    passo(5, 'Registro', 5, campo(i, 'versiculo', 'Versículo que marcou', '', 'Ex.: Mateus 6:33', L) + campo(i, 'mensagem', 'O que Deus me mostrou hoje', 'Uma ou duas frases bastam.', '', L) + concl),
  ];
  return `<header class="top"><div><span class="eyebrow">${DIAS[dow(d)]}, ${shortDate(d)}${d === today() ? ' · hoje' : ''} · dia ${i + 1} de ${ANO_N}</span><h1>${anoRefs(i)}</h1>
    <p class="sub muted">${psLabel(psOf(i))} e ${pvLabel(pvc)}</p></div></header>
    <div class="ano-bar"><div class="seg">${[[0, 'Completo · 60 min'], [1, 'Curto · 20 min']].map(([v, n]) => `<button class="${Number(curto) === v ? 'on' : ''}" data-act="anoModo" data-id="${v}">${n}</button>`).join('')}</div>${L.c ? '' : anoTimer(i)}</div>
    ${vs ? `<p class="card vsem"><span class="eyebrow">Versículo da semana · repita antes de começar</span>${esc(vs)}</p>` : ''}
    <ol class="passos">${passos.join('')}</ol>
    <div class="row-between"><button class="btn-sm ghost" data-act="anoAbrir" data-id="${i - 1}" ${i ? '' : 'disabled'}>‹ Dia anterior</button><button class="btn-sm ghost" data-act="anoAbrir" data-id="${i + 1}" ${i < ANO_N - 1 ? '' : 'disabled'}>Próximo dia ›</button></div>`;
};

/* domingo: revisão da semana, culto, oração e versículo da semana */
function anoDomingoView(s) {
  const D = store.doc('anodom/' + s) || {}, ds = anoDates(), c = anoCfg(), pvc = pvOf(s), pv = (c.pv || {})[s], ini = addDays(s, -6);
  const ent = ds.map((d, i) => ({ d, i, L: anoLog(i) })).filter((x) => x.d >= ini && x.d < s && (x.L.versiculo || x.L.mensagem || x.L.aplico));
  const versos = [...new Set(ent.map((x) => (x.L.versiculo || '').trim()).filter(Boolean))], pedidos = prayers().filter((x) => !x.answered);
  const fld = (k, label, dica, ph) => `<label>${label}${dica ? `<span class="tiny muted">${dica}</span>` : ''}<textarea rows="3" data-inp="anoDomCampo" data-id="${s}:${k}" placeholder="${ph || ''}">${esc(D[k] || '')}</textarea></label>`;
  return `<header class="top"><div><span class="eyebrow">domingo, ${shortDate(s)}${s === today() ? ' · hoje' : ''} · sem leitura nova</span><h1>Revisão da semana</h1><p class="sub muted">${pvLabel(pvc)}, culto e oração · cerca de 40 min</p></div></header>
    <div class="ano-bar">${D.c ? '' : anoTimer('d' + s)}</div>
    <ol class="passos">${[
      passo(1, 'Silêncio e oração', 5, '<p>Agradeça pela semana que passou e peça que Deus mostre o que Ele quer que você leve dela.</p>'),
      passo(2, 'Provérbio do dia', 5, chk('anoPv', s, pv, pvLabel(pvc), 'Sabedoria para o dia')),
      passo(3, 'Revisão da semana', 10, `<p>Releia com calma o que você registrou nos últimos seis dias.</p>${ent.length ? ent.map((x) => `<div class="entry"><span class="eyebrow">${DIAS[dow(x.d)]} · ${anoRefs(x.i)}</span>
        ${x.L.versiculo ? `<b>${esc(x.L.versiculo)}</b>` : ''}${x.L.mensagem ? `<p class="reflex">${esc(x.L.mensagem)}</p>` : ''}${x.L.aplico ? `<p class="tiny muted">Aplicar: ${esc(x.L.aplico)}</p>` : ''}</div>`).join('') : '<p class="tiny muted">Nenhum registro nesta semana.</p>'}
        ${fld('aprendi', 'O que Deus me ensinou nesta semana', 'Se tivesse que resumir em poucas frases, o que ficou?')}`),
      passo(4, 'O culto de hoje', 5, fld('culto', 'O que mais me marcou no culto', 'Teve relação com algo que você leu na semana?')),
      passo(5, 'Oração pelo caderno', 10, pedidos.length ? pedidos.map((x) => `<div class="prayer"><span class="grow">${esc(x.text)}<span class="tiny muted">desde ${shortDate(x.date)}</span></span><button class="btn-sm" data-act="oracaoRespondida" data-id="${x.id}">Respondida</button></div>`).join('') : '<p class="tiny muted">Nenhum pedido aberto. Anote na página Devocional.</p>'),
      passo(6, 'Versículo da semana', 5, `<p>Escolha um versículo para guardar até o próximo domingo. Ele aparece no topo dos devocionais da semana.</p>
        ${versos.length ? `<div class="hab-chips">${versos.map((v) => `<button class="chip" data-act="anoUsarVerso" data-id="${s}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>` : ''}
        ${fld('versiculo', 'Versículo para guardar', '', 'Ex.: Romanos 8:28')}
        ${D.c ? `<div class="done-note">${ic('check', 16)} Domingo concluído${D.min ? ` · ${D.min} min` : ''}</div>` : `<button class="btn wide" data-act="anoConcluirDom" data-id="${s}">Concluir o domingo · +${XP.devocional} XP</button>`}`),
    ].join('')}</ol>`;
}
