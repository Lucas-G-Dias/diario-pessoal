/* ============ Início: "Próximos passos" (o que fazer agora, com um toque) e atalhos para todas as áreas ============ */
function proximosPassos() {
  const t = today(), c = cfg(), out = [], add = (k, icon, cor, titulo, sub, act, id, page) => out.push({ k, icon, cor, titulo, sub, act, id, page });
  // hábitos de hoje que faltam
  const log = habitsDone(t), falta = habits().filter((h) => habitDueOn(h, t) && !hDone(h, log));
  if (falta.length) add('habitos', 'habit', AREAS.habitos[2], falta.length === 1 ? `Falta 1 hábito: ${falta[0].name}` : `Faltam ${falta.length} hábitos`, falta.slice(0, 3).map((h) => esc(h.name)).join(' · '), '', '', 'habitos');
  // devocional
  if (areaOn('devocional') && !devoOn(t)) {
    const ano = store.doc('bible/main')?.plan === 'ano' && anoCfg(), i = ano ? anoIdxOn(t) : -1;
    if (ano && dow(t) === 0 && !store.doc('anodom/' + t)?.c) add('devocional', 'cross', AREAS.devocional[2], 'Domingo de revisão', 'Semana, culto e oração', 'anoDomingo', t);
    else if (ano && i >= 0) add('devocional', 'cross', AREAS.devocional[2], `Devocional: ${anoRefs(i)}`, `${psLabel(psOf(i))} · ${pvLabel(pvOf(t))}`, 'anoAbrir', i);
    else if (ano && t < anoCfg().start) add('devocional', 'cross', AREAS.devocional[2], 'Devocional livre de hoje', `A Bíblia em um ano começa ${anoCfg().start === addDays(t, 1) ? 'amanhã' : 'em ' + shortDate(anoCfg().start)}`, 'novoDevocional');
    else if (!ano) add('devocional', 'cross', AREAS.devocional[2], 'Fazer o devocional', verseOfDay()[0] + ' é o versículo de hoje', 'novoDevocional');
  }
  // leitura
  const b = books().find((x) => x.status === 'lendo'), lidas = readingOn(t);
  if (areaOn('leitura') && b && lidas < c.goalPages && !store.doc('session/leitura')) add('leitura', 'book', AREAS.leitura[2], `Ler ${c.goalPages - lidas} páginas`, esc(b.title) + ' · toque para ligar o cronômetro', 'iniciarLeitura', b.id);
  if (areaOn('leitura') && !b) add('leitura', 'book', AREAS.leitura[2], 'Escolher um livro para ler', 'Abra a estante e toque no livro', '', '', 'leitura');
  // treino: sugere a ficha usada há mais tempo
  if (areaOn('treino') && !store.doc('session/treino') && !workouts().some((w) => w.date === t)) {
    const sem = workouts().filter((w) => w.date >= addDays(t, -6)).length;
    if (sem < c.goalWorkouts) { const rs = routines(), ult = (r) => workouts().find((w) => w.routineId === r.id)?.date || '0', prox = [...rs].sort((x, y) => ult(x).localeCompare(ult(y)))[0];
      add('treino', 'gym', AREAS.treino[2], prox ? `Treinar: ${prox.name}` : 'Treinar hoje', `${sem} de ${c.goalWorkouts} treinos na semana`, prox ? 'iniciarTreino' : '', prox?.id || '', prox ? '' : 'treino'); }
  }
  if (areaOn('escrita') && c.missao.escrita && !journalOn(t)) add('escrita', 'pen', AREAS.escrita[2], 'Escrever no diário', esc(perguntaDoDia()), 'novaEntrada', 'prompt');
  // dieta: refeição da hora sem marcar
  const rf = areaOn('dieta') && store.doc('config/dieta') && !cfg().inicio.dieta ? proximaRefeicao() : null;
  if (rf) add('dieta', 'food', AREAS.dieta[2], `${rf.nome} às ${rf.hora}`, 'Marque como foi: no plano, fora ou pulei', '', '', 'dieta');
  if (areaOn('dieta') && !store.doc('config/dieta')) add('dieta', 'food', AREAS.dieta[2], 'Montar seu plano de refeições', 'Horários de cada refeição, para marcar no dia', 'refNova');
  // saúde: peso há mais de 7 dias
  const p = areaOn('saude') ? ultimo('peso') : null;
  if (areaOn('saude') && (!p || p.d < addDays(t, -7))) add('saude', 'pulse', AREAS.saude[2], 'Registrar o peso', p ? `Último em ${shortDate(p.d)}: ${fmt(p.v)} kg` : 'Comece a acompanhar sua evolução', 'novaMedida');
  // revisão da semana (sábado, domingo e segunda)
  const seg = [0, 6].includes(dow(t)) ? segundaDe(t) : addDays(segundaDe(t), -7);
  if ([0, 1, 6].includes(dow(t)) && !store.doc('semana/' + seg)?.c) add('semana', 'chart', 'var(--brand)', 'Revisar a semana', 'O que funcionou, o que ajustar e o foco', '', '', 'semana');
  return out;
}

function proximosCard() {
  const ps = proximosPassos(), foco = focoDaSemana();
  if (!ps.length) return `<section class="card prox done-all">${ic('check', 22)}<div><strong class="lg">Tudo em dia por hoje</strong><span class="tiny muted">Aproveite. Amanhã tem mais.</span></div></section>`;
  return `<section class="card prox"><div class="row-between"><span class="eyebrow">Próximos passos</span><span class="tiny muted">${ps.length} ${ps.length === 1 ? 'item' : 'itens'}</span></div>
    ${foco ? `<p class="foco">${ic('target', 14)} Foco da semana: <b>${esc(foco)}</b></p>` : ''}
    ${ps.slice(0, 5).map((x, i) => `<button class="passo-i" style="--hc:${x.cor};--i:${i}" ${x.act ? `data-act="${x.act}" data-id="${esc(String(x.id ?? ''))}"` : `data-page="${x.page}"`}>
      <span class="passo-ic">${ic(x.icon, 18)}</span><span class="grow"><b>${esc(x.titulo)}</b><span class="tiny muted">${x.sub}</span></span>${ic('chev', 16)}</button>`).join('')}</section>`;
}

/* atalhos para todas as áreas (carrossel no celular) */
function atalhos() {
  const it = [['habitos', 'Hábitos', 'habit'], ['treino', 'Treino', 'gym'], ['leitura', 'Leitura', 'book'], ['devocional', 'Devocional', 'cross'], ['escrita', 'Escrita', 'pen'],
    ['dieta', 'Dieta', 'food'], ['saude', 'Saúde', 'pulse'], ['metas', 'Metas', 'target'], ['semana', 'Semana', 'chart'], ['conquistas', 'Conquistas', 'trophy']]
    .filter(([k]) => !['treino', 'leitura', 'devocional', 'escrita', 'saude', 'dieta'].includes(k) || areaOn(k));
  return `<nav class="atalhos" aria-label="Áreas">${it.map(([k, n, i]) => `<button data-page="${k}" style="--hc:${(AREAS[k] || AREAS.bonus)[2]}"><span>${ic(i, 20)}</span>${n}</button>`).join('')}</nav>`;
}
