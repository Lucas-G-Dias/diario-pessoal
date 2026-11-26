/* ============ Menu (todas as áreas), Perfil e Ajustes ============ */
/* perfil: nome, aniversário e frase em config/main; foto (já reduzida) em config/foto */
const foto = () => store.doc('config/foto')?.data || '';
function avatarHTML(size = 40, extra = '') {
  const f = foto(), nome = cfg().name || 'Você';
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${size * 0.42}px">${f ? `<img src="${f}" alt="">` : esc(nome[0].toUpperCase())}${extra}</span>`;
}
const idade = (b) => { if (!b) return null; const t = today(); let a = Number(t.slice(0, 4)) - Number(b.slice(0, 4)); if (t.slice(5) < b.slice(5)) a--; return a; };
const ehAniversario = () => { const b = cfg().birth; return !!b && b.slice(5) === today().slice(5); };
function diasProAniversario() { const b = cfg().birth; if (!b) return null; let d = today().slice(0, 4) + b.slice(4); if (d < today()) d = (Number(d.slice(0, 4)) + 1) + d.slice(4); return Math.round((new Date(d + 'T12:00') - new Date(today() + 'T12:00')) / 864e5); }

function perfilHTML() {
  const c = cfg(), g = game(), ida = idade(c.birth), falta = diasProAniversario();
  return `<form data-form="perfil" class="perfil"><div class="perfil-foto">${avatarHTML(104)}<label class="foto-btn">${ic('camera', 16)} ${foto() ? 'Trocar foto' : 'Pôr foto'}<input type="file" accept="image/*" data-chg="fotoPerfil" hidden></label>
      ${foto() ? '<button type="button" class="link muted-l" data-act="tirarFoto">Remover foto</button>' : ''}</div>
    <div class="perfil-nivel"><b>Nível ${g.level.n} · ${g.level.title}</b><span class="tiny muted">${fmt(g.xp)} XP · ${g.streak} dias de sequência${ida !== null ? ` · ${ida} anos` : ''}</span></div>
    <label>Nome<input name="name" value="${esc(c.name)}" autocomplete="name" placeholder="Como quer ser chamado"></label>
    <label>Data de nascimento<input name="birth" type="date" value="${esc(c.birth || '')}" max="${today()}"></label>
    ${falta !== null ? `<p class="tiny muted">${falta === 0 ? 'Hoje é o seu aniversário!' : `Faltam ${falta} ${falta === 1 ? 'dia' : 'dias'} para o seu aniversário.`}</p>` : ''}
    <label>Sua frase<input name="lema" value="${esc(c.lema || '')}" maxlength="80" placeholder="Ex.: Um dia de cada vez."></label>
    <div class="form-actions"><button type="button" class="btn ghost" data-page="conquistas">Ver conquistas</button><button class="btn">Salvar</button></div></form>`;
}

/* reduz a foto para 320 px (JPEG) antes de guardar */
function reduzFoto(file) {
  return new Promise((ok, erro) => { const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const L = 320, k = Math.max(img.width, img.height) / L, w = Math.round(img.width / Math.max(1, k)), h = Math.round(img.height / Math.max(1, k)), cv = document.createElement('canvas');
      const lado = Math.min(w, h); cv.width = cv.height = Math.min(L, lado); const x = cv.getContext('2d'), s = Math.min(img.width, img.height);
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); ok(cv.toDataURL('image/jpeg', 0.85)); };
    img.onerror = erro; img.src = url; });
}
CHG.fotoPerfil = async (el) => {
  const f = el.files && el.files[0]; if (!f) return;
  try { const data = await reduzFoto(f); store.set('config/foto', { data }, true); openModal('Seu perfil', perfilHTML()); render(); toast('Foto atualizada'); }
  catch { toast('Não deu para abrir essa imagem'); }
};
Object.assign(ACT, {
  perfil: () => openModal('Seu perfil', perfilHTML()),
  tirarFoto: () => { store.del('config/foto'); openModal('Seu perfil', perfilHTML()); },
});
FORMS.perfil = (v) => { store.merge('config/main', { name: v.name.trim(), birth: v.birth || '', lema: v.lema.trim() }); closeModal(); toast('Perfil salvo'); if (ehAniversario()) confetti(); };

