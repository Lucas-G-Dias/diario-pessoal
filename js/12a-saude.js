/* ============ Saúde: peso, medidas, pressão e exames de sangue, com gráfico interativo ============
   medidas/<id> { date, peso, gordura, cintura, quadril, peito, braco, coxa, pas, pad, fc }
   exames/<id>  { date, lab, itens: { <marcador>: valor }, extras: [{ n, u, v }], notas }   ·   config/main.altura (cm), metaPeso (kg) */
const MEDIDAS = { peso: ['Peso', 'kg'], gordura: ['Gordura corporal', '%'], cintura: ['Cintura', 'cm'], quadril: ['Quadril', 'cm'], peito: ['Peito', 'cm'],
  braco: ['Braço', 'cm'], coxa: ['Coxa', 'cm'], pas: ['Pressão (máxima)', 'mmHg'], pad: ['Pressão (mínima)', 'mmHg'], fc: ['Frequência em repouso', 'bpm'] };
/* referências gerais para adultos; cada laboratório tem as suas */
const EXAMES = {
  glicose: ['Glicose em jejum', 'mg/dL', 70, 99], hba1c: ['Hemoglobina glicada', '%', 4, 5.6], insulina: ['Insulina em jejum', 'µUI/mL', 2.6, 24.9],
  colesterol: ['Colesterol total', 'mg/dL', null, 190], ldl: ['LDL', 'mg/dL', null, 130], hdl: ['HDL', 'mg/dL', 40, null], trig: ['Triglicerídeos', 'mg/dL', null, 150],
  hemoglobina: ['Hemoglobina', 'g/dL', 13.5, 17.5], ferritina: ['Ferritina', 'ng/mL', 30, 300], vitd: ['Vitamina D', 'ng/mL', 30, 100], b12: ['Vitamina B12', 'pg/mL', 200, 900],
  tsh: ['TSH', 'µUI/mL', 0.4, 4.5], creatinina: ['Creatinina', 'mg/dL', 0.7, 1.3], tgo: ['TGO (AST)', 'U/L', null, 40], tgp: ['TGP (ALT)', 'U/L', null, 41],
  acido_urico: ['Ácido úrico', 'mg/dL', 3.5, 7.2], pcr: ['PCR', 'mg/L', null, 3], testosterona: ['Testosterona total', 'ng/dL', 264, 916],
};
const medidas = () => store.col('medidas').sort((a, b) => b.date.localeCompare(a.date));
const exames = () => store.col('exames').sort((a, b) => b.date.localeCompare(a.date));
const serie = (k) => medidas().filter((m) => m[k] !== undefined && m[k] !== '').map((m) => ({ d: m.date, v: +m[k] }));
const ultimo = (k) => serie(k)[0];
const statusEx = (k, v) => { const [, , lo, hi] = EXAMES[k] || []; if (lo != null && v < lo) return 'baixo'; if (hi != null && v > hi) return 'alto'; return 'ok'; };
const faixaTxt = (k) => { const [, u, lo, hi] = EXAMES[k]; return lo != null && hi != null ? `${fmt(lo)}–${fmt(hi)} ${u}` : lo != null ? `acima de ${fmt(lo)} ${u}` : `até ${fmt(hi)} ${u}`; };
const PERIODOS_S = [['1m', '1 mês', 31], ['3m', '3 meses', 92], ['6m', '6 meses', 183], ['1a', '1 ano', 366], ['tudo', 'Tudo', 99999]];
const noPeriodo = (pts) => { const dias = (PERIODOS_S.find((p) => p[0] === (S.saudePer || '3m')) || PERIODOS_S[1])[2], ini = addDays(today(), -dias); return pts.filter((p) => p.d >= ini); };

