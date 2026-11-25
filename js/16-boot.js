/* ============ casca: login, navegação, transições, modal, eventos, relógio, início ============ */
const NAV = [['inicio', 'Início', 'home'], ['habitos', 'Hábitos', 'habit'], null, ['treino', 'Treino', 'gym'], ['menu', 'Menu', 'grid']];
const NAV_DE = { sessao: 'treino', ano: 'menu', leitura: 'menu', devocional: 'menu', escrita: 'menu', metas: 'menu', conquistas: 'menu', ajustes: 'menu' };
const SUB = ['leitura', 'devocional', 'escrita', 'metas', 'conquistas', 'ajustes'];

/* barra lateral de vidro (computador) */
const SIDE = [['Hoje', [['inicio', 'Início', 'home'], ['habitos', 'Hábitos', 'habit'], ['treino', 'Treino', 'gym']]],
  ['Áreas', [['leitura', 'Leitura', 'book'], ['devocional', 'Devocional', 'cross'], ['escrita', 'Escrita', 'pen']]],
  ['Progresso', [['metas', 'Metas', 'target'], ['conquistas', 'Conquistas', 'trophy']]]];
function sidebar(ativo) {
  const g = game(), nome = cfg().name || 'Você', v = verseOfDay(), tema = S.theme || 'auto';
  const temaIc = tema === 'dark' ? 'moon' : tema === 'light' ? 'sun' : 'auto', temaNome = tema === 'dark' ? 'Escuro' : tema === 'light' ? 'Claro' : 'Automático';
  return `<aside class="side" aria-label="Navegação"><div class="brand">${LOGO(34)}<span class="lbl">${APP}</span>
      <button class="side-tog" data-act="sideTog" aria-label="${S.sideMini ? 'Fixar a barra lateral aberta' : 'Recolher a barra lateral'}" title="${S.sideMini ? 'Fixar aberta' : 'Recolher'}">${ic('side', 18)}</button></div>
    <button class="me" data-act="perfil" aria-label="Seu perfil">${avatarHTML(40, `<i>${g.level.n}</i>`)}
      <span class="grow lbl"><b>${esc(nome.split(' ')[0])}</b><span class="tiny muted">Nível ${g.level.n} · ${g.level.title}</span>${progressBar(g.level.pct, 'gold')}</span></button>
    ${SIDE.map(([t, items]) => `<span class="side-t lbl">${t}</span>${items.map(([pg, n, i]) => `<button class="side-i ${ativo === pg ? 'on' : ''}" data-page="${pg}" ${ativo === pg ? 'aria-current="page"' : ''} title="${n}">${ic(i, 18)}<span class="lbl">${n}</span>${pg === 'inicio' && g.streak ? `<em class="lbl">${ic('flame', 12)}${g.streak}</em>` : ''}</button>`).join('')}`).join('')}
    <button class="side-note" data-page="devocional"><span class="eyebrow">Versículo do dia</span><span class="vtxt">“${esc(v[1])}”</span><b>${esc(v[0])}</b></button>
    <div class="side-foot"><button class="side-i ${ativo === 'ajustes' ? 'on' : ''}" data-page="ajustes" title="Ajustes">${ic('gear', 18)}<span class="lbl">Ajustes</span></button>
      <button class="side-i tema" data-act="temaCiclo" title="Tema: ${temaNome}" aria-label="Tema: ${temaNome}. Trocar">${ic(temaIc, 18)}<span class="lbl">${temaNome}</span></button></div></aside>`;
}