function menuTiles() {
  const g = game(), b = books().find((x) => x.status === 'lendo'), p = planInfo(), gs = goals(), hit = gs.filter((x) => goalStatus(x).hit).length;
  return [
    ['leitura', 'Leitura', 'book', '#ff9f0a', b ? `${Math.round(((b.page || 0) / b.pages) * 100)}% de ${b.title}` : 'Nenhum livro em andamento'],
    ['devocional', 'Devocional', 'cross', '#5e5ce6', `${devoStreak()} dias · ${p.lidos}/${p.total} capítulos`],
    ['escrita', 'Escrita', 'pen', '#0a84ff', `${journal().length} entradas · ${escritaStreak()} dias`],
    ['dieta', 'Dieta', 'food', '#a2845e', (() => { if (!store.doc('config/dieta')) return 'Plano de refeições e água'; const a = adesaoDia(today()); return `${a ? Math.round(a.pct * 100) + '% hoje' : 'Hoje sem marcar'} · ${dietaStreak()} dias seguidos`; })()],
    ['saude', 'Saúde', 'pulse', '#30b0c7', (() => { const p = ultimo('peso'), e = exames()[0]; return [p ? `${fmt(p.v)} kg` : 'Peso e medidas', e ? `exame em ${shortDate(e.date)}` : 'exames de sangue'].join(' · '); })()],
    ['semana', 'Resumo da semana', 'chart', '#ff5a1f', store.doc('semana/' + addDays(segundaDe(today()), [0, 6].includes(dow(today())) ? 0 : -7))?.c ? 'Revisão feita' : 'Números, destaques e revisão'],
    ['metas', 'Metas', 'target', '#bf5af2', gs.length ? `${hit} de ${gs.length} batidas agora` : 'Defina sua primeira meta'],
    ['conquistas', 'Conquistas', 'trophy', '#ff5a1f', `Nível ${g.level.n} · ${g.conq.reduce((a, c) => a + c.tier, 0)} medalhas`],
    ['ajustes', 'Ajustes', 'gear', '#8e8e93', 'Perfil, personalizar, lembretes, conta'],
  ].filter(([pg]) => !['leitura', 'devocional', 'escrita', 'saude', 'dieta'].includes(pg) || areaOn(pg));
}
VIEWS.menu = () => `<header class="top"><h1 class="serif">Menu</h1></header>
  <div class="tiles">${menuTiles().map(([pg, nome, icon, cor, sub], i) => `<button class="tile" style="--hc:${cor};--i:${i}" data-page="${pg}"><span class="tile-ic">${ic(icon, 24)}</span><strong class="serif">${nome}</strong><span class="tiny muted">${esc(sub)}</span></button>`).join('')}</div>`;

