/* ============ Ajustes: metas, lembretes, conquistas, conta ============ */
VIEWS.ajustes = () => {
  const c = cfg(), g = game(), r = c.remind;
  const pushOk = !LOCAL && VAPID && 'PushManager' in window;
  const medal = (m) => `<div class="medal ${m.got ? 'got' : ''}" title="${esc(m.desc)}"><span class="mseal">${ic(m.got ? 'trophy' : 'star', 18)}</span><b>${esc(m.nome)}</b><span class="tiny muted">${esc(m.desc)}</span></div>`;
  return `<header class="top"><h1 class="serif">Ajustes</h1><em class="muted">Nível ${g.level.n} · ${g.level.title}</em></header>
    <section class="card"><span class="eyebrow">Conquistas · ${g.medals.filter((m) => m.got).length} de ${g.medals.length}</span><div class="medals">${g.medals.map(medal).join('')}</div></section>
    <form class="card" data-form="metas"><span class="eyebrow">Metas</span>
      <label>Seu nome<input name="name" value="${esc(c.name)}" autocomplete="given-name"></label>
      <div class="grid3"><label>Livros no ano<input name="goalBooks" type="number" min="1" value="${c.goalBooks}"></label>
      <label>Páginas por dia<input name="goalPages" type="number" min="1" value="${c.goalPages}"></label>
      <label>Treinos/semana<input name="goalWorkouts" type="number" min="1" max="14" value="${c.goalWorkouts}"></label></div>
      <div class="form-actions"><button class="btn">Salvar metas</button></div></form>
    <form class="card" data-form="lembretes"><span class="eyebrow">Lembretes</span>
      ${pushOk ? `<p class="tiny muted">${S.pushOn ? 'Notificações ativas neste aparelho.' : 'Ative as notificações neste aparelho para receber os lembretes.'}</p>
        ${S.pushOn ? '' : `<button type="button" class="btn ghost" data-act="ativarPush">${ic('bell', 16)} Ativar notificações</button>`}`
      : `<p class="tiny muted">${LOCAL ? 'Os lembretes chegam depois de conectar o servidor (Supabase). Por enquanto os horários ficam salvos.' : 'Este navegador não recebe notificações. No iPhone, instale o app na tela de início primeiro.'}</p>`}
      <div class="grid2"><label>Lembrete de leitura<input name="leitura" type="time" value="${esc(r.leitura)}"></label>
      <label>Lembrete de treino<input name="treino" type="time" value="${esc(r.treino)}"></label></div>
      <label class="check"><input type="checkbox" name="habitos" ${r.habitos ? 'checked' : ''}> Avisar no horário de cada hábito</label>
      <label class="check"><input type="checkbox" name="resumo" ${r.resumo ? 'checked' : ''}> Resumo da noite (22h) se a missão não foi cumprida</label>
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
  metas: (v) => { store.merge('config/main', { name: v.name.trim(), goalBooks: Number(v.goalBooks), goalPages: Number(v.goalPages), goalWorkouts: Number(v.goalWorkouts) }); toast('Metas salvas'); },
  lembretes: (v) => { store.merge('config/main', { remind: { leitura: v.leitura, treino: v.treino, habitos: !!v.habitos, resumo: !!v.resumo } }); toast('Lembretes salvos'); },
});
