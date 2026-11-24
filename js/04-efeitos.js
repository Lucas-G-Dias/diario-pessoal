/* ============ efeitos: XP flutuante, confete, vibração, som, medalhas, anéis ============ */
const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const haptic = (p = 12) => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* sem suporte */ } };

/* "+10 XP" subindo de onde a pessoa tocou */
function floatXP(txt) {
  haptic();
  if (calmo() || !S.tap) return;
  const el = document.createElement('div');
  el.className = 'xp-float'; el.textContent = txt;
  el.style.left = S.tap.x + 'px'; el.style.top = S.tap.y + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1100);
}

/* confete em canvas, ~1,6 s */
function confetti(n = 110) {
  if (calmo()) return;
  haptic([20, 40, 20]);
  const c = document.createElement('canvas'), x = c.getContext('2d'), W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1;
  c.className = 'confetti'; c.width = W * dpr; c.height = H * dpr; x.scale(dpr, dpr); document.body.appendChild(c);
  const cores = ['#ff5a1f', '#ffa21f', '#30b158', '#0a84ff', '#5e5ce6', '#ff375f', '#ffd60a'];
  const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 4,
    r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cores[Math.floor(Math.random() * cores.length)] }));
  const t0 = performance.now();
  (function frame(t) {
    const k = (t - t0) / 1600; x.clearRect(0, 0, W, H);
    for (const p of ps) { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      x.save(); x.globalAlpha = Math.max(0, 1 - k); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }
    if (k < 1) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

/* bipe curto (fim do descanso) */
function beep() {
  try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.15, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.5);
    o.start(); o.stop(a.currentTime + 0.5); } catch { /* sem áudio */ }
}

/* anel de progresso (SVG) */
function ring(pct, cor, size = 54, inner = '') {
  const r = (size - 8) / 2, C = 2 * Math.PI * r, p = clamp(pct, 0, 1);
  return `<span class="ring-wrap" style="width:${size}px;height:${size}px"><svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="6"/>
    <circle class="ring-v" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" style="--c:${C}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>${inner ? `<span class="ring-in">${inner}</span>` : ''}</span>`;
}

/* medalha: selo com as cores do nível (0 = bloqueada) */
const TIER_COR = [['#cfc6b6', '#b4aa98'], ['#d08a4a', '#8a4f22'], ['#e6e8ea', '#8d949b'], ['#f3cf6a', '#a87a1a'], ['#e0574a', '#6d1410']];
function medalSVG(tier, icon, size = 64) {
  const [a, b] = TIER_COR[tier] || TIER_COR[0], id = 'm' + Math.random().toString(36).slice(2, 7);
  const raios = tier >= 4 ? Array.from({ length: 12 }, (_, i) => `<path d="M32 32 L${32 + 31 * Math.cos(i * Math.PI / 6 - 0.13)} ${32 + 31 * Math.sin(i * Math.PI / 6 - 0.13)} L${32 + 31 * Math.cos(i * Math.PI / 6 + 0.13)} ${32 + 31 * Math.sin(i * Math.PI / 6 + 0.13)}Z" fill="${a}" opacity=".35"/>`).join('') : '';
  return `<svg class="medal-svg ${tier ? '' : 'locked'}" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <defs><radialGradient id="${id}" cx="35%" cy="30%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>${raios}
    <circle cx="32" cy="32" r="24" fill="url(#${id})"/><circle cx="32" cy="32" r="19" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="2 3"/>
    <g transform="translate(20 20)" color="${tier ? '#fff' : '#8a8070'}">${ic(icon, 24)}</g></svg>`;
}

/* conquista desbloqueada: medalha grande que gira e cai no lugar */
function unlockModal(c, tier, total) {
  confetti(140);
  openModal('Conquista desbloqueada', `<div class="unlock"><div class="unlock-medal">${medalSVG(tier + 1, c.icon, 150)}</div>
    <span class="eyebrow red">${TIERS[tier]}</span><h3 class="serif">${esc(c.nome)}</h3>
    <p class="muted">${fmt(c.tiers[tier])} ${esc(c.unit)}${total > 1 ? ` · e mais ${total - 1} ${total - 1 === 1 ? 'conquista' : 'conquistas'}` : ''}</p>
    <button class="btn wide" data-page="conquistas">Ver conquistas</button></div>`);
}

/* minigráfico de linha com área (cartões de números) */
function sparkline(vals, cor, w = 120, h = 36) {
  const max = Math.max(1, ...vals), n = vals.length, pts = vals.map((v, i) => [(i / (n - 1)) * w, h - 3 - (v / max) * (h - 8)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '), id = 'sp' + Math.random().toString(36).slice(2, 7);
  return `<svg class="spk" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor}" stop-opacity=".28"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/* barra de progresso */
const progressBar = (pct, cls = '') => `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(clamp(pct, 0, 1) * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${clamp(pct, 0, 1) * 100}%"></i></div>`;
