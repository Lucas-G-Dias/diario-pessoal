/* Revisão de responsividade: abre todas as telas em 6 larguras (360 a 1440 px) e acusa qualquer elemento que vaze para o lado.
   Uso: python3 -m http.server 8765  (na pasta do projeto)  e depois  node tests/responsivo.cjs [pasta-dos-prints] */
const { chromium } = require('playwright');
const OUT = process.argv[2] || '/tmp'; // pasta para os prints (opcional)
const URL_APP = process.argv[3] || 'http://localhost:8765/';
const WIDTHS = [360, 390, 768, 1024, 1280, 1440];
const PAGES = ['inicio', 'habitos', 'treino', 'leitura', 'devocional', 'escrita', 'saude', 'dieta', 'semana', 'metas', 'conquistas', 'menu', 'ajustes', 'ano', 'sessao'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 860 } });
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  await p.route('**/js/00-config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "const SB_URL='',SB_KEY='',VAPID='';" }));
  await p.goto(URL_APP); await p.waitForTimeout(900);
  await p.evaluate(() => {
    const t = today(), W = (k, v) => store.set(k, v, true); W('config/main', { name: 'Lucas Dias', birth: '1995-03-10', tourDone: true, altura: 178 }); W('medidas/m1', { date: addDays(t, -9), peso: 82 }); W('medidas/m2', { date: t, peso: 81.4 }); W('exames/e1', { date: t, lab: 'Fleury', itens: { glicose: 92, ldl: 140 } }); W('config/dieta', { refeicoes: DIETA_PADRAO.map(([id, nome, hora]) => ({ id, nome, hora, dias: 'todos' })), agua: 8, desde: addDays(t, -5) }); W('dietalog/' + t, { r: { cafe: 'ok', lanche1: 'fora' }, agua: 3 });
    [['O Temor do sábio', 'Patrick Rothfuss', 1000, 'lendo', 340], ['O nome do vento', 'Patrick Rothfuss', 656, 'lido', 656], ['Hábitos Atômicos', 'James Clear', 320, 'quero', 0], ['A Meta', 'Eliyahu Goldratt', 400, 'quero', 0]]
      .forEach(([title, author, pages, status, page], i) => W('books/b' + i, { title, author, pages, status, page, color: SPINES[(i * 3) % 10], updated: 10 - i, finished: status === 'lido' ? addDays(t, -5) : '' }));
    W('habits/h1', { name: 'Beber água', days: [], target: 8, color: HCORES[3], created: addDays(t, -40) }); W('habits/h2', { name: 'Meditar 10 minutos todos os dias pela manhã', days: [], color: HCORES[0], created: addDays(t, -40) });
    for (let i = 1; i < 40; i++) { const d = addDays(t, -i); W('reading/' + d, { pages: 15 + i % 9 }); W('habitlog/' + d, { ids: { h1: 8, h2: i % 3 > 0 } });
      if (i % 3 === 0) W('workouts/w' + i, { date: d, name: 'Ficha A · Peito e tríceps', type: 'Musculação', min: 50, ex: [{ id: 'supino-reto', sets: [{ kg: 60 + i, reps: 10 }] }], volume: 2000, prs: i % 9 ? [] : [{ ex: 'supino-reto', kind: 'peso', val: 60 + i }] });
      if (i % 4 === 0) W('journal/j' + i, { date: d, mood: 4, text: 'Dia produtivo.', words: 2 }); }
    W('routines/r1', { name: 'Ficha A · Peito e tríceps', ex: ['supino-reto', 'crucifixo', 'triceps-pulley'], color: HCORES[1] });
    W('goals/g1', { kind: 'treinos', target: 16, period: 'mes', created: t.slice(0, 7) + '-01' });
    const s = addDays(t, -5); W('plano/ano', { start: s, ancoras: [{ idx: 0, data: s }], pv: {} }); W('bible/main', { plan: 'ano', read: {} });
    W('session/treino', { start: Date.now() - 600000, name: 'Ficha A', ex: [{ id: 'supino-reto', sets: [{ kg: 60, reps: 10, done: true }, { kg: '', reps: '', done: false }] }] });
    delete store.docs['config/seen']; GAME = null; STATS.clear(); celebrate(); S.anoDia = 3;
  });
  const report = [];
  for (const w of WIDTHS) {
    await p.setViewportSize({ width: w, height: w < 800 ? 860 : 900 });
    for (const pg of PAGES) {
      await p.evaluate((x) => { S.page = x; S.lastPage = ''; render(); }, pg); await p.waitForTimeout(150);
      const r = await p.evaluate(() => {
        const W = document.documentElement.clientWidth, out = [];
        if (document.documentElement.scrollWidth > W + 1) out.push('página rola de lado: ' + document.documentElement.scrollWidth);
        document.querySelectorAll('main *').forEach((el) => { const b = el.getBoundingClientRect(); if (b.width && b.right > W + 2 && !el.closest('.prat-row,.tabs-seg,.heatmap,.ex-list,.atalhos') && getComputedStyle(el).position !== 'fixed') out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} vai até ${Math.round(b.right)}`); });
        return [...new Set(out)].slice(0, 6);
      });
      if (r.length) report.push(`${w}px ${pg}: ${r.join(' | ')}`);
    }
    if (w === 768 || w === 1024) for (const pg of ['inicio', 'treino', 'leitura']) { await p.evaluate((x) => { S.page = x; S.lastPage = ''; render(); }, pg); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/resp-${w}-${pg}.png` }); }
  }
  console.log(report.length ? report.join('\n') : 'nenhum vazamento'); console.log('errors:', errs); await b.close();
})();