function render() {
  const app = $('#app');
  if (S.auth === 'loading') { app.innerHTML = `<div class="loading">${LOGO(72)}<span>${APP}</span></div>`; return; }
  if (S.auth === 'out') { app.innerHTML = loginView(); return; }
  const view = VIEWS[S.page] || VIEWS.inicio, novo = S.page !== S.lastPage, y = novo ? 0 : scrollY, ativo = NAV_DE[S.page] || S.page, g = game();
  S.lastPage = S.page;
  const nav = NAV.map((n) => n ? `<button class="nav-i ${ativo === n[0] ? 'on' : ''}" data-page="${n[0]}" ${ativo === n[0] ? 'aria-current="page"' : ''}><span class="nav-ic">${ic(n[2])}</span><span class="nav-l">${n[1]}</span></button>`
    : `<button class="nav-plus" data-act="rapido" aria-label="Registrar algo">${ic('plus', 26)}</button>`).join('');
  app.innerHTML = `${!S.online ? '<div class="banner">Sem internet. Os registros ficam guardados e sobem quando voltar.</div>' : ''}
    ${LOCAL && !S.hideLocal ? '<div class="banner">Modo local (servidor não conectado). <button class="link" data-act="ocultarAviso">Ok</button></div>' : ''}
    <div class="shell ${S.sideMini ? 'mini' : ''}">${sidebar(S.page === 'ano' ? 'devocional' : S.page)}<div class="col">
    <header class="appbar"><div class="brand">${LOGO(28)}<span>${APP}</span></div><div class="app-acts"><button class="icon-btn" data-act="temaCiclo" aria-label="Trocar tema claro ou escuro">${ic(S.theme === 'dark' ? 'moon' : S.theme === 'light' ? 'sun' : 'auto', 18)}</button>
      <button class="lvl-chip" data-act="perfil" aria-label="Seu perfil: nível ${g.level.n}, ${g.streak} dias de sequência">${ic('flame', 14)}<b>${g.streak}</b>${avatarHTML(28)}</button></div></header>
    <main class="page pg-${S.page} ${novo ? 'enter' : ''}">${S.page === 'ano' ? `<button class="back" data-page="devocional">${ic('chev', 16)} Devocional</button>` : SUB.includes(S.page) ? `<button class="back" data-page="menu">${ic('chev', 16)} Menu</button>` : ''}${view()}</main></div></div>
    <nav class="nav" aria-label="Abas">${nav}</nav>`;
  scrollTo(0, y);
  if (S.page === 'inicio' && !S.bdayFesta && ehAniversario()) { S.bdayFesta = true; setTimeout(() => confetti(160), 700); }
}

function loginView() {
  const criar = S.authMode === 'criar';
  return `<main class="login enter">${LOGO(88)}<h1>${APP}</h1>
    <p class="muted">Hábitos, treino, leitura, fé e escrita.<br>Um dia de cada vez.</p>
    <form class="card" data-form="login"><label>E-mail<input name="email" type="email" required autocomplete="email"></label>
    <label>Senha<input name="password" type="password" required minlength="6" autocomplete="${criar ? 'new-password' : 'current-password'}"></label>
    <p class="err" role="alert">${esc(S.authErr || '')}</p><button class="btn wide">${criar ? 'Criar conta' : 'Entrar'}</button>
    <div class="row-between"><button type="button" class="link" data-act="trocarLogin">${criar ? 'Já tenho conta' : 'Criar conta'}</button>${criar ? '' : '<button type="button" class="link" data-act="esqueci">Esqueci a senha</button>'}</div></form></main>`;
}

FORMS.login = async (v) => {
  S.authErr = '';
  const fn = S.authMode === 'criar' ? sb.auth.signUp({ email: v.email, password: v.password }) : sb.auth.signInWithPassword({ email: v.email, password: v.password });
  const { data, error } = await fn;
  if (error) { S.authErr = /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message; render(); return; }
  if (!data.session) { S.authErr = 'Conta criada. Confirme pelo link que chegou no seu e-mail e depois entre.'; S.authMode = ''; render(); }
};

/* ---- modal (folha que sobe de baixo) ---- */
function openModal(title, html) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-h"><h2 id="modal-t" class="serif">${esc(title)}</h2><button class="icon-btn" data-act="fechar" aria-label="Fechar">${ic('x')}</button></div><div class="modal-b">${html}</div>`;
  if (!m.open) m.showModal();
  const f = m.querySelector('[autofocus]'); if (f) f.focus();
}
function closeModal() { const m = $('#modal'); if (m.open) m.close(); }

