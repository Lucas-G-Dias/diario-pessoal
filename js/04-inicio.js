/* ============ Início ============ */
const VIEWS = {};

function bookCover(b, size = '') {
  const c = b.color || SPINES[0];
  return `<div class="cover ${size} ${lightSpine(c) ? 'light' : ''}" style="--c:${c}"><span class="cover-t">${esc(b.title)}</span><span class="cover-a">${esc((b.author || '').split(' ').pop())}</span></div>`;
}
const progressBar = (pct, cls = '') => `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${clamp(pct, 0, 1) * 100}%"></i></div>`;

function cardLendo() {
  const b = books().find((x) => x.status === 'lendo');
  if (!b) return `<button class="card empty-card" data-act="novoLivro"><span class="eyebrow">Lendo agora</span><strong>Nenhum livro em andamento</strong><span class="muted">Toque para começar um</span></button>`;
  const pct = b.pages ? (b.page || 0) / b.pages : 0;
  return `<section class="card lendo" data-act="registrarLeitura" data-id="${b.id}" role="button" tabindex="0" aria-label="Registrar leitura de ${esc(b.title)}">
    ${bookCover(b)}
    <div class="lendo-info"><span class="eyebrow red">Lendo agora</span><h2 class="serif">${esc(b.title)}</h2><em class="muted">${esc(b.author)}</em>
    <div class="big serif">${Math.round(pct * 100)}%</div>${progressBar(pct)}<span class="tiny muted">pág. ${fmt(b.page || 0)} de ${fmt(b.pages)} · toque para registrar</span></div></section>`;
}

function cardSelo(g) {
  const L = g.level, hoje = readingOn(today());
  return `<section class="card selo-card">
    <div class="selo" aria-label="${g.streak} dias seguidos"><b>${g.streak}</b><small>${g.streak === 1 ? 'DIA' : 'DIAS'}</small></div>
    <div class="selo-info"><span class="eyebrow">Sequência</span><em class="serif lg">${g.streak ? plural(g.streak, 'dia seguido', 'dias seguidos') : 'Comece hoje a sua sequência'}</em>
      <div class="stats"><div><b>${hoje || '—'}</b><span>páginas hoje</span></div><div><b>${g.best}</b><span>melhor sequência</span></div></div>
      <div class="nivel"><span>Nível ${L.n} · <em>${L.title}</em></span><span class="muted">${fmt(g.xp)} XP</span></div>${progressBar(L.pct, 'gold')}
      <span class="tiny muted">faltam ${fmt(L.falta)} XP para o nível ${L.n + 1}</span></div></section>`;
}

function cardMissao() {
  const m = mission(), hs = habits().filter((h) => habitDueOn(h, today())), done = habitsDone(today());
  const lis = m.items.map((i) => `<li class="${i.ok ? 'ok' : ''}"><span class="chk">${i.ok ? ic('check', 14) : ''}</span>${esc(i.label)}${i.opt ? ' <span class="tiny muted">(bônus)</span>' : ''}</li>`).join('');
  const hab = hs.length ? `<div class="hab-chips">${hs.map((h) => `<button class="chip ${done[h.id] ? 'on' : ''}" data-act="marcarHabito" data-id="${h.id}" aria-pressed="${!!done[h.id]}" aria-label="${done[h.id] ? 'Desmarcar' : 'Marcar'} hábito ${esc(h.name)}">${done[h.id] ? ic('check', 14) : ''}${esc(h.name)}</button>`).join('')}</div>` : '';
  return `<section class="card"><div class="row-between"><div><span class="eyebrow">Missão do dia</span><em class="serif lg">${m.complete ? 'Dia cumprido. Bom trabalho.' : 'O que falta hoje'}</em></div><span class="pct serif">${m.pct}%</span></div>
    <ul class="mission">${lis}</ul>${hab}</section>`;
}

function cardTreinoSemana() {
  const days = lastDays(7), ws = workouts(), c = cfg();
  const n = ws.filter((w) => days.includes(w.date)).length;
  return `<section class="card"><div class="row-between"><div><span class="eyebrow">Treino · 7 dias</span><em class="serif lg">${n} de ${c.goalWorkouts} treinos</em></div><button class="link" data-page="treino">Ver treinos</button></div>
    <div class="week">${days.map((d) => `<div class="wd ${ws.some((w) => w.date === d) ? 'on' : ''} ${d === today() ? 'today' : ''}"><span>${DIAS_C[dow(d)]}</span><i></i></div>`).join('')}</div></section>`;
}

function cardEstante() {
  const c = cfg(), y = today().slice(0, 4), lidos = books().filter((b) => b.status === 'lido' && (b.finished || '').startsWith(y));
  let pagesYear = 0; for (const [p, d] of Object.entries(store.docs)) if (!d.deleted && p.startsWith('reading/' + y)) pagesYear += d.data.pages || 0;
  const slots = Math.max(c.goalBooks, lidos.length), per = 10, rows = [];
  for (let r = 0; r < Math.ceil(slots / per); r++) {
    const cells = [];
    for (let i = r * per; i < Math.min(slots, (r + 1) * per); i++) {
      const b = lidos[i];
      cells.push(b ? `<span class="spine ${lightSpine(b.color) ? 'light' : ''}" style="--c:${b.color};--h:${80 + (b.pages || 300) % 30}%"><span>${esc(b.title)}</span></span>` : '<span class="spine slot"></span>');
    }
    rows.push(`<div class="shelf">${cells.join('')}</div>`);
  }
  return `<section class="card"><div class="row-between"><div><span class="eyebrow">Estante de ${y}</span><div class="serif xl">${lidos.length} <em class="muted-i">de ${c.goalBooks} livros</em></div></div>
    <div class="right"><div class="serif xl red">${fmt(pagesYear)}</div><span class="tiny muted">páginas no ano</span></div></div>${rows.join('')}
    <div class="row-between foot"><em class="tiny muted">${previsao(lidos.length, c.goalBooks)}</em><button class="link" data-page="leitura">Ver estante</button></div></section>`;
}

function previsao(lidos, meta) {
  const d = new Date(), inicio = new Date(d.getFullYear(), 0, 1), dias = Math.max(1, Math.round((d - inicio) / 864e5));
  if (dias < 14 || !lidos) return 'Previsão aparece depois de 14 dias de registros e do primeiro livro terminado.';
  const prev = Math.round(lidos / dias * 365);
  return prev >= meta ? `No ritmo atual, você fecha o ano com ~${prev} livros. Meta batida.` : `No ritmo atual, ~${prev} livros no ano. Faltam ${meta - prev} para a meta.`;
}

VIEWS.inicio = () => {
  const g = game();
  return `<header class="top"><h1 class="serif">Início</h1><em class="muted">${longDate(today())}</em></header>
    ${cardLendo()}${cardSelo(g)}${cardMissao()}${cardTreinoSemana()}${cardEstante()}`;
};
