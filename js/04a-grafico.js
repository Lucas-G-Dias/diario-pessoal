/* ============ Gráfico de linha interativo: tocar ou passar o mouse mostra a data e o valor de cada ponto ============
   lineChart(pontos [{ d: 'aaaa-mm-dd', v: número }], { cor, unid, alvo, faixa: [min, max], h }) */
function lineChart(pts, o = {}) {
  pts = pts.filter((p) => p.v !== '' && p.v != null && !isNaN(p.v)).sort((a, b) => a.d.localeCompare(b.d));
  if (!pts.length) return '<p class="tiny muted">Sem dados neste período.</p>';
  const W = 320, H = o.h || 150, pl = 34, pr = 10, pt = 14, pb = 22, cor = o.cor || 'var(--brand)', unid = o.unid || '';
  const vs = pts.map((p) => +p.v).concat(o.alvo != null ? [+o.alvo] : [], o.faixa ? o.faixa.filter((x) => x != null) : []);
  let lo = Math.min(...vs), hi = Math.max(...vs); if (lo === hi) { lo -= 1; hi += 1; } const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
  const t0 = Date.parse(pts[0].d), t1 = Date.parse(pts[pts.length - 1].d) || t0 + 1;
  const X = (d) => (pts.length === 1 ? (pl + W - pr) / 2 : pl + ((Date.parse(d) - t0) / Math.max(1, t1 - t0)) * (W - pl - pr)), Y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const xy = pts.map((p) => [X(p.d), Y(+p.v)]), linha = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const ticks = [lo + pad, (lo + hi) / 2, hi - pad].map((v) => `<text x="${pl - 6}" y="${Y(v) + 3}" text-anchor="end">${fmt(Math.round(v * 10) / 10)}</text><line class="gl" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/>`).join('');
  const faixa = o.faixa ? `<rect class="faixa" x="${pl}" width="${W - pl - pr}" y="${Y(o.faixa[1] ?? hi)}" height="${Math.max(0, Y(o.faixa[0] ?? lo) - Y(o.faixa[1] ?? hi))}"/>` : '';
  const alvo = o.alvo != null ? `<line class="alvo" x1="${pl}" x2="${W - pr}" y1="${Y(o.alvo)}" y2="${Y(o.alvo)}"/><text class="alvo-t" x="${W - pr}" y="${Y(o.alvo) - 4}" text-anchor="end">meta ${fmt(o.alvo)}${unid}</text>` : '';
  const datas = [pts[0], pts[pts.length - 1]].map((p, i) => `<text x="${i ? W - pr : pl}" y="${H - 6}" text-anchor="${i ? 'end' : 'start'}">${shortDate(p.d)}</text>`).join('');
  const dados = esc(JSON.stringify(pts.map((p, i) => [xy[i][0], xy[i][1], shortDate(p.d) + ' ' + p.d.slice(0, 4), fmt(p.v) + unid])));
  const id = 'lc' + Math.random().toString(36).slice(2, 7);
  return `<div class="lchart" data-pts="${dados}" style="--lc:${cor}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico: de ${fmt(pts[0].v)}${unid} em ${shortDate(pts[0].d)} a ${fmt(pts[pts.length - 1].v)}${unid} em ${shortDate(pts[pts.length - 1].d)}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor}" stop-opacity=".25"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></linearGradient></defs>
    ${faixa}${ticks}${alvo}<path d="${linha} L${xy[xy.length - 1][0]} ${H - pb} L${xy[0][0]} ${H - pb}Z" fill="url(#${id})"/><path class="ln" d="${linha}" stroke="${cor}"/>
    ${xy.map((p) => `<circle class="pt" cx="${p[0]}" cy="${p[1]}" r="3.2" fill="${cor}"/>`).join('')}${datas}
    <line class="cursor" y1="${pt}" y2="${H - pb}" x1="-9" x2="-9"/><circle class="cur-pt" r="6" cx="-9" cy="-9" stroke="${cor}"/></svg><div class="lc-tip" hidden></div></div>`;
}
/* interação: acha o ponto mais perto do dedo/mouse */
function lcMover(e) {
  const box = e.target.closest('.lchart'); if (!box) return;
  const svg = box.querySelector('svg'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = ((e.clientX - r.left) / r.width) * vb.width;
  const pts = JSON.parse(box.dataset.pts); let best = pts[0];
  for (const p of pts) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  box.classList.add('ativo');
  const cur = svg.querySelector('.cursor'), cp = svg.querySelector('.cur-pt'), tip = box.querySelector('.lc-tip');
  cur.setAttribute('x1', best[0]); cur.setAttribute('x2', best[0]); cp.setAttribute('cx', best[0]); cp.setAttribute('cy', best[1]);
  tip.hidden = false; tip.innerHTML = `<b>${best[3]}</b><span>${best[2]}</span>`;
  const px = (best[0] / vb.width) * r.width; tip.style.left = clamp(px, 50, r.width - 50) + 'px'; tip.style.top = Math.max(0, (best[1] / vb.height) * r.height - 48) + 'px';
}
document.addEventListener('pointermove', (e) => { if (e.target.closest && e.target.closest('.lchart')) lcMover(e); }, { passive: true });
document.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('.lchart')) { lcMover(e); haptic(5); } }, { passive: true });
