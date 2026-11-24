/* ============ Escrita: diário com humor, gratidão e perguntas guiadas ============ */
const PERGUNTAS = [
  'O que tornaria hoje um ótimo dia?', 'Qual foi a melhor parte do seu dia?', 'O que você aprendeu hoje?', 'Pelo que você é grato agora?',
  'O que está tirando sua paz? O que está ao seu alcance fazer?', 'Que conversa você precisa ter e está adiando?', 'Onde você gastou energia à toa hoje?',
  'Qual hábito mais te ajudou esta semana?', 'O que você faria se não tivesse medo de errar?', 'Quem você pode encorajar amanhã?',
  'Qual decisão você tomou hoje da qual se orgulha?', 'O que você quer lembrar deste mês daqui a um ano?', 'O que está sob seu controle e o que não está?',
  'Descreva um momento simples que te fez bem hoje.', 'Que pensamento repetiu na sua cabeça hoje? Ele é verdade?', 'O que você faria diferente hoje, se pudesse repetir?',
  'Qual meta merece mais atenção amanhã?', 'Que livro, versículo ou frase mexeu com você recentemente? Por quê?', 'Como está seu corpo hoje? E sua mente?',
  'O que você precisa perdoar, em você ou em alguém?', 'Que pequena vitória você pode comemorar hoje?', 'O que você está evitando? Qual o primeiro passo?',
  'Em que área da vida você quer crescer nos próximos 90 dias?', 'Escreva uma carta curta para você daqui a cinco anos.', 'Quais três coisas fariam amanhã valer a pena?',
  'O que te deu energia hoje? O que tirou?', 'Qual foi o momento mais difícil da semana e como você lidou?', 'Que conselho você daria a um amigo na sua situação?',
];
const perguntaDoDia = (iso = today()) => PERGUNTAS[(dayOfYear(iso) * 7 + 3) % PERGUNTAS.length];