function corpoHero() {
  const c = cfg(), p = ultimo('peso'), ant = serie('peso').find((x) => x.d <= addDays(today(), -28)), imc = p && c.altura ? p.v / Math.pow(c.altura / 100, 2) : null;
  const imcTxt = imc ? (imc < 18.5 ? 'abaixo do peso' : imc < 25 ? 'faixa saudável' : imc < 30 ? 'sobrepeso' : 'obesidade') : '';
  const meta = c.metaPeso && p ? `<div class="mini-goal"><div class="row-between"><span>Meta: ${fmt(c.metaPeso)} kg</span><b>faltam ${fmt(Math.abs(Math.round((p.v - c.metaPeso) * 10) / 10))} kg</b></div></div>` : '';
  return `<section class="card saude-hero"><div class="stats three"><div><b>${p ? fmt(p.v) + ' kg' : '—'}</b><span>${p ? 'peso em ' + shortDate(p.d) : 'sem registro de peso'}</span></div>
      <div><b class="${ant && p ? (p.v < ant.v ? 'up' : p.v > ant.v ? 'down' : '') : ''}">${ant && p ? (p.v - ant.v > 0 ? '+' : '') + fmt(Math.round((p.v - ant.v) * 10) / 10) + ' kg' : '—'}</b><span>em 30 dias</span></div>
      <div><b>${imc ? fmt(Math.round(imc * 10) / 10) : '—'}</b><span>${imc ? 'IMC · ' + imcTxt : c.altura ? 'IMC' : 'IMC (informe a altura)'}</span></div></div>${meta}
    <div class="row-gap"><button class="btn" data-act="novaMedida">${ic('plus', 14)} Registrar medidas</button><button class="btn ghost" data-act="saudeAjustes">Altura e meta</button></div></section>`;
}

function corpoGrafico() {
  const k = S.saudeMetrica || 'peso', [nome, u] = MEDIDAS[k], pts = noPeriodo(serie(k)), c = cfg();
  const chips = Object.entries(MEDIDAS).filter(([kk]) => kk === 'peso' || serie(kk).length).map(([kk, [n]]) => `<button class="chip ${kk === k ? 'on' : ''}" data-act="saudeMetrica" data-id="${kk}">${n}</button>`).join('');
  return `<section class="card"><div class="row-between"><span class="eyebrow">${nome} · toque nos pontos</span></div><div class="hab-chips">${chips}</div>
    <div class="seg per">${PERIODOS_S.map(([pk, pn]) => `<button class="${(S.saudePer || '3m') === pk ? 'on' : ''}" data-act="saudePer" data-id="${pk}">${pn}</button>`).join('')}</div>
    ${lineChart(pts, { cor: '#30b0c7', unid: ' ' + u, alvo: k === 'peso' ? c.metaPeso : null, faixa: k === 'pas' ? [90, 120] : k === 'pad' ? [60, 80] : null })}</section>`;
}

function examesView() {
  const xs = exames(), ult = {}; [...xs].reverse().forEach((x) => Object.entries(x.itens || {}).forEach(([k, v]) => { if (v !== '' && v != null) ult[k] = { v: +v, d: x.date }; }));
  const marc = Object.entries(ult).filter(([k]) => EXAMES[k]), fora = marc.filter(([k, x]) => statusEx(k, x.v) !== 'ok');
  return `<section class="card"><div class="row-between"><span class="eyebrow">Seus exames</span><button class="btn-sm" data-act="novoExame">${ic('plus', 14)} Exame</button></div>
      ${xs.length ? xs.map((x) => { const n = Object.keys(x.itens || {}).length, al = Object.entries(x.itens || {}).filter(([k, v]) => EXAMES[k] && statusEx(k, +v) !== 'ok').length;
        return `<button class="w-row" data-act="verExame" data-id="${x.id}"><div class="w-date"><b>${Number(x.date.slice(8))}</b><span>${MESES[Number(x.date.slice(5, 7)) - 1]} ${x.date.slice(2, 4)}</span></div><div class="grow"><strong>${esc(x.lab || 'Exame de sangue')}</strong><span class="tiny muted">${n} ${n === 1 ? 'marcador' : 'marcadores'}</span></div>${al ? `<span class="tag warn">${al} fora da faixa</span>` : `<span class="tag ok">${ic('check', 12)} na faixa</span>`}${ic('chev', 14)}</button>`; }).join('')
      : '<p class="tiny muted">Guarde aqui seus exames de sangue: glicose, colesterol, vitaminas, hormônios… O app mostra a evolução de cada marcador.</p>'}</section>
    ${marc.length ? `<section class="card"><span class="eyebrow">Marcadores · último resultado</span>${fora.length ? `<p class="tiny muted">${fora.length} fora da faixa de referência geral. Converse com seu médico.</p>` : ''}
      ${marc.map(([k, x]) => { const st = statusEx(k, x.v), [n, u] = EXAMES[k]; return `<button class="pr-row" data-act="verMarcador" data-id="${k}"><span class="grow">${n}<span class="tiny muted">${shortDate(x.d)} · ref. ${faixaTxt(k)}</span></span>
        <b class="${st === 'ok' ? 'green-t' : 'warn-t'}">${fmt(x.v)} <small>${u}</small></b><span class="tag ${st === 'ok' ? 'ok' : 'warn'}">${st === 'ok' ? 'normal' : st}</span></button>`; }).join('')}
      <p class="tiny muted">Referências gerais para adultos; o laudo do seu laboratório pode ter outras. Isto não substitui a avaliação médica.</p></section>` : ''}`;
}

