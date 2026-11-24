/* ============ Menu (todas as áreas) e Ajustes ============ */
function menuTiles() {
  const g = game(), b = books().find((x) => x.status === 'lendo'), p = planInfo(), gs = goals(), hit = gs.filter((x) => goalStatus(x).hit).length;
  return [
    ['leitura', 'Leitura', 'book', '#7a4a2a', b ? `${Math.round(((b.page || 0) / b.pages) * 100)}% de ${b.title}` : 'Nenhum livro em andamento'],
    ['devocional', 'Devocional', 'cross', '#b8873a', `${devoStreak()} dias · ${p.lidos}/${p.total} capítulos`],
    ['escrita', 'Escrita', 'pen', '#3d5a80', `${journal().length} entradas · ${escritaStreak()} dias`],
    ['metas', 'Metas', 'target', '#6b4a7a', gs.length ? `${hit} de ${gs.length} batidas agora` : 'Defina sua primeira meta'],
    ['conquistas', 'Conquistas', 'trophy', '#9b2420', `Nível ${g.level.n} · ${g.conq.reduce((a, c) => a + c.tier, 0)} medalhas`],
    ['ajustes', 'Ajustes', 'gear', '#5a5048', 'Metas diárias, missão, lembretes, conta'],
  ];
}
VIEWS.menu = () => `<header class="top"><h1 class="serif">Menu</h1></header>
  <div class="tiles">${menuTiles().map(([pg, nome, icon, cor, sub], i) => `<button class="tile" style="--hc:${cor};--i:${i}" data-page="${pg}"><span class="tile-ic">${ic(icon, 24)}</span><strong class="serif">${nome}</strong><span class="tiny muted">${esc(sub)}</span></button>`).join('')}</div>`;

VIEWS.ajustes = () => {
  const c = cfg(), r = c.remind, pushOk = !LOCAL && VAPID && 'PushManager' in window;
  const chk = (n, v, t) => `<label class="check"><input type="checkbox" name="${n}" ${v ? 'checked' : ''}> ${t}</label>`;
  return `<header class="top"><h1 class="serif">Ajustes</h1></header>
    <form class="card" data-form="metasDia"><span class="eyebrow">Você e suas metas do dia a dia</span>
      <label>Seu nome<input name="name" value="${esc(c.name)}" autocomplete="given-name"></label>
      <div class="grid3"><label>Livros no ano<input name="goalBooks" type="number" min="1" value="${c.goalBooks}"></label>
      <label>Páginas por dia<input name="goalPages" type="number" min="1" value="${c.goalPages}"></label>
      <label>Treinos/semana<input name="goalWorkouts" type="number" min="1" max="14" value="${c.goalWorkouts}"></label></div>
      <label>Descanso entre séries (segundos)<input name="rest" type="number" min="15" max="600" step="15" value="${c.rest}"></label>
      <fieldset><legend>Missão do dia: o que precisa estar feito</legend>${chk('m_habitos', c.missao.habitos, 'Hábitos do dia')}${chk('m_leitura', c.missao.leitura, 'Meta de páginas')}
        ${chk('m_devocional', c.missao.devocional, 'Devocional ou capítulo da Bíblia')}${chk('m_escrita', c.missao.escrita, 'Escrever no diário')}<p class="tiny muted">O treino sempre vale como bônus.</p></fieldset>
      <div class="form-actions"><button class="btn">Salvar</button></div></form>
    <form class="card" data-form="lembretes"><span class="eyebrow">Lembretes</span>
      ${pushOk ? `<p class="tiny muted">${S.pushOn ? 'Notificações ativas neste aparelho.' : 'Ative as notificações neste aparelho para receber os lembretes.'}</p>
        ${S.pushOn ? '' : `<button type="button" class="btn ghost" data-act="ativarPush">${ic('bell', 16)} Ativar notificações</button>`}`
      : `<p class="tiny muted">${LOCAL ? 'Os lembretes chegam depois de conectar o servidor.' : 'Este navegador não recebe notificações. No iPhone, instale o app na tela de início primeiro.'}</p>`}
      <div class="grid2"><label>Devocional<input name="devocional" type="time" value="${esc(r.devocional)}"></label><label>Leitura<input name="leitura" type="time" value="${esc(r.leitura)}"></label>
      <label>Treino<input name="treino" type="time" value="${esc(r.treino)}"></label><label>Escrita<input name="escrita" type="time" value="${esc(r.escrita)}"></label></div>
      ${chk('habitos', r.habitos, 'Avisar no horário de cada hábito')}${chk('resumo', r.resumo, 'Resumo às 22h se a missão não foi cumprida')}
      <p class="tiny muted">Deixe um horário vazio para não receber aquele lembrete. Só avisa se a tarefa ainda não foi feita.</p>
      <div class="form-actions"><button class="btn">Salvar lembretes</button></div></form>
    <section class="card"><span class="eyebrow">Conta</span>
      <p class="muted">${LOCAL ? 'Modo local: os dados ficam só neste aparelho.' : `Conectado como <b>${esc(S.user?.email)}</b>`}${store.outbox.length ? ` · ${store.outbox.length} alteração(ões) aguardando internet` : ''}</p>
      <div class="form-actions start"><button class="btn ghost" data-act="exportar">Baixar backup</button>${LOCAL ? '' : `<button class="btn ghost danger" data-act="sair">${ic('out', 16)} Sair</button>`}</div></section>`;
};

Object.assign(ACT, {
  exportar: () => {
    const blob = new Blob([JSON.stringify(store.docs, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `diario-pessoal-${today()}.json`; a.click();
  },
  sair: async () => { if (!confirm('Sair desta conta neste aparelho?')) return; await sb.auth.signOut(); localStorage.removeItem(store.key()); location.reload(); },
  ativarPush: async () => {
    try {
      if (await Notification.requestPermission() !== 'granted') { toast('Permissão negada nas configurações do navegador'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID) }));
      const { error } = await sb.from('push_subs').upsert({ endpoint: sub.endpoint, sub: sub.toJSON(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
      if (error) throw error;
      S.pushOn = true; render(); toast('Notificações ativadas');
    } catch (e) { console.warn(e); toast('Não foi possível ativar as notificações'); }
  },
});
const b64u = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };

Object.assign(FORMS, {
  metasDia: (v) => {
    store.merge('config/main', { name: v.name.trim(), goalBooks: Number(v.goalBooks), goalPages: Number(v.goalPages), goalWorkouts: Number(v.goalWorkouts), rest: clamp(Number(v.rest) || 90, 15, 600),
      missao: { habitos: !!v.m_habitos, leitura: !!v.m_leitura, devocional: !!v.m_devocional, escrita: !!v.m_escrita } });
    toast('Ajustes salvos');
  },
  lembretes: (v) => { store.merge('config/main', { remind: { leitura: v.leitura, treino: v.treino, devocional: v.devocional, escrita: v.escrita, habitos: !!v.habitos, resumo: !!v.resumo } }); toast('Lembretes salvos'); },
});
