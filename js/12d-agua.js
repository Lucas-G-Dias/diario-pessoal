/* ============ Água: quanto bebeu no dia, em ml, com botões rápidos, valor personalizado e meta em litros ============
   dietalog/<dia> { ml, goles: [{ ml, h: 'HH:MM' }] } (registros antigos: agua = copos de 250 ml)
   config/dieta   { aguaMl: meta do dia, aguaRapido: [ml, ...] botões que aparecem } (antigo: agua = copos) */
const AGUA_OPCOES = [150, 200, 250, 300, 350, 500, 600, 750, 1000, 1500, 2000];
const AGUA_PADRAO = [200, 300, 500, 1000, 1500];
const aguaMeta = () => { const c = store.doc('config/dieta') || {}; return c.aguaMl || (c.agua ? c.agua * 250 : 2000); };
const aguaRapido = () => (store.doc('config/dieta')?.aguaRapido || AGUA_PADRAO).slice().sort((a, b) => a - b);
const aguaDia = (d) => { const L = store.doc('dietalog/' + d) || {}; return L.ml ?? (L.agua || 0) * 250; };
const litros = (ml) => (ml >= 1000 ? fmt(Math.round(ml / 100) / 10) + ' L' : Math.round(ml) + ' ml');

/* cartão da água (Início e Dieta); na Dieta mostra também os últimos 7 dias */
function aguaCard(semana) {
  const t = today(), ml = aguaDia(t), meta = aguaMeta(), ult = (dietaLog(t).goles || []).slice(-1)[0], ok = ml >= meta;
  const dias = semana ? lastDays(7).map((d) => { const v = aguaDia(d); return `<div class="ag-d ${d === t ? 'hoje' : ''}" title="${shortDate(d)}: ${litros(v)}"><i style="--h:${Math.min(1, v / meta) * 100}%" class="${v >= meta ? 'ok' : ''}"></i><span>${d === t ? "hoje" : DIAS[dow(d)].slice(0, 3)}</span></div>`; }).join('') : '';
  return `<section class="card agua-card ${ok ? 'batida' : ''}"><div class="agua-top">${ring(ml / meta, '#0a84ff', 66, ok ? ic('check', 22) : ic('drop', 22))}
      <div class="grow"><span class="eyebrow">Água hoje</span><b class="agua-v">${litros(ml)} <small>de ${litros(meta)}</small></b>
      <span class="tiny muted">${ok ? 'Meta batida. Boa!' : `Faltam ${litros(meta - ml)}`}${ult ? ` · último: ${litros(ult.ml)} às ${ult.h}` : ''}</span>
      ${ult ? `<button class="link tiny" data-act="aguaDesfazer">Desfazer o último</button>` : ''}</div>
      <button class="icon-btn" data-act="aguaAjustes" aria-label="Meta e botões da água">${ic('gear', 17)}</button></div>
    <div class="agua-bts">${aguaRapido().map((v) => `<button data-act="aguaMais" data-id="${v}" aria-label="Adicionar ${litros(v)}">+ ${litros(v)}</button>`).join('')}
      <button class="outro" data-act="aguaOutro">${ic('plus', 14)} Outro</button></div>
    ${semana ? `<div class="ag-semana" aria-label="Água nos últimos 7 dias">${dias}</div>` : ''}</section>`;
}

function aguaSomar(delta) {
  const t = today(), L = dietaLog(t), antes = aguaDia(t), meta = aguaMeta(), agora = new Date();
  const goles = [...(L.goles || []), { ml: delta, h: `${pad(agora.getHours())}:${pad(agora.getMinutes())}` }];
  const { agua, ...resto } = L; store.set('dietalog/' + t, { ...resto, ml: antes + delta, goles });
  if (antes < meta && antes + delta >= meta) { confetti(50); toast(`Meta de água batida: ${litros(antes + delta)}!`); } else { haptic(8); toast(`+ ${litros(delta)} · ${litros(antes + delta)} hoje`); }
}

Object.assign(ACT, {
  aguaMais: (v) => aguaSomar(Number(v)),
  aguaDesfazer: () => {
    const t = today(), L = dietaLog(t), g = [...(L.goles || [])], ult = g.pop(); if (!ult) return;
    store.set('dietalog/' + t, { ...L, ml: Math.max(0, aguaDia(t) - ult.ml), goles: g }); toast(`Tirei ${litros(ult.ml)}`);
  },
  aguaOutro: () => openModal('Quanto você bebeu?', `<form data-form="aguaOutro"><div class="grid2"><label>Quantidade<input name="qtd" type="text" inputmode="decimal" pattern="[0-9]+([.,][0-9]+)?" required autofocus autocomplete="off" placeholder="Ex.: 400"></label>
    <fieldset><legend>Medida</legend><div class="seg">${[['ml', 'ml'], ['L', 'litros']].map(([k, n], i) => `<label class="seg-op"><input type="radio" name="un" value="${k}" ${i ? '' : 'checked'}><span>${n}</span></label>`).join('')}</div></fieldset></div>
    <div class="form-actions"><button class="btn">Adicionar</button></div></form>`),
  aguaAjustes: () => {
    const sel = new Set(aguaRapido());
    openModal('Água', `<form data-form="aguaAjustes"><label>Meta por dia (litros)<input name="meta" type="text" inputmode="decimal" pattern="[0-9]+([.,][0-9]+)?" required autocomplete="off" value="${fmt(aguaMeta() / 1000)}"></label>
      <fieldset><legend>Botões rápidos</legend><div class="ag-opcoes">${AGUA_OPCOES.map((v) => `<label class="chip-op"><input type="checkbox" name="b${v}" ${sel.has(v) ? 'checked' : ''}><span>${litros(v)}</span></label>`).join('')}</div></fieldset>
      <p class="tiny muted">Escolha de 1 a 6 botões. Para outra quantidade, use "Outro".</p><div class="form-actions"><button class="btn">Salvar</button></div></form>`);
  },
});
FORMS.aguaOutro = (v) => {
  const n = Number(String(v.qtd).replace(',', '.')), ml = Math.round(v.un === 'L' ? n * 1000 : n);
  if (!(ml >= 10 && ml <= 5000)) { toast('Use entre 10 ml e 5 litros'); return; }
  closeModal(); aguaSomar(ml);
};
FORMS.aguaAjustes = (v) => {
  const bts = AGUA_OPCOES.filter((x) => v['b' + x]), meta = Math.round(clamp(Number(String(v.meta).replace(',', '.')) || 2, 0.5, 8) * 1000);
  if (!bts.length || bts.length > 6) { toast('Escolha de 1 a 6 botões'); return; }
  const c = store.doc('config/dieta') || { ...dietaCfg(), desde: today() }, { agua, ...resto } = c;
  store.set('config/dieta', { ...resto, aguaMl: meta, aguaRapido: bts }); closeModal(); toast(`Meta de água: ${litros(meta)} por dia`);
};
