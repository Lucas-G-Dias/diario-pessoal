/* ============ utilidades, datas, ícones e estado ============ */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoOf(new Date());
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoOf(d); };
const dow = (iso) => new Date(iso + 'T12:00:00').getDay();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const plural = (n, um, varios) => `${fmt(n)} ${n === 1 ? um : varios}`;
const words = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`; };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_L = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DIAS_C = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const longDate = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}.`; };
const shortDate = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
const lastDays = (n, end = today()) => Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
const dayOfYear = (iso = today()) => Math.round((new Date(iso + 'T12:00:00') - new Date(iso.slice(0, 4) + '-01-01T12:00:00')) / 864e5);
const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

/* ações de botão (data-act), formulários (data-form) e campos que mudam (data-chg), preenchidos por cada tela */
const ACT = {}, FORMS = {}, CHG = {}, VIEWS = {};
const S = { page: 'inicio', user: null, auth: 'loading', online: navigator.onLine, tap: null };

/* marca: Ritmo. A logo é um anel quase fechado (o dia sendo cumprido) com uma faísca (a conquista). */
const APP = 'Ritmo';
const LOGO = (s = 32) => `<svg viewBox="0 0 512 512" width="${s}" height="${s}" aria-hidden="true" class="logo"><defs><linearGradient id="lg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFA21F"/><stop offset=".55" stop-color="#FF5A1F"/><stop offset="1" stop-color="#E8243F"/></linearGradient></defs>
  <rect width="512" height="512" rx="116" fill="url(#lg${s})"/><circle cx="244" cy="280" r="128" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round" stroke-dasharray="650 804" transform="rotate(-25 244 280)"/>
  <path transform="translate(366 132) scale(62)" fill="#fff" d="M0-1C.14-.14.14-.14 1 0C.14.14.14.14 0 1C-.14.14-.14.14-1 0C-.14-.14-.14-.14 0-1Z"/></svg>`;

/* cores: lombadas, hábitos */
const SPINES = ['#1f4a40', '#9b2420', '#7a4a2a', '#d9cdb4', '#4a3328', '#a33a2a', '#264c4c', '#8b5a3c', '#e2d6bd', '#b23a3a'];
const lightSpine = (c) => ['#d9cdb4', '#e2d6bd'].includes(c);
const HCORES = ['#30b158', '#ff5a1f', '#ff9f0a', '#0a84ff', '#5e5ce6', '#bf5af2', '#ff375f', '#30b0c7'];

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  habit: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14l2.5 2.5L16 12"/>',
  gym: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  gear: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  flame: '<path d="M12 3s5 4.5 5 9.5a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 1-5.5 1-8z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  quote: '<path d="M7 7h4v4c0 3-2 5-4 6M14 7h4v4c0 3-2 5-4 6"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 2 4 4 4M16 6h4c0 3-2 4-4 4M12 13v4M8 20h8"/>',
  out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  pen: '<path d="M14 4l6 6-10 10H4v-6zM12 6l6 6"/>',
  cross: '<path d="M12 3v18M7 8h10"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M12 12v3l1.5 1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  side: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  cake: '<path d="M4 21h16M5 21v-7h14v7M5 16c2 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3 1.5 4 0M12 14v-3M12 8a1.5 1.5 0 0 0 1.5-1.5C13.5 5 12 3 12 3s-1.5 2-1.5 3.5A1.5 1.5 0 0 0 12 8z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
};
const ic = (n, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* humor: 1 (péssimo) a 5 (ótimo), carinhas desenhadas */
const MOODS = [['Péssimo', '#ff453a', 'M8 17c2-2 6-2 8 0'], ['Ruim', '#ff9f0a', 'M8.5 16.5c2-1 5-1 7 0'], ['Ok', '#c7b22e', 'M8.5 15.5h7'], ['Bem', '#34c759', 'M8.5 14.5c2 1.5 5 1.5 7 0'], ['Ótimo', '#0a84ff', 'M8 14c2 3 6 3 8 0']];
const moodIc = (n, s = 28) => { const [nome, cor, boca] = MOODS[n - 1] || MOODS[2]; return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-label="${nome}" role="img"><circle cx="12" cy="12" r="10" fill="${cor}"/><circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/><path d="${boca}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`; };

let TOAST_T = null;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  clearTimeout(TOAST_T); TOAST_T = setTimeout(() => t.classList.remove('on'), 2600);
}