VIEWS.ajustes = () => {
  const c = cfg(), r = c.remind, pushOk = !LOCAL && VAPID && 'PushManager' in window;
  const chk = (n, v, t) => `<label class="check"><input type="checkbox" name="${n}" ${v ? 'checked' : ''}> ${t}</label>`;
  return `<header class="top"><h1 class="serif">Ajustes</h1></header>
    <button class="card perfil-row" data-act="perfil">${avatarHTML(56)}<span class="grow"><b class="lg">${esc(c.name || 'Seu perfil')}</b><span class="tiny muted">${c.lema ? esc(c.lema) : 'Foto, nome, aniversário e frase'}</span></span>${ic('chev', 16)}</button>
    <form class="card" data-form="metasDia"><span class="eyebrow">Você e suas metas do dia a dia</span>
      <div class="grid3"><label>Livros no ano<input name="goalBooks" type="number" min="1" value="${c.goalBooks}"></label>
      <label>Páginas por dia<input name="goalPages" type="number" min="1" value="${c.goalPages}"></label>
      <label>Treinos/semana<input name="goalWorkouts" type="number" min="1" max="14" value="${c.goalWorkouts}"></label></div>
      <label>Descanso entre séries (segundos)<input name="rest" type="number" min="15" max="600" step="15" value="${c.rest}"></label>
      <fieldset><legend>Missão do dia: o que precisa estar feito</legend>${chk('m_habitos', c.missao.habitos, 'Hábitos do dia')}${chk('m_leitura', c.missao.leitura, 'Meta de páginas')}
        ${chk('m_devocional', c.missao.devocional, 'Devocional ou capítulo da Bíblia')}${chk('m_escrita', c.missao.escrita, 'Escrever no diário')}${chk('m_dieta', c.missao.dieta, 'Seguir a dieta (80% das refeições)')}<p class="tiny muted">O treino sempre vale como bônus.</p></fieldset>
      <div class="form-actions"><button class="btn">Salvar</button></div></form>
    <form class="card" data-form="lembretes"><span class="eyebrow">Lembretes</span>
      ${pushOk ? `<p class="tiny muted">${S.pushOn ? 'Notificações ativas neste aparelho.' : 'Ative as notificações neste aparelho para receber os lembretes.'}</p>
        ${S.pushOn ? '' : `<button type="button" class="btn ghost" data-act="ativarPush">${ic('bell', 16)} Ativar notificações</button>`}`
      : `<p class="tiny muted">${LOCAL ? 'Os lembretes chegam depois de conectar o servidor.' : 'Este navegador não recebe notificações. No iPhone, instale o app na tela de início primeiro.'}</p>`}
      <div class="grid2"><label>Devocional<input name="devocional" type="time" value="${esc(r.devocional)}"></label><label>Leitura<input name="leitura" type="time" value="${esc(r.leitura)}"></label>
      <label>Treino<input name="treino" type="time" value="${esc(r.treino)}"></label><label>Escrita<input name="escrita" type="time" value="${esc(r.escrita)}"></label></div>
      ${chk('habitos', r.habitos, 'Avisar no horário de cada hábito')}${chk('resumo', r.resumo, 'Resumo às 22h se a missão não foi cumprida')}${chk('semana', r.semana !== false, 'Resumo da semana no domingo às 20h')}${chk('dieta', r.dieta !== false, 'Avisar no horário de cada refeição')}
      <p class="tiny muted">Deixe um horário vazio para não receber aquele lembrete. Só avisa se a tarefa ainda não foi feita.</p>
      <div class="form-actions"><button class="btn">Salvar lembretes</button></div></form>
    <form class="card" data-form="personalizar"><span class="eyebrow">Personalizar</span>
      <fieldset><legend>Cor de destaque</legend><div class="accents">${Object.entries(ACCENTS).map(([k, [nome, a, b]]) => `<label class="accent" style="--a:${a};--b:${b}"><input type="radio" name="accent" value="${k}" ${c.accent === k ? 'checked' : ''}><span></span><small>${nome}</small></label>`).join('')}</div></fieldset>
      <fieldset><legend>Tamanho do texto</legend><div class="seg">${[['normal', 'Normal'], ['grande', 'Grande'], ['maior', 'Maior']].map(([k, n]) => `<label class="seg-op"><input type="radio" name="fonte" value="${k}" ${c.fonte === k ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>Áreas que você usa</legend><p class="tiny muted">Áreas desligadas somem do menu, da barra e da missão. Os registros continuam guardados.</p>
        <div class="toggles">${[['leitura', 'Leitura', 'book'], ['treino', 'Treino', 'gym'], ['devocional', 'Devocional', 'cross'], ['escrita', 'Escrita', 'pen'], ['dieta', 'Dieta', 'food'], ['saude', 'Saúde', 'pulse']].map(([k, n, i]) => `<label class="tgl">${ic(i, 18)}<span>${n}</span><input type="checkbox" name="a_${k}" ${c.areas[k] ? 'checked' : ''}><i></i></label>`).join('')}</div></fieldset>
      <fieldset><legend>Cartões do Início</legend><div class="toggles">${[['kpis', 'Números da semana'], ['seq', 'Sequência e nível'], ['missao', 'Missão do dia'], ['dieta', 'Refeições de hoje'], ['lendo', 'Livro que estou lendo'], ['metas', 'Metas'], ['verso', 'Versículo do dia']].map(([k, n]) => `<label class="tgl"><span>${n}</span><input type="checkbox" name="i_${k}" ${c.inicio[k] ? 'checked' : ''}><i></i></label>`).join('')}</div></fieldset>
      <div class="form-actions"><button class="btn">Salvar</button></div></form>
    <section class="card"><span class="eyebrow">Aparência</span><div class="seg" role="group" aria-label="Tema">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([k, n]) => `<button class="${(S.theme || 'auto') === k ? 'on' : ''}" data-act="tema" data-id="${k}" aria-pressed="${(S.theme || 'auto') === k}">${n}</button>`).join('')}</div></section>
    <section class="card"><span class="eyebrow">Recomeçar</span><p class="tiny muted">Apaga os registros de uma área para começar do zero. Seu perfil e seus ajustes continuam. Baixe um backup antes, se quiser guardar.</p>
      <div class="reset-grid">${Object.entries(RESET).map(([k, [nome, icon]]) => `<button class="qbtn row" data-act="resetar" data-id="${k}">${ic(icon, 18)}<b>${nome}</b><span class="tiny muted">${contarArea(k)}</span></button>`).join('')}</div>
      <button class="btn ghost danger wide" data-act="resetar" data-id="tudo">${ic('trash', 16)} Apagar tudo e recomeçar</button></section>
    <section class="card"><span class="eyebrow">Conta</span>
      <p class="muted">${LOCAL ? 'Modo local: os dados ficam só neste aparelho.' : `Conectado como <b>${esc(S.user?.email)}</b>`}${store.outbox.length ? ` · ${store.outbox.length} alteração(ões) aguardando internet` : ''}</p>
      <div class="form-actions start"><button class="btn ghost" data-act="verTour">Ver o tour de novo</button><button class="btn ghost" data-act="exportar">Baixar backup</button><label class="btn ghost">Restaurar backup<input type="file" accept="application/json,.json" data-chg="restaurar" hidden></label>${LOCAL ? '' : `<button class="btn ghost danger" data-act="sair">${ic('out', 16)} Sair</button>`}</div></section>`;
};

const ACCENTS = { brasa: ['Brasa', '#ffa21f', '#ff5a1f'], oceano: ['Oceano', '#5ac8fa', '#0a84ff'], floresta: ['Floresta', '#a8e063', '#30b158'],
  lavanda: ['Lavanda', '#bf5af2', '#5e5ce6'], rosa: ['Rosa', '#ff8fab', '#ff375f'], grafite: ['Grafite', '#8e8e93', '#3a3a3c'] };
FORMS.personalizar = (v) => {
  store.merge('config/main', { accent: v.accent || 'brasa', fonte: v.fonte || 'normal',
    areas: Object.fromEntries(['leitura', 'treino', 'devocional', 'escrita', 'saude', 'dieta'].map((k) => [k, !!v['a_' + k]])),
    inicio: Object.fromEntries(['kpis', 'seq', 'missao', 'dieta', 'lendo', 'metas', 'verso'].map((k) => [k, !!v['i_' + k]])) });
  toast('Do seu jeito. Salvo!');
};

/* o que cada "recomeçar" apaga */
const RESET = {
  leitura: ['Leitura', 'book', ['books', 'covers', 'quotes', 'reading', 'session/leitura']],
  habitos: ['Hábitos', 'habit', ['habits', 'habitlog']],
  treino: ['Treino', 'gym', ['workouts', 'routines', 'exercises', 'session/treino']],
  devocional: ['Devocional', 'cross', ['devos', 'bible/main', 'prayers', 'plano/ano', 'anolog', 'anodom', 'session/ano']],
  escrita: ['Escrita', 'pen', ['journal']],
  metas: ['Metas e revisões', 'target', ['goals', 'semana']],
  saude: ['Saúde', 'pulse', ['medidas', 'exames']],
  dieta: ['Dieta', 'food', ['dietalog', 'config/dieta']],
};
function contarArea(k) {
  const pre = RESET[k][2]; let n = 0;
  for (const [p, d] of Object.entries(store.docs)) if (!d.deleted && pre.some((x) => p === x || p.startsWith(x + '/'))) n++;
  return n ? `${n} ${n === 1 ? 'registro' : 'registros'}` : 'vazio';
}
ACT.resetar = (k) => {
  if (k === 'tudo') {
    const r = prompt('Isto apaga TODOS os seus registros (hábitos, treinos, leituras, devocionais, escrita e metas). Seu perfil continua.\n\nPara confirmar, digite APAGAR:');
    if ((r || '').trim().toUpperCase() !== 'APAGAR') { toast('Nada foi apagado'); return; }
    store.delPrefixes([...Object.values(RESET).flatMap((x) => x[2]), 'config/seen']);
  } else {
    if (!confirm(`Apagar todos os registros de ${RESET[k][0]}? Isso não pode ser desfeito.`)) return;
    store.delPrefixes([...RESET[k][2], 'config/seen']);
  }
  S.prevGame = null; render(); celebrate(); toast(k === 'tudo' ? 'Tudo apagado. Bom recomeço!' : `${RESET[k][0]} recomeçou do zero`);
};

Object.assign(ACT, {
  exportar: () => {
    const blob = new Blob([JSON.stringify(store.docs, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ritmo-backup-${today()}.json`; a.click();
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
    store.merge('config/main', { goalBooks: Number(v.goalBooks), goalPages: Number(v.goalPages), goalWorkouts: Number(v.goalWorkouts), rest: clamp(Number(v.rest) || 90, 15, 600),
      missao: { habitos: !!v.m_habitos, leitura: !!v.m_leitura, devocional: !!v.m_devocional, escrita: !!v.m_escrita, dieta: !!v.m_dieta } });
    toast('Ajustes salvos');
  },
  lembretes: (v) => { store.merge('config/main', { remind: { leitura: v.leitura, treino: v.treino, devocional: v.devocional, escrita: v.escrita, habitos: !!v.habitos, resumo: !!v.resumo, semana: !!v.semana, dieta: !!v.dieta } }); toast('Lembretes salvos'); },
});