Object.assign(ACT, {
  fechar: closeModal,
  ocultarAviso: () => { S.hideLocal = true; render(); },
  trocarLogin: () => { S.authMode = S.authMode === 'criar' ? '' : 'criar'; S.authErr = ''; render(); },
  esqueci: async () => {
    const email = $('form[data-form="login"] [name=email]').value;
    if (!email) { S.authErr = 'Digite seu e-mail acima primeiro.'; render(); return; }
    await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
    S.authErr = 'Enviamos um link para redefinir a senha.'; render();
  },
  rapido: () => {
    const lendo = books().find((b) => b.status === 'lendo'), tr = store.doc('session/treino');
    const q = (act, id, icon, t, sub) => `<button class="qbtn" ${act.startsWith('#') ? `data-page="${act.slice(1)}"` : `data-act="${act}"`} ${id ? `data-id="${id}"` : ''}>${ic(icon, 24)}<b>${t}</b><span class="tiny muted">${sub}</span></button>`;
    openModal('Registrar', `<div class="quick-grid">
      ${tr ? q('#sessao', '', 'gym', 'Continuar treino', 'em andamento') : q('iniciarTreino', '', 'gym', 'Começar treino', `+${XP.treino} XP`)}
      ${lendo ? q('iniciarLeitura', lendo.id, 'clock', 'Ler agora', 'cronômetro') : q('novoLivro', '', 'book', 'Novo livro', '')}
      ${lendo ? q('registrarLeitura', lendo.id, 'book', 'Páginas lidas', esc(lendo.title)) : ''}
      ${q('novoDevocional', '', 'cross', 'Devocional', `+${XP.devocional} XP`)}${q('novaEntrada', 'prompt', 'pen', 'Escrever', 'pergunta do dia')}
      ${q('#habitos', '', 'habit', 'Hábitos', 'marcar os de hoje')}${q('treinoRapido', '', 'flame', 'Atividade', 'corrida, bike…')}${q('novaMeta', '', 'target', 'Nova meta', `+${XP.meta} XP ao bater`)}</div>`);
  },
});

/* ---- eventos (delegação) ---- */
document.addEventListener('pointerdown', (e) => { S.tap = { x: e.clientX, y: e.clientY }; }, { passive: true });
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]'), p = e.target.closest('[data-page]');
  if (a && ACT[a.dataset.act]) { e.preventDefault(); if (a.disabled) return; ACT[a.dataset.act](a.dataset.id, a); return; }
  if (p) { closeModal(); S.page = p.dataset.page; history.replaceState(null, '', '#' + S.page); render(); }
});
document.addEventListener('change', (e) => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg]) CHG[el.dataset.chg](el); });
document.addEventListener('input', (e) => { const el = e.target.closest('[data-inp]'); if (el && CHG[el.dataset.inp]) CHG[el.dataset.inp](el); });
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]'); if (!f || !FORMS[f.dataset.form]) return;
  e.preventDefault();
  const v = {}; new FormData(f).forEach((val, k) => { v[k] = val; });
  FORMS[f.dataset.form](v, f);
});
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

/* relógio: cronômetros de treino/leitura e descanso, 1× por segundo, sem redesenhar a tela */
setInterval(() => {
  document.querySelectorAll('.tick[data-since]').forEach((el) => { el.textContent = mmss(Date.now() - Number(el.dataset.since)); });
  tickRest();
}, 1000);

/* ---- início ---- */
/* tema: automático, claro ou escuro (preferência deste aparelho) */
function applyTheme(t) { try { t = t ?? localStorage.getItem('dp-theme') ?? 'auto'; localStorage.setItem('dp-theme', t); } catch { t = t || 'auto'; }
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t; S.theme = t; }
ACT.tema = (t) => { applyTheme(t); render(); };
ACT.temaCiclo = () => { const ord = ['auto', 'light', 'dark'], t = ord[(ord.indexOf(S.theme || 'auto') + 1) % 3]; applyTheme(t); render(); toast(`Tema: ${t === 'auto' ? 'automático (segue o aparelho)' : t === 'light' ? 'claro' : 'escuro'}`); };
/* barra lateral recolhida: só ícones; abre ao passar o mouse */
try { S.sideMini = localStorage.getItem('dp-side') === 'mini'; } catch { S.sideMini = false; }
ACT.sideTog = () => { S.sideMini = !S.sideMini; try { localStorage.setItem('dp-side', S.sideMini ? 'mini' : 'full'); } catch { /* sem armazenamento */ } render(); };
applyTheme();

async function boot() {
  const h = location.hash.slice(1); if (VIEWS[h]) S.page = h;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (LOCAL) { S.auth = 'in'; store.load(); render(); celebrate(); return; }
  sb.auth.onAuthStateChange((ev, session) => {
    const was = S.user?.id; S.user = session?.user || null; S.auth = S.user ? 'in' : 'out';
    if (S.user && S.user.id !== was) { store.load(); store.flush(); store.pull(); }
    render();
  });
  const { data } = await sb.auth.getSession();
  if (!data.session) { S.auth = 'out'; render(); }
  if ('serviceWorker' in navigator && 'PushManager' in window) navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => { S.pushOn = !!s; });
}
boot();