VIEWS.saude = () => {
  const tab = S.saudeTab || 'corpo', ms = medidas();
  return `<header class="top"><h1>Saúde</h1></header><div class="tabs-seg">${[['corpo', 'Corpo'], ['exames', 'Exames']].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="saudeTab" data-id="${k}">${n}</button>`).join('')}</div>
    <div class="dev-body">${tab === 'corpo' ? corpoHero() + corpoGrafico() + (ms.length ? `<section class="card list"><span class="eyebrow" style="display:block;padding-top:14px">Histórico</span>${ms.slice(0, 12).map((m) => `<button class="w-row" data-act="editarMedida" data-id="${m.id}"><div class="w-date"><b>${Number(m.date.slice(8))}</b><span>${MESES[Number(m.date.slice(5, 7)) - 1]}</span></div>
      <div class="grow"><span class="tiny">${Object.entries(MEDIDAS).filter(([k]) => m[k] !== undefined && m[k] !== '').map(([k, [n, u]]) => `${n}: <b>${fmt(m[k])} ${u}</b>`).join(' · ')}</span></div>${ic('chev', 14)}</button>`).join('')}</section>` : '') : examesView()}</div>`;
};

function formMedida(m = {}) {
  const ult = medidas()[0] || {};
  return `<form data-form="medida" data-id="${m.id || ''}"><label>Data<input type="date" name="date" value="${m.date || today()}" max="${today()}" required></label>
    <div class="grid2">${Object.entries(MEDIDAS).map(([k, [n, u]]) => `<label>${n} <span class="tiny muted">(${u})</span><input name="${k}" inputmode="decimal" value="${m[k] ?? ''}" placeholder="${ult[k] ?? ''}"></label>`).join('')}</div>
    <p class="tiny muted">Preencha só o que mediu. O valor cinza é o da última vez.</p>
    <div class="form-actions">${m.id ? `<button type="button" class="btn ghost danger" data-act="apagarMedida" data-id="${m.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar</button></div></form>`;
}
function formExame(x = {}) {
  const it = x.itens || {};
  return `<form data-form="exame" data-id="${x.id || ''}"><div class="grid2"><label>Data da coleta<input type="date" name="date" value="${x.date || today()}" max="${today()}" required></label><label>Laboratório<input name="lab" value="${esc(x.lab || '')}" placeholder="Opcional"></label></div>
    <p class="tiny muted">Preencha só os marcadores do seu laudo.</p><div class="ex-campos">${Object.entries(EXAMES).map(([k, [n, u]]) => `<label>${n} <span class="tiny muted">${u} · ref. ${faixaTxt(k)}</span><input name="e_${k}" inputmode="decimal" value="${it[k] ?? ''}"></label>`).join('')}</div>
    <label>Anotações<textarea name="notas" rows="2" placeholder="Ex.: pedido do Dr. Fulano; repetir em 6 meses">${esc(x.notas || '')}</textarea></label>
    <div class="form-actions">${x.id ? `<button type="button" class="btn ghost danger" data-act="apagarExame" data-id="${x.id}">${ic('trash', 16)} Apagar</button>` : ''}<button class="btn">Salvar exame</button></div></form>`;
}
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? undefined : n; };

