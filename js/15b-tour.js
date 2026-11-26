/* ============ Tour de boas-vindas: um cartão por área, em destaque; dá para ligar/desligar cada área e já ativar os avisos ============
   Aparece uma vez (config/main.tourDone). Em Ajustes: "Ver o tour de novo". */
const TOUR = [
  { k: 'oi', cor: 'var(--brand)', icon: 'sparkle', t: 'Bem-vindo ao Ritmo', d: 'Hábitos, treino, leitura, fé, escrita e saúde num só lugar. Cada coisa que você faz vale XP, mantém sua sequência e desbloqueia medalhas.', b: ['Um dia de cada vez', 'Tudo sincronizado entre celular e computador', 'Você escolhe o que usar'] },
  { k: 'habitos', t: 'Hábitos', d: 'Marque o que fez hoje com um toque. Hábitos podem ter contagem, como 8 copos de água.', b: ['Força do hábito que não zera de uma vez', 'Porcentagem do mês e grade de 4 semanas', 'Lembrete no horário de cada um'] },
  { k: 'treino', t: 'Treino', d: 'Monte fichas e treine com séries, cargas e descanso automático. O app sugere a carga da próxima vez.', b: ['Animação e dica de cada exercício', 'Recordes pessoais e evolução em gráfico', 'Séries por músculo na semana'] },
  { k: 'leitura', t: 'Leitura', d: 'Sua estante com capas. Toque num livro para ler, ligue o cronômetro e registre as páginas.', b: ['Previsão de quando termina o livro', 'Citações guardadas', 'Meta de livros no ano'] },
  { k: 'devocional', t: 'Devocional', d: 'Versículo do dia, devocional guiado e a Bíblia inteira em um ano, de segunda a sábado.', b: ['Domingo de revisão da semana', 'Caderno de oração', 'Progresso dos 66 livros'] },
  { k: 'escrita', t: 'Escrita', d: 'Um diário com pergunta do dia, gratidão e humor. Poucas linhas já fazem diferença.', b: ['Humor dos últimos 14 dias', 'Busca em tudo que você escreveu', 'Só você lê'] },
  { k: 'saude', t: 'Saúde', d: 'Peso, medidas, pressão e exames de sangue, com gráficos que você toca para ver cada ponto.', b: ['IMC e meta de peso', 'Faixas de referência dos exames', 'Evolução de cada marcador'] },
  { k: 'fim', cor: 'var(--brand)', icon: 'bell', t: 'Lembretes na hora certa', d: 'O Ritmo avisa só do que ainda falta: o devocional de manhã, a leitura à noite, cada hábito no horário.', b: ['Você ajusta os horários em Ajustes', 'No iPhone, instale na tela de início primeiro'] },
];

function tourHTML(i) {
  const s = TOUR[i], a = AREAS[s.k], cor = s.cor || a[2], icon = s.icon || a[1], area = !!a && !['habitos'].includes(s.k), on = area ? areaOn(s.k) : true;
  const pushOk = !LOCAL && typeof VAPID !== 'undefined' && VAPID && 'PushManager' in window && !S.pushOn;
  return `<div class="tour-card" style="--hc:${cor}" role="dialog" aria-modal="true" aria-labelledby="tour-t">
    <button class="icon-btn tour-x" data-act="tourFim" aria-label="Pular o tour">${ic('x', 18)}</button>
    <div class="tour-ic">${s.k === 'oi' ? LOGO(84) : ic(icon, 44)}</div>
    <span class="eyebrow">${i === 0 ? 'Começando' : i === TOUR.length - 1 ? 'Último passo' : `Área ${i} de ${TOUR.length - 2}`}</span>
    <h2 id="tour-t">${s.t}</h2><p>${s.d}</p><ul>${s.b.map((x) => `<li>${ic('check', 14)}${x}</li>`).join('')}</ul>
    ${s.k === 'oi' ? `<label class="tour-nome">Como quer ser chamado?<input id="tourNome" value="${esc(cfg().name || '')}" placeholder="Seu nome" autocomplete="given-name"></label>` : ''}
    ${area ? `<label class="tgl tour-tgl"><span>Usar ${s.t.toLowerCase()}</span><input type="checkbox" data-chg="tourArea" data-id="${s.k}" ${on ? 'checked' : ''}><i></i></label>` : ''}
    ${s.k === 'devocional' && on && !anoCfg() ? `<label class="tgl tour-tgl"><span>Ler a Bíblia toda em um ano (começa amanhã)</span><input type="checkbox" id="tourAno"><i></i></label>` : ''}
    ${s.k === 'fim' && pushOk ? `<button class="btn ghost wide" data-act="ativarPush">${ic('bell', 16)} Ativar notificações</button>` : ''}
    <div class="tour-pontos">${TOUR.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="tour-acoes">${i ? `<button class="btn ghost" data-act="tourIr" data-id="${i - 1}">Voltar</button>` : '<span></span>'}
      <button class="btn" data-act="${i === TOUR.length - 1 ? 'tourFim' : 'tourIr'}" data-id="${i + 1}">${i === TOUR.length - 1 ? 'Começar' : 'Continuar'}</button></div></div>`;
}
function tourAbrir(i = 0) {
  let el = $('#tour'); if (!el) { el = document.createElement('div'); el.id = 'tour'; document.body.appendChild(el); }
  el.innerHTML = tourHTML(i); el.className = 'on'; S.tourI = i; const f = el.querySelector('#tourNome') || el.querySelector('.btn:not(.ghost)'); if (f) f.focus();
}
function tourSalvarNome() { const n = $('#tourNome'); if (n && n.value.trim() && n.value.trim() !== cfg().name) store.merge('config/main', { name: n.value.trim() }); }
Object.assign(ACT, {
  tourIr: (i) => { tourSalvarNome(); const ano = $('#tourAno'); if (ano?.checked) FORMS.anoIniciar({ start: addDays(today(), 1) }); tourAbrir(clamp(Number(i), 0, TOUR.length - 1)); haptic(8); },
  tourFim: () => { tourSalvarNome(); const ano = $('#tourAno'); if (ano?.checked) FORMS.anoIniciar({ start: addDays(today(), 1) });
    store.merge('config/main', { tourDone: true }); const el = $('#tour'); if (el) { el.className = ''; setTimeout(() => el.remove(), 300); } confetti(70); },
  verTour: () => tourAbrir(0),
});
CHG.tourArea = (el) => { const c = cfg(); store.set('config/main', { ...(store.doc('config/main') || {}), areas: { ...c.areas, [el.dataset.id]: el.checked } }, true); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#tour.on')) ACT.tourFim(); });
/* abre sozinho na primeira vez (depois do login e da primeira sincronização) */
function tourTalvez() { if (S.auth === 'in' && !cfg().tourDone && !$('#tour') && (LOCAL || store.since)) setTimeout(() => { if (!cfg().tourDone && !$('#tour')) tourAbrir(0); }, 900); }
