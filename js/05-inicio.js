/* ============ Início: o painel do dia ============ */
const AREA_PAGE = { habitos: 'habitos', leitura: 'leitura', devocional: 'devocional', escrita: 'escrita', treino: 'treino' };

function heroCard(g) {
  const L = g.level, esc3 = Array.from({ length: 3 }, (_, i) => `<span class="shield ${i < g.shields ? 'on' : ''}" title="Escudo">${ic('shield', 15)}</span>`).join('');
  return `<section class="card hero">
    <div class="selo ${g.streak ? 'lit' : ''}" aria-label="${g.streak} dias seguidos"><b>${g.streak}</b><small>${g.streak === 1 ? 'DIA' : 'DIAS'}</small></div>
    <div class="hero-info"><span class="eyebrow">Sequência</span><em class="serif lg">${g.streak ? plural(g.streak, 'dia seguido', 'dias seguidos') : 'Comece hoje a sua sequência'}</em>
      <div class="shields" aria-label="${g.shields} de 3 escudos">${esc3}<span class="tiny muted">${g.shields ? 'protegem a sequência se um dia falhar' : 'ganhe 1 escudo a cada 7 dias seguidos'}</span></div>
      <button class="lvl" data-page="conquistas" aria-label="Nível ${L.n}, ver conquistas"><span>Nível ${L.n} · <em>${L.title}</em></span><span class="muted">${fmt(g.xp)} XP</span></button>
      ${progressBar(L.pct, 'gold')}<span class="tiny muted">faltam ${fmt(L.falta)} XP para o nível ${L.n + 1}</span></div></section>`;
}

function missionCard() {
  const m = mission(), rings = m.items.map((i) => { const [nome, icon, cor] = AREAS[i.k];
    return `<button class="mring ${i.ok ? 'ok' : ''} ${i.opt ? 'opt' : ''}" data-page="${AREA_PAGE[i.k]}" aria-label="${esc(i.label)}: ${Math.round(i.prog * 100)}%">
      ${ring(i.prog, cor, 58, i.ok ? ic('check', 20) : ic(icon, 20))}<span>${nome}</span></button>`; }).join('');
  return `<section class="card"><div class="row-between"><div><span class="eyebrow">Missão do dia</span>
    <em class="serif lg">${m.complete ? 'Dia cumprido. Bom trabalho.' : 'O que falta hoje'}</em></div><span class="pct serif">${m.pct}%</span></div>
    <div class="mrings">${rings}</div>${habitChips()}</section>`;
}

function habitChips() {
  const hs = habits().filter((h) => habitDueOn(h, today())), log = habitsDone(today());
  if (!hs.length) return '';
  return `<div class="hab-chips">${hs.map((h) => { const t = h.target || 1, v = hVal(h, log), ok = v >= t;
    return `<button class="chip ${ok ? 'on' : ''}" style="--hc:${h.color || 'var(--green)'}" data-act="marcarHabito" data-id="${h.id}" aria-pressed="${ok}" aria-label="${esc(h.name)}${t > 1 ? `, ${v} de ${t}` : ''}">
      ${ok ? ic('check', 14) : t > 1 ? `<b>${v}/${t}</b>` : ''}${esc(h.name)}</button>`; }).join('')}</div>`;
}

/* treino ou leitura em andamento */
function liveBanner() {
  const t = store.doc('session/treino'), r = store.doc('session/leitura'), out = [];
  if (t) out.push(`<button class="live" data-page="sessao">${ic('gym', 18)}<span>Treino em andamento</span><b class="tick" data-since="${t.start}">${mmss(Date.now() - t.start)}</b>${ic('chev', 16)}</button>`);
  if (r) { const b = store.doc('books/' + r.bookId); out.push(`<button class="live" data-act="pararLeitura">${ic('book', 18)}<span>Lendo ${esc(b?.title || '')}</span><b class="tick" data-since="${r.start}">${mmss(Date.now() - r.start)}</b>${ic('stop', 16)}</button>`); }
  return out.join('');
}

function verseCard() {
  const v = verseOfDay();
  return `<button class="card verse" data-page="devocional"><span class="eyebrow">Versículo do dia</span>
    <blockquote class="serif">“${esc(v[1])}”</blockquote><span class="ref">${esc(v[0])}</span></button>`;
}

function metasMini() {
  const gs = goals(); if (!gs.length) return '';
  const rows = gs.slice(0, 3).map((g) => { const st = goalStatus(g), k = KINDS[g.kind] || KINDS.manual;
    return `<div class="mini-goal"><div class="row-between"><span>${esc(goalTitle(g))} <span class="muted tiny-i">${PERIODOS[g.period]}</span></span><b class="${st.hit ? 'green-t' : ''}">${fmt(st.v)}${k.pct ? '%' : ''}/${fmt(g.target)}${k.pct ? '%' : ''}</b></div>${progressBar(st.pct, st.hit ? 'green' : 'gold')}</div>`; }).join('');
  return `<section class="card"><div class="row-between"><span class="eyebrow">Metas</span><button class="link" data-page="metas">Ver todas</button></div>${rows}</section>`;
}