function escritaStreak() {
  const set = new Set(journal().map((j) => j.date));
  let d = set.has(today()) ? today() : addDays(today(), -1), n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

VIEWS.escrita = () => {
  const js = journal(), hoje = js.filter((j) => j.date === today()), total = js.reduce((a, j) => a + (j.words || 0), 0);
  const humor = lastDays(14).map((d) => { const m = js.find((j) => j.date === d && j.mood); return `<div class="mood-d" title="${shortDate(d)}">${m ? moodIc(m.mood, 22) : '<i></i>'}<span>${DIAS_C[dow(d)]}</span></div>`; }).join('');
  const porMes = {}; js.slice(0, 20).forEach((j) => { (porMes[j.date.slice(0, 7)] ||= []).push(j); });
  return `<header class="top"><h1 class="serif">Escrita</h1><span class="tag">${ic('flame', 13)} ${escritaStreak()}</span></header>
    <button class="card cta prompt" data-act="novaEntrada" data-id="prompt"><span class="eyebrow">Pergunta do dia</span><strong class="serif lg">${esc(perguntaDoDia())}</strong>
      <span class="tiny muted">${hoje.length ? `Você já escreveu ${hoje.length === 1 ? 'uma vez' : hoje.length + ' vezes'} hoje · escrever de novo` : `Toque para responder · +${XP.diario} XP`}</span></button>
    <div class="quick-grid three"><button class="qbtn" data-act="novaEntrada" data-id="livre">${ic('pen', 22)}<b>Livre</b></button>
      <button class="qbtn" data-act="novaEntrada" data-id="gratidao">${ic('heart', 22)}<b>Gratidão</b></button><button class="qbtn" data-act="novaEntrada" data-id="noite">${ic('sun', 22)}<b>Fim do dia</b></button></div>
    <section class="card"><div class="stats three"><div><b class="serif">${js.length}</b><span>entradas</span></div><div><b class="serif">${fmt(total)}</b><span>palavras</span></div><div><b class="serif">${escritaStreak()}</b><span>dias seguidos</span></div></div>
      <span class="eyebrow">Humor · 14 dias</span><div class="moods">${humor}</div></section>
    ${Object.entries(porMes).map(([k, list]) => `<h3 class="eyebrow sec">${MESES_L[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}</h3><section class="card list">${list.map((j) => `<button class="w-row" data-act="editarEntrada" data-id="${j.id}">
      <div class="w-date serif"><b>${Number(j.date.slice(8))}</b><span>${MESES[Number(j.date.slice(5, 7)) - 1]}</span></div>
      <div class="grow"><strong class="clamp1">${esc(j.prompt || (j.grat?.[0] ? 'Gratidão' : 'Entrada'))}</strong><span class="tiny muted clamp2">${esc(j.text || (j.grat || []).join(' · '))}</span></div>
      ${j.mood ? moodIc(j.mood, 24) : ''}</button>`).join('')}</section>`).join('')}
    ${js.length ? '' : '<div class="card empty"><em class="serif lg">Seu diário começa hoje.</em><p class="muted">Poucas linhas por dia já mudam muito. Ninguém além de você lê.</p></div>'}`;
};

const MODELOS = { livre: ['Entrada livre', ''], prompt: ['Pergunta do dia', null], gratidao: ['Gratidão', 'Três coisas pelas quais sou grato hoje'], noite: ['Fim do dia', 'O que deu certo hoje? O que levo para amanhã?'] };
function formEntrada(j = {}, tipo = 'livre') {
  const prompt = j.prompt ?? (tipo === 'prompt' ? perguntaDoDia() : MODELOS[tipo][1]), grat = j.grat || ['', '', ''], showGrat = tipo === 'gratidao' || (j.grat || []).some(Boolean);
  return `<form data-form="entrada" data-id="${j.id || ''}" data-prompt="${esc(prompt || '')}">
    <fieldset><legend>Como você está?</legend><div class="mood-pick">${MOODS.map((m, i) => `<label class="mp"><input type="radio" name="mood" value="${i + 1}" ${Number(j.mood) === i + 1 ? 'checked' : ''}>${moodIc(i + 1, 38)}<span>${m[0]}</span></label>`).join('')}</div></fieldset>
    ${prompt ? `<p class="serif lg prompt-q">${esc(prompt)}</p>` : ''}
    ${showGrat ? `<fieldset><legend>Sou grato por…</legend>${grat.map((g, i) => `<input name="g${i}" value="${esc(g)}" placeholder="${i + 1}." aria-label="Gratidão ${i + 1}">`).join('')}</fieldset>` : ''}
    <label>${showGrat ? 'Algo mais?' : 'Escreva'}<textarea name="text" rows="${showGrat ? 3 : 8}" data-inp="contaPalavras" placeholder="Escreva sem pressa…">${esc(j.text || '')}</textarea></label>
    <div class="row-between"><span class="tiny muted wc">${words(j.text)} palavras</span><div class="form-actions">${j.id ? `<button type="button" class="btn ghost danger" data-act="apagarEntrada" data-id="${j.id}">${ic('trash', 16)}</button>` : ''}<button class="btn">Salvar</button></div></div></form>`;
}

Object.assign(ACT, {
  novaEntrada: (tipo) => openModal(MODELOS[tipo || 'livre'][0], formEntrada({}, tipo || 'livre')),
  editarEntrada: (id) => { const j = { id, ...store.doc('journal/' + id) }; openModal(longDate(j.date), formEntrada(j)); },
  apagarEntrada: (id) => { if (confirm('Apagar esta entrada?')) { store.del('journal/' + id); closeModal(); } },
});
CHG.contaPalavras = (el) => { const w = el.form.querySelector('.wc'); if (w) w.textContent = `${words(el.value)} palavras`; };

FORMS.entrada = (v, f) => {
  const grat = [v.g0, v.g1, v.g2].filter((x) => x !== undefined).map((x) => x.trim());
  if (!v.text.trim() && !grat.some(Boolean)) { toast('Escreva alguma coisa'); return; }
  const id = f.dataset.id || uid(), novo = !f.dataset.id, old = store.doc('journal/' + id) || { date: today(), time: new Date().toTimeString().slice(0, 5) };
  const txt = v.text.trim(), w = words(txt) + words(grat.join(' '));
  store.set('journal/' + id, { ...old, mood: Number(v.mood) || 0, prompt: f.dataset.prompt || '', text: txt, grat: grat.some(Boolean) ? grat : [], words: w });
  closeModal(); if (novo) { const xp = XP.diario + Math.min(10, Math.floor(w / 50)); floatXP(`+${xp} XP`); toast(`Entrada salva · ${w} palavras · +${xp} XP`); } checkFullDay();
};
