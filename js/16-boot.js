/* ============ casca: login, navegação, transições, modal, eventos, relógio, início ============ */
const NAV = [['inicio', 'Início', 'home'], ['habitos', 'Hábitos', 'habit'], null, ['treino', 'Treino', 'gym'], ['menu', 'Menu', 'grid']];
const NAV_DE = { sessao: 'treino', leitura: 'menu', devocional: 'menu', escrita: 'menu', metas: 'menu', conquistas: 'menu', ajustes: 'menu' };
const SUB = ['leitura', 'devocional', 'escrita', 'metas', 'conquistas', 'ajustes'];

function render() {
  const app = $('#app');
  if (S.auth === 'loading') { app.innerHTML = '<div class="loading serif"><div class="selo lit pulse"><b>·</b></div>Abrindo o diário…</div>'; return; }
  if (S.auth === 'out') { app.innerHTML = loginView(); return; }
  const view = VIEWS[S.page] || VIEWS.inicio, novo = S.page !== S.lastPage, y = novo ? 0 : scrollY, ativo = NAV_DE[S.page] || S.page;
  S.lastPage = S.page;
  const nav = NAV.map((n) => n ? `<button class="nav-i ${ativo === n[0] ? 'on' : ''}" data-page="${n[0]}" ${ativo === n[0] ? 'aria-current="page"' : ''}><span class="nav-ic">${ic(n[2])}</span>${n[1]}</button>`
    : `<button class="nav-plus" data-act="rapido" aria-label="Registrar algo">${ic('plus', 26)}</button>`).join('');
  app.innerHTML = `${!S.online ? '<div class="banner">Sem internet. Os registros ficam guardados e sobem quando voltar.</div>' : ''}
    ${LOCAL && !S.hideLocal ? '<div class="banner">Modo local (servidor não conectado). <button class="link" data-act="ocultarAviso">Ok</button></div>' : ''}
    <main class="page ${novo ? 'enter' : ''}">${SUB.includes(S.page) ? `<button class="back" data-page="menu">${ic('chev', 16)} Menu</button>` : ''}${view()}</main><nav class="nav">${nav}</nav>`;
  scrollTo(0, y);
}

function loginView() {
  const criar = S.authMode === 'criar';
  return `<main class="login enter"><div class="selo lit"><b>${ic('book', 34)}</b></div><h1 class="serif">Diário Pessoal</h1>
    <em class="muted">Hábitos, treino, leitura, fé e escrita. Um dia de cada vez.</em>
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