function lendoMini() {
  const b = books().find((x) => x.status === 'lendo');
  if (!b) return `<button class="card empty-card" data-act="novoLivro"><span class="eyebrow">Lendo agora</span><strong>Nenhum livro em andamento</strong><span class="muted">Toque para começar um</span></button>`;
  const pct = b.pages ? (b.page || 0) / b.pages : 0, sess = store.doc('session/leitura');
  return `<section class="card lendo">${bookCover(b, 'md')}
    <div class="lendo-info"><span class="eyebrow red">Lendo agora</span><h2 class="serif">${esc(b.title)}</h2><em class="muted">${esc(b.author)}</em>
    <div class="row-between"><span class="big serif">${Math.round(pct * 100)}%</span><span class="tiny muted">${etaTxt(b)}</span></div>${progressBar(pct)}
    <div class="lendo-btns">${sess ? '' : `<button class="btn-sm" data-act="iniciarLeitura" data-id="${b.id}">${ic('play', 14)} Ler agora</button>`}
      <button class="btn-sm ghost" data-act="registrarLeitura" data-id="${b.id}">Registrar páginas</button></div></div></section>`;
}

/* números da semana com minigráfico de 14 dias e comparação com a semana anterior */
function kpis() {
  const dias = lastDays(14), read = bibleRead(), devDias = new Set([...devos().map((d) => d.date), ...Object.values(read)]);
  const habDia = (d) => { const hs = habits().filter((h) => habitDueOn(h, d)), log = habitsDone(d); return hs.length ? (hs.filter((h) => hDone(h, log)).length / hs.length) * 100 : 0; };
  const serie = { habitos: dias.map(habDia), leitura: dias.map(readingOn), treino: dias.map((d) => workouts().filter((w) => w.date === d).length), devocional: dias.map((d) => (devDias.has(d) ? 1 : 0)) };
  const soma = (a) => a.reduce((x, y) => x + y, 0), media = (a) => soma(a) / a.length;
  const cards = [['habitos', 'Hábitos', (a) => Math.round(media(a)), '%', '/habitos'], ['leitura', 'Páginas', soma, '', '/leitura'],
    ['treino', 'Treinos', soma, '', '/treino'], ['devocional', 'Devocional', soma, ' dias', '/devocional']].filter(([k]) => k === 'habitos' || areaOn(k));
  return `<div class="kpis">${cards.map(([k, nome, fn, suf, pg], i) => { const v = fn(serie[k].slice(7)), a = fn(serie[k].slice(0, 7)), d = v - a, cor = AREAS[k][2];
    return `<button class="card kpi" style="--hc:${cor};--i:${i}" data-page="${pg.slice(1)}"><span class="kpi-h"><span class="kpi-ic">${ic(AREAS[k][1], 15)}</span>${nome}</span>
      <b class="kpi-v">${fmt(v)}<small>${suf}</small></b><span class="kpi-d ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d ? (d > 0 ? '↑ ' : '↓ ') + fmt(Math.abs(d)) : '='} <span class="muted">vs. 7 dias antes</span></span>
      ${sparkline(serie[k], cor)}</button>`; }).join('')}</div>`;
}

VIEWS.inicio = () => {
  const g = game(), nome = cfg().name, ini = cfg().inicio;
  const m = mission();
  return `<header class="top"><div><span class="eyebrow">${longDate(today())}</span><h1>${greeting()}${nome ? ', <span class="grad-t">' + esc(nome.split(' ')[0]) + '</span>' : ''}</h1>
    <p class="sub muted">${m.complete ? 'Missão de hoje cumprida. Aproveite o descanso.' : `Faltam ${m.items.filter((i) => !i.opt && !i.ok).length} itens da missão de hoje · ${g.streak} dias de sequência`}</p></div></header>
    ${ehAniversario() ? `<section class="card bday">${ic('cake', 30)}<div><span class="eyebrow">Hoje é o seu dia</span><strong class="lg">Feliz aniversário${nome ? ', ' + esc(nome.split(' ')[0]) : ''}!</strong><span class="tiny">${idade(cfg().birth)} anos. Que este novo ano seja de constância e graça.</span></div></section>` : ''}${liveBanner()}${proximosCard()}${atalhos()}${ini.kpis ? kpis() : ''}${ini.seq ? heroCard(g) : ''}${ini.missao ? missionCard() : ''}${ini.lendo && areaOn('leitura') ? lendoMini() : ''}${ini.metas ? metasMini() : ''}${ini.verso && areaOn('devocional') ? verseCard() : ''}`;
};
