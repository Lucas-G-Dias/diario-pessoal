/* ============ casca: login, navegação, modal, eventos, início ============ */
const NAV = [['inicio', 'Início', 'home'], ['leitura', 'Leitura', 'book'], null, ['habitos', 'Hábitos', 'habit'], ['treino', 'Treino', 'gym']];

function render() {
  const app = $('#app');
  if (S.auth === 'loading') { app.innerHTML = '<div class="loading serif">Abrindo o diário…</div>'; return; }
  if (S.auth === 'out') { app.innerHTML = loginView(); return; }
  const view = VIEWS[S.page] || VIEWS.inicio, y = scrollY;
  const nav = NAV.map((n) => n ? `<button class="nav-i ${S.page === n[0] ? 'on' : ''}" data-page="${n[0]}" ${S.page === n[0] ? 'aria-current="page"' : ''}><span class="nav-ic">${ic(n[2])}</span>${n[1]}</button>`
    : `<button class="nav-plus" data-act="rapido" aria-label="Registrar algo">${ic('plus', 26)}</button>`).join('');
  app.innerHTML = `${!S.online ? '<div class="banner">Sem internet. Os registros ficam guardados e sobem quando voltar.</div>' : ''}
    ${LOCAL && !S.hideLocal ? '<div class="banner">Modo local (servidor ainda não conectado). <button class="link" data-act="ocultarAviso">Ok</button></div>' : ''}
    <main class="page"><button class="gear" data-page="ajustes" aria-label="Ajustes e conquistas">${ic('gear')}</button>${view()}</main><nav class="nav">${nav}</nav>`;
  scrollTo(0, y);
}

function loginView() {
  const criar = S.authMode === 'criar';
  return `<main class="login"><div class="login-seal">${ic('book', 34)}</div><h1 class="serif">Diário Pessoal</h1>
    <em class="muted">Leitura, hábitos e treino. Um dia de cada vez.</em>
    <form class="card" data-form="login"><label>E-mail<input name="email" type="email" required autocomplete="email"></label>
    <label>Senha<input name="password" type="password" required minlength="6" autocomplete="${criar ? 'new-password' : 'current-password'}"></label>
    <p class="err" role="alert">${esc(S.authErr || '')}</p>
    <button class="btn wide">${criar ? 'Criar conta' : 'Entrar'}</button>
    <div class="row-between"><button type="button" class="link" data-act="trocarLogin">${criar ? 'Já tenho conta' : 'Criar conta'}</button>${criar ? '' : '<button type="button" class="link" data-act="esqueci">Esqueci a senha</button>'}</div></form></main>`;
}

FORMS.login = async (v) => {
  S.authErr = '';
  const fn = S.authMode === 'criar' ? sb.auth.signUp({ email: v.email, password: v.password }) : sb.auth.signInWithPassword({ email: v.email, password: v.password });
  const { data, error } = await fn;
  if (error) { S.authErr = /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message; render(); return; }
  if (!data.session) { S.authErr = 'Conta criada. Confirme pelo link que chegou no seu e-mail e depois entre.'; S.authMode = ''; render(); }
};

/* ---- modal ---- */
function openModal(title, html) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-h"><h2 id="modal-t" class="serif">${esc(title)}</h2><button class="icon-btn" data-act="fechar" aria-label="Fechar">${ic('x')}</button></div>${html}`;
  if (!m.open) m.showModal(); const f = m.querySelector('[autofocus],input'); if (f) f.focus();
}
function closeModal() { $('#modal').close(); }

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
    const lendo = books().find((b) => b.status === 'lendo');
    openModal('Registrar', `<div class="quick-grid">
      ${lendo ? `<button class="qbtn" data-act="registrarLeitura" data-id="${lendo.id}">${ic('book', 26)}<b>Páginas lidas</b><span class="tiny muted">${esc(lendo.title)}</span></button>` : `<button class="qbtn" data-act="novoLivro">${ic('book', 26)}<b>Novo livro</b></button>`}
      <button class="qbtn" data-act="novoTreino">${ic('gym', 26)}<b>Treino</b><span class="tiny muted">+${XP.treino} XP</span></button>
      <button class="qbtn" data-page="habitos">${ic('habit', 26)}<b>Hábitos</b><span class="tiny muted">marcar os de hoje</span></button>
      <button class="qbtn" data-act="novoHabito">${ic('plus', 26)}<b>Novo hábito</b></button></div>`);
  },
});

/* ---- eventos (delegação) ---- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]'), p = e.target.closest('[data-page]');
  if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a.dataset.id, a); return; }
  if (p) { if ($('#modal').open) closeModal(); S.page = p.dataset.page; history.replaceState(null, '', '#' + S.page); render(); scrollTo(0, 0); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[role=button][data-act]')) e.target.click(); });
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]'); if (!f || !FORMS[f.dataset.form]) return;
  e.preventDefault();
  const v = {}; new FormData(f).forEach((val, k) => { v[k] = val; });
  FORMS[f.dataset.form](v, f);
});
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

/* ---- início ---- */
async function boot() {
  const h = location.hash.slice(1); if (VIEWS[h]) S.page = h;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (LOCAL) { S.auth = 'in'; store.load(); render(); return; }
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
