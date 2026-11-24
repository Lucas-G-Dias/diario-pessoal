/* ============ Conquistas: nível, XP por área, recordes, mapa do ano e medalhas ============ */
function heroNivel(g) {
  const L = g.level, ganhas = g.conq.reduce((a, c) => a + c.tier, 0);
  return `<section class="card nivel-hero"><div class="nivel-seal">${ring(L.pct, 'var(--gold)', 132, `<b class="serif">${L.n}</b><small>NÍVEL</small>`)}</div>
    <h2 class="serif">${L.title}</h2><span class="muted">${fmt(g.xp)} XP · faltam ${fmt(L.falta)} para o nível ${L.n + 1}</span>
    <div class="stats three"><div><b class="serif">${ganhas}</b><span>de ${CONQ.length * 4} medalhas</span></div><div><b class="serif">${g.best}</b><span>melhor sequência</span></div>
    <div><b class="serif">${g.shields}</b><span>${g.shields === 1 ? 'escudo' : 'escudos'}</span></div></div></section>`;
}

function xpAreas(g) {
  const ent = Object.entries(g.xpArea).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]), max = Math.max(1, ...ent.map((e) => e[1]));
  if (!ent.length) return '';
  return `<section class="card"><span class="eyebrow">De onde vem seu XP</span>${ent.map(([k, v], i) => { const [nome, icon, cor] = AREAS[k];
    return `<div class="xp-row" style="--i:${i}"><span class="xp-ic" style="color:${cor}">${ic(icon, 18)}</span><span class="grow">${nome}</span><b>${fmt(v)}</b>
      <div class="bar"><i style="width:${(v / max) * 100}%;background:${cor}"></i></div></div>`; }).join('')}</section>`;
}

function recordes(g) {
  const ws = workouts(), maiorVol = ws.reduce((a, w) => ((w.volume || 0) > (a?.volume || 0) ? w : a), null);
  const prs = {}; ws.forEach((w) => (w.ex || []).forEach((x) => doneSets(x).forEach((z) => { const v = e1rm(+z.kg, +z.reps); if (v > (prs[x.id] || 0)) prs[x.id] = v; })));
  const top = Object.entries(prs).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const rows = [['flame', 'Maior sequência', `${g.best} dias`], ['book', 'Mais páginas num dia', `${fmt(g.maxPages)} páginas`],
    maiorVol ? ['gym', 'Treino mais pesado', `${fmt(maiorVol.volume)} kg · ${shortDate(maiorVol.date)}`] : null,
    ...top.map(([id, v]) => ['trophy', exById(id).n, `${fmt(Math.round(v))} kg (1RM est.)`]),
    g.palavras ? ['pen', 'Palavras escritas', fmt(g.palavras)] : null].filter(Boolean);
  return `<section class="card"><span class="eyebrow">Recordes</span>${rows.map(([i, n, v]) => `<div class="pr-row static">${ic(i, 18)}<span class="grow">${esc(n)}</span><b class="serif">${v}</b></div>`).join('')}</section>`;
}

/* mapa do ano: um quadradinho por dia, mais escuro quanto mais áreas você movimentou */
function mapaAno(g) {
  const fim = today(), ini = addDays(fim, -7 * 26 - dow(fim)), cols = [];
  for (let d = ini; d <= fim;) {
    const col = []; for (let i = 0; i < 7; i++, d = addDays(d, 1)) { if (d > fim) { col.push('<i class="void"></i>'); continue; }
      const n = g.act.get(d)?.size || 0, lvl = n === 0 ? (g.saved.has(d) ? 's' : 0) : Math.min(4, n);
      col.push(`<i class="l${lvl}" title="${shortDate(d)}: ${n} ${n === 1 ? 'área' : 'áreas'}${g.saved.has(d) ? ' (escudo usado)' : ''}"></i>`); }
    cols.push(`<div class="hm-col">${col.join('')}</div>`);
  }
  return `<section class="card"><div class="row-between"><span class="eyebrow">Últimos 6 meses</span><span class="hm-leg tiny muted">menos <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> mais</span></div>
    <div class="heatmap">${cols.join('')}</div><span class="tiny muted">${ic('shield', 12)} dias protegidos por escudo aparecem em dourado</span></section>`;
}

function medalhas(g) {
  return `<div class="medals">${g.conq.map((c, i) => `<button class="medal ${c.tier ? 'got' : ''}" style="--i:${i}" data-act="verConquista" data-id="${c.id}">
    ${medalSVG(c.tier, c.icon, 62)}<b>${esc(c.nome)}</b><span class="tiny muted">${c.tier ? TIERS[c.tier - 1] : 'Bloqueada'}</span>
    ${c.next ? `${progressBar(c.pct, 'gold')}<span class="tiny muted">${fmt(c.v)} / ${fmt(c.next)}</span>` : '<span class="tag gold">Completa</span>'}</button>`).join('')}</div>`;
}

VIEWS.conquistas = () => {
  const g = game();
  return `<header class="top"><h1 class="serif">Conquistas</h1></header>${heroNivel(g)}
    <h3 class="eyebrow sec">Medalhas</h3>${medalhas(g)}${xpAreas(g)}${recordes(g)}${mapaAno(g)}
    <section class="card"><span class="eyebrow">Como ganhar XP</span><div class="xp-table">${[['Hábito cumprido', XP.habito], ['Página lida', XP.pagina], ['Livro terminado', XP.livro], ['Citação', XP.citacao],
      ['Treino', XP.treino], ['Recorde pessoal', XP.pr], ['Devocional', XP.devocional], ['Capítulo da Bíblia', XP.capitulo], ['Oração respondida', XP.oracao],
      ['Entrada no diário', `${XP.diario}–${XP.diario + 10}`], ['Missão do dia', XP.diaCompleto], ['Meta batida', XP.meta]].map(([n, v]) => `<span>${n}</span><b>+${v}</b>`).join('')}</div></section>`;
};

ACT.verConquista = (id) => {
  const c = game().conq.find((x) => x.id === id);
  openModal(c.nome, `<div class="tiers">${c.tiers.map((t, i) => `<div class="tier ${c.tier > i ? 'got' : ''}">${medalSVG(c.tier > i ? i + 1 : 0, c.icon, 70)}<b>${TIERS[i]}</b><span class="tiny muted">${fmt(t)} ${esc(c.unit)}</span></div>`).join('')}</div>
    <p class="muted center">Você tem <b>${fmt(c.v)}</b> ${esc(c.unit)}.${c.next ? ` Faltam ${fmt(c.next - c.v)} para ${TIERS[c.tier]}.` : ' Todas as medalhas desta conquista são suas.'}</p>`);
};
