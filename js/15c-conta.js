/* ============ Conta: senha nova (link do "Esqueci a senha"), trocar senha e mensagens de erro do login ============
   Os erros do Supabase viram frases em português que não revelam se um e-mail tem conta. */
const ERROS_AUTH = [
  [/invalid login|invalid credentials|not confirmed/i, 'Não foi possível entrar. Confira o e-mail e a senha. Se acabou de criar a conta, confirme pelo link que chegou no seu e-mail.'],
  [/rate limit|too many|429/i, 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'],
  [/should be different|same password/i, 'A senha nova precisa ser diferente da atual.'],
  [/password/i, 'Essa senha é fraca. Use pelo menos 8 caracteres, com letras e números.'],
  [/already registered|already exists/i, 'Não foi possível criar a conta com esse e-mail. Se já tem conta, toque em "Já tenho conta".'],
  [/reauthentic/i, 'Por segurança, saia e entre de novo antes de trocar a senha.'],
  [/failed to fetch|network/i, 'Sem conexão. Confira a internet e tente de novo.'],
];
function erroAuth(error) {
  const msg = String(error?.message || error || ''), achou = ERROS_AUTH.find(([re]) => re.test(msg) || re.test(String(error?.status || '')));
  if (!achou) console.warn('auth', msg);
  return achou ? achou[1] : 'Não foi possível concluir agora. Tente de novo em instantes.';
}

const camposSenha = (outros = true) => `<label>Senha nova<input name="senha" type="password" required minlength="8" autocomplete="new-password" autofocus></label>
  <label>Repita a senha nova<input name="senha2" type="password" required minlength="8" autocomplete="new-password"></label>
  <p class="tiny muted">Pelo menos 8 caracteres, com letras e números.</p>
  <label class="check"><input type="checkbox" name="outros" ${outros ? 'checked' : ''}> Sair dos outros aparelhos (celular, computador) que estiverem conectados</label>
  <p class="err" role="alert"></p>`;

/* tela que aparece quando a pessoa abre o link de redefinir senha */
function novaSenhaView() {
  return `<main class="login enter">${LOGO(72)}<h1>Senha nova</h1><p class="muted">Você abriu o link para redefinir a senha.<br>Crie uma senha nova para continuar.</p>
    <form class="card" data-form="novaSenha">${camposSenha()}<button class="btn wide">Salvar senha nova</button>
    <div class="row-between"><button type="button" class="link" data-act="cancelarRecuperar">Agora não</button></div></form></main>`;
}

FORMS.novaSenha = async (v, f) => {
  const err = f.querySelector('.err'), falha = (t) => { err.textContent = t; };
  if (v.senha !== v.senha2) return falha('As duas senhas não são iguais.');
  if (v.senha.length < 8 || !/[a-z]/i.test(v.senha) || !/\d/.test(v.senha)) return falha('Use pelo menos 8 caracteres, com letras e números.');
  const bt = f.querySelector('.btn'); bt.disabled = true; bt.textContent = 'Salvando…';
  const { error } = await sb.auth.updateUser({ password: v.senha });
  if (error) { bt.disabled = false; bt.textContent = 'Salvar senha nova'; return falha(erroAuth(error)); }
  if (v.outros) await sb.auth.signOut({ scope: 'others' });
  S.recuperar = false; history.replaceState(null, '', location.pathname + '#inicio');
  closeModal(); render(); toast(v.outros ? 'Senha nova salva. Os outros aparelhos foram desconectados.' : 'Senha nova salva.');
};

Object.assign(ACT, {
  trocarSenha: () => openModal('Trocar senha', `<form data-form="novaSenha">${camposSenha()}<div class="form-actions"><button class="btn">Salvar senha nova</button></div></form>`),
  cancelarRecuperar: () => { S.recuperar = false; history.replaceState(null, '', location.pathname + '#inicio'); render(); toast('Você pode trocar a senha depois em Ajustes, Conta.'); },
});