Object.assign(ACT, {
  saudeTab: (k) => { S.saudeTab = k; S.lastPage = ''; render(); },
  saudeMetrica: (k) => { S.saudeMetrica = k; render(); },
  saudePer: (k) => { S.saudePer = k; render(); },
  novaMedida: () => openModal('Registrar medidas', formMedida()),
  editarMedida: (id) => openModal('Medidas', formMedida({ id, ...store.doc('medidas/' + id) })),
  apagarMedida: (id) => { if (confirm('Apagar este registro?')) { store.del('medidas/' + id); closeModal(); } },
  novoExame: () => openModal('Novo exame de sangue', formExame()),
  apagarExame: (id) => { if (confirm('Apagar este exame?')) { store.del('exames/' + id); closeModal(); } },
  verExame: (id) => openModal('Exame', formExame({ id, ...store.doc('exames/' + id) })),
  verMarcador: (k) => { const [n, u, lo, hi] = EXAMES[k], pts = exames().filter((x) => x.itens?.[k] !== undefined && x.itens[k] !== '').map((x) => ({ d: x.date, v: +x.itens[k] }));
    openModal(n, `<p class="tiny muted">Faixa de referência geral: ${faixaTxt(k)} (área destacada).</p>${lineChart(pts, { cor: '#30b0c7', unid: ' ' + u, faixa: [lo, hi] })}
      ${pts.slice().reverse().map((p) => `<div class="hrate"><span>${shortDate(p.d)} ${p.d.slice(0, 4)}</span><b class="${statusEx(k, p.v) === 'ok' ? 'green-t' : 'warn-t'}">${fmt(p.v)} ${u}</b><span></span></div>`).join('')}`); },
  saudeAjustes: () => { const c = cfg(); openModal('Altura e meta', `<form data-form="saudeCfg"><div class="grid2"><label>Altura (cm)<input name="altura" inputmode="numeric" value="${c.altura || ''}"></label><label>Meta de peso (kg)<input name="metaPeso" inputmode="decimal" value="${c.metaPeso || ''}"></label></div><div class="form-actions"><button class="btn">Salvar</button></div></form>`); },
});
Object.assign(FORMS, {
  medida: (v, f) => { const d = { date: v.date }; Object.keys(MEDIDAS).forEach((k) => { const n = num(v[k]); if (n !== undefined) d[k] = n; });
    if (Object.keys(d).length < 2) { toast('Preencha pelo menos uma medida'); return; }
    const novo = !f.dataset.id; store.set('medidas/' + (f.dataset.id || uid()), d); closeModal(); if (novo) floatXP(`+${XP.saude} XP`); },
  exame: (v, f) => { const itens = {}; Object.keys(EXAMES).forEach((k) => { const n = num(v['e_' + k]); if (n !== undefined) itens[k] = n; });
    if (!Object.keys(itens).length) { toast('Preencha pelo menos um marcador'); return; }
    const novo = !f.dataset.id; store.set('exames/' + (f.dataset.id || uid()), { date: v.date, lab: v.lab.trim(), itens, notas: v.notas.trim() }); closeModal();
    if (novo) { const fora = Object.entries(itens).filter(([k, n]) => statusEx(k, n) !== 'ok').length; toast(fora ? `Exame salvo. ${fora} marcador(es) fora da faixa geral.` : `Exame salvo. Tudo na faixa geral · +${XP.exame} XP`); } },
  saudeCfg: (v) => { store.merge('config/main', { altura: num(v.altura) || '', metaPeso: num(v.metaPeso) || '' }); closeModal(); toast('Salvo'); },
});
